const express = require('express');
const multer = require('multer');
const Prescription = require('../models/Prescription');
const Medicine = require('../models/Medicine');
const protect = require('../middleware/authMiddleware');
const { uploadBuffer } = require('../config/cloudinary');
const { extractText } = require('../services/ocrService');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Dosage-form / instruction prefixes that precede the actual brand name.
const DOSE_FORM = /^(tab|tabs|cap|caps|inj|syp|syr|susp|oint|gel|cream|drops?|adv|rx)[.\s:,-]+/i;

// Pull medicine-name candidates out of raw OCR text.
const candidateLines = (text) =>
  Array.from(new Set(
    text
      .split(/\r?\n/)
      // braces group meal instructions ("after meals { Tab. X") — split them off
      .flatMap(l => l.split(/[{}]/))
      .map(l => l.replace(/^[\s\d.\-•*)|—]+/, '').replace(DOSE_FORM, '').trim())
      // needs a real word, and skip contact/header lines
      .filter(l => /[a-zA-Z]{4,}/.test(l) && !/www\.|@|\||https?:|ph[.:]/i.test(l))
  )).slice(0, 10);

const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Match candidate names against the catalogue. Handwritten OCR often misreads
// a single letter ("Angmentin" for Augmentin), so after an exact prefix match
// we retry with one-character tolerance on the brand word.
// ponytail: single-substitution regex fuzz; swap for a text index + trigram
// search if matching quality still disappoints.
const matchAgainstCatalogue = async (names) => {
  const matched = [];
  const unmatched = [];
  const find = (pattern) =>
    Medicine.findOne({ name: { $regex: pattern, $options: 'i' } })
      .select('name price image_url prescriptionRequired manufacturer');

  for (const query of names) {
    const firstWord = query.split(/\s+/)[0].replace(/[^a-zA-Z-]/g, '');
    let med = null;

    if (firstWord.length >= 4) {
      // 1. exact prefix on the brand word
      med = await find(`^${escapeRx(firstWord)}`);
      // 2. hyphenated brand names ("Pan-D" vs catalogue "Panday D"):
      // retry with separators collapsed out
      if (!med && /-/.test(firstWord)) {
        med = await find(`^${escapeRx(firstWord.replace(/-/g, ''))}`);
      }
      // 3. one wrong/extra trailing char: prefix of the first 6 letters
      if (!med && firstWord.length >= 6) med = await find(`^${escapeRx(firstWord.slice(0, 6))}`);
      // 4. one misread char anywhere: try each position as a wildcard.
      // 4-letter fragments fuzz-match everything, so only allow them when
      // the line carries a dose ("ParD 40ng") — a strong medicine signal.
      const hasDose = /\d+\s*(mg|mcg|ml|g|ng|iu)\b/i.test(query);
      if (!med && (firstWord.length >= 5 || (firstWord.length === 4 && hasDose))) {
        const variants = [];
        for (let i = 1; i < Math.min(firstWord.length, 12); i++) {
          variants.push(`^${escapeRx(firstWord.slice(0, i))}.${escapeRx(firstWord.slice(i + 1))}`);
        }
        med = await find(variants.join('|'));
      }
    }

    if (med) matched.push({ medicine: med, query });
    else unmatched.push(query);
  }
  return { matched, unmatched };
};

// POST /api/prescriptions/scan — upload image, OCR it, match medicines,
// store the prescription. Client may pass `clientText` (Tesseract fallback)
// used when server OCR is unavailable.
router.post('/scan', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Prescription image is required' });
    }
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ success: false, message: 'Only image files are allowed' });
    }

    const uploaded = await uploadBuffer(req.file.buffer, 'prescriptions', req.file.mimetype);

    let { text, engine, medicines } = await extractText(req.file.buffer, req.file.mimetype);
    if (!text.trim() && !medicines?.length && req.body.clientText?.trim()) {
      text = req.body.clientText;
      engine = 'client';
    }

    // Gemini returns structured medicines — use those names directly and
    // skip the line-parsing heuristics.
    const names = medicines?.length ? medicines.map(m => m.name) : candidateLines(text);
    const { matched, unmatched } = await matchAgainstCatalogue(names);

    // Show dosage/frequency alongside the matched name ("read as ...")
    if (medicines?.length) {
      const detail = (name) => {
        const g = medicines.find(m => m.name === name);
        return g ? [g.name, g.dosage, g.frequency, g.duration].filter(Boolean).join(' · ') : name;
      };
      matched.forEach(m => { m.query = detail(m.query); });
    }

    const prescription = await Prescription.create({
      user: req.user._id,
      imageUrl: uploaded.secure_url,
      extractedText: text,
      ocrEngine: engine,
      matchedMedicines: matched.map(m => ({ medicine: m.medicine._id, query: m.query })),
      unmatchedNames: unmatched
    });

    res.status(201).json({
      success: true,
      data: {
        prescriptionId: prescription._id,
        imageUrl: uploaded.secure_url,
        extractedText: text,
        ocrEngine: engine,
        matches: matched,
        unmatched
      }
    });
  } catch (error) {
    console.error('Prescription scan error:', error);
    res.status(500).json({ success: false, message: 'Failed to process prescription' });
  }
});

// GET /api/prescriptions — current user's prescriptions
router.get('/', protect, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ user: req.user._id })
      .populate('matchedMedicines.medicine', 'name price image_url')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: prescriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/prescriptions/:id — owner or admin
router.get('/:id', protect, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('matchedMedicines.medicine', 'name price image_url prescriptionRequired');

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }
    if (prescription.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: prescription });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
