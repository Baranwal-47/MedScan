import Tesseract from 'tesseract.js';

/**
 * Performs OCR on an image using Tesseract.js
 * @param imageData Base64 encoded image data
 * @returns Promise that resolves with the recognized text
 */
export async function recognizeImageText(imageData: string): Promise<string> {
  try {
    const result = await Tesseract.recognize(
      imageData,
      'eng',
      { 
        logger: m => console.log(m),
        errorHandler: err => console.error(err)
      }
    );
    
    return result.data.text;
  } catch (error) {
    console.error('Tesseract OCR error:', error);
    throw new Error('Failed to recognize text from image');
  }
}

/**
 * Pre-processes the OCR results to format prescription information
 * @param text Raw text from OCR
 * @returns Structured information about the prescription
 */
export function preprocessPrescriptionText(text: string): { 
  doctorName?: string; 
  medications: string[];
  dosages: string[];
  date?: string;
  instructions?: string;
} {
  // Very basic preprocessing - in a real app, this would be more sophisticated
  // or we'd rely more on the AI component
  
  const lines = text.split('\n').filter(line => line.trim());
  
  // Try to extract doctor's name (assumes format "Dr. Name")
  const doctorLine = lines.find(line => line.includes('Dr.') || line.toLowerCase().includes('doctor'));
  const doctorName = doctorLine ? doctorLine.trim() : undefined;
  
  // Try to extract date (very basic pattern matching)
  const dateLine = lines.find(line => 
    line.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/) || // mm/dd/yyyy
    line.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2},?\s+\d{2,4}/i) // Month dd, yyyy
  );
  const date = dateLine ? dateLine.trim() : undefined;
  
  // Try to extract medications (this is a simplistic approach)
  const medications: string[] = [];
  const dosages: string[] = [];
  
  // Look for common medication patterns
  for (const line of lines) {
    // Look for lines with potential dosage patterns (e.g., "50mg", "100 mg", "2.5 mL")
    if (line.match(/\d+\s*(mg|mcg|ml|g|tab|cap)/i)) {
      // Try to split the medication name from the dosage
      const parts = line.split(/(\d+\s*(mg|mcg|ml|g|tab|cap))/i);
      if (parts.length > 1) {
        const medName = parts[0].trim();
        const dosage = parts[1].trim();
        
        if (medName && dosage) {
          medications.push(medName);
          dosages.push(dosage);
        }
      } else {
        // If we can't split, just add the whole line as a potential medication
        medications.push(line.trim());
        dosages.push('');
      }
    }
  }
  
  // Try to extract instructions (look for common instruction phrases)
  const instructionKeywords = ['take', 'use', 'apply', 'swallow', 'inject', 'with food', 'with water', 'before meals', 'after meals', 'daily', 'twice daily', 'times a day'];
  const instructionLines = lines.filter(line => 
    instructionKeywords.some(keyword => line.toLowerCase().includes(keyword))
  );
  const instructions = instructionLines.length > 0 ? instructionLines.join('. ') : undefined;
  
  return {
    doctorName,
    medications,
    dosages,
    date,
    instructions
  };
}
