// Server-side OCR chain: Gemini vision (structured extraction) → TrOCR
// (HuggingFace Inference API) → ocr.space → none (caller falls back to
// client-side Tesseract text if provided).

// Vision-LLM extraction: reads handwriting contextually and returns the
// medicines as structured data, not just raw characters.
const geminiVision = async (buffer, mimetype) => {
  const prompt = `You are reading a doctor's prescription image (often handwritten).
Return ONLY JSON with this exact shape:
{"raw_text": "<full transcription of the prescription>",
 "medicines": [{"name": "<brand name>", "dosage": "<e.g. 625mg>", "frequency": "<e.g. 1-0-1>", "duration": "<e.g. 5 days>"}]}
Rules:
- Correct obvious handwriting misreads to real medicine brand names sold in India (e.g. "Angmentin" -> "Augmentin").
- Include topical/dental products (gels, ointments, drops) as medicines.
- Do NOT include doctor, clinic, or patient details in "medicines".
- Omit dosage/frequency/duration fields you cannot read.`;

  const res = await fetch(
    // gemini-flash-latest: rolling alias — pinned models get closed to new API keys
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimetype, data: buffer.toString('base64') } },
            { text: prompt }
          ]
        }],
        generationConfig: { response_mime_type: 'application/json', temperature: 0 }
      })
    }
  );
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const json = await res.json();
  const out = (json.candidates?.[0]?.content?.parts || []).map(p => p.text).join('');
  const parsed = JSON.parse(out);
  const medicines = (parsed.medicines || []).filter(m => m?.name);
  if (!medicines.length && !parsed.raw_text?.trim()) throw new Error('Gemini returned nothing usable');
  return { text: parsed.raw_text || '', medicines };
};

const trocr = async (buffer) => {
  const res = await fetch(
    'https://api-inference.huggingface.co/models/microsoft/trocr-base-handwritten',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/octet-stream'
      },
      body: buffer
    }
  );
  if (!res.ok) throw new Error(`TrOCR HTTP ${res.status}`);
  const json = await res.json();
  // HF returns [{ generated_text: "..." }]
  const text = Array.isArray(json) ? json.map(r => r.generated_text).join('\n') : '';
  if (!text.trim()) throw new Error('TrOCR returned empty text');
  return text;
};

const ocrSpace = async (buffer, mimetype) => {
  const form = new FormData();
  form.append('apikey', process.env.OCR_SPACE_API_KEY);
  form.append('base64Image', `data:${mimetype};base64,${buffer.toString('base64')}`);
  form.append('OCREngine', '2');

  const res = await fetch('https://api.ocr.space/parse/image', { method: 'POST', body: form });
  if (!res.ok) throw new Error(`ocr.space HTTP ${res.status}`);
  const json = await res.json();
  if (json.IsErroredOnProcessing) throw new Error(json.ErrorMessage?.[0] || 'ocr.space error');
  const text = (json.ParsedResults || []).map(r => r.ParsedText).join('\n');
  if (!text.trim()) throw new Error('ocr.space returned empty text');
  return text;
};

// Returns { text, engine, medicines? }. Never throws — falls through the
// chain. `medicines` (structured [{name, dosage, frequency, duration}]) is
// only present for the Gemini engine.
const extractText = async (buffer, mimetype) => {
  if (process.env.GEMINI_API_KEY) {
    // Free-tier Gemini throws transient 429/503s — retry twice before
    // falling back to the lower-quality engines.
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const { text, medicines } = await geminiVision(buffer, mimetype);
        return { text, medicines, engine: 'gemini' };
      } catch (e) {
        const transient = /HTTP (429|5\d\d)/.test(e.message);
        console.warn(`Gemini vision attempt ${attempt} failed:`, e.message);
        if (!transient || attempt === 3) break;
        await new Promise(r => setTimeout(r, 2000 * attempt));
      }
    }
  }
  if (process.env.HUGGINGFACE_API_KEY) {
    try {
      return { text: await trocr(buffer), engine: 'trocr' };
    } catch (e) {
      console.warn('TrOCR failed, falling back:', e.message);
    }
  }
  if (process.env.OCR_SPACE_API_KEY) {
    try {
      return { text: await ocrSpace(buffer, mimetype), engine: 'ocrspace' };
    } catch (e) {
      console.warn('ocr.space failed, falling back:', e.message);
    }
  }
  return { text: '', engine: 'none' };
};

module.exports = { extractText };
