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

// Pull medicine-name candidates out of raw OCR text.
const candidateLines = (text) =>
  Array.from(new Set(
    text
      .split(/\r?\n/)
      .map(l => l.replace(/^[\s\d.\-•*)]+/, '').trim())
      .filter(l => l.length >= 3 && /[a-zA-Z]{3,}/.test(l))
  )).slice(0, 10);

// Match candidate names against the catalogue (regex prefix/substring search,
// same approach as /medicines/search).
const matchAgainstCatalogue = async (names) => {
  const matched = [];
  const unmatched = [];
  for (const query of names) {
    // Try the first word (usually the brand name) and the full line
    const firstWord = query.split(/\s+/)[0];
    const med = await Medicine.findOne({
      $or: [
        { name: { $regex: `^${firstWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, $options: 'i' } },
        { name: { $regex: query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
      ]
    }).select('name price image_url prescriptionRequired manufacturer');

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

    const uploaded = await uploadBuffer(req.file.buffer, 'medscan/prescriptions', req.file.mimetype);

    let { text, engine } = await extractText(req.file.buffer, req.file.mimetype);
    if (!text.trim() && req.body.clientText?.trim()) {
      text = req.body.clientText;
      engine = 'client';
    }

    const names = candidateLines(text);
    const { matched, unmatched } = await matchAgainstCatalogue(names);

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
