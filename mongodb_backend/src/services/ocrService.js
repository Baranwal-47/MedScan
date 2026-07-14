// Server-side OCR chain: TrOCR (HuggingFace Inference API) → ocr.space →
// none (caller falls back to client-side Tesseract text if provided).

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

// Returns { text, engine }. Never throws — falls through the chain.
const extractText = async (buffer, mimetype) => {
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
