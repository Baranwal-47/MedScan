import { useState, useCallback } from 'react';
import { recognizeImageText, preprocessPrescriptionText } from '@/lib/tesseract';

/**
 * Hook for scanning and processing prescription images
 */
export function useTesseract() {
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string | null>(null);
  const [processedData, setProcessedData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Process an image using Tesseract OCR
   */
  const recognizeText = useCallback(async (imageData: string) => {
    setIsRecognizing(true);
    setError(null);
    
    try {
      // Perform OCR on the image
      const text = await recognizeImageText(imageData);
      setRecognizedText(text);
      
      // Pre-process the recognized text
      const processed = preprocessPrescriptionText(text);
      setProcessedData(processed);
      
      return { text, processed };
    } catch (err: any) {
      const errorMessage = err?.message || 'Unknown error occurred during text recognition';
      setError(errorMessage);
      console.error('Tesseract error:', err);
      return null;
    } finally {
      setIsRecognizing(false);
    }
  }, []);
  
  /**
   * Reset the scanner state
   */
  const reset = useCallback(() => {
    setRecognizedText(null);
    setProcessedData(null);
    setError(null);
  }, []);
  
  return {
    recognizeText,
    isRecognizing,
    recognizedText,
    processedData,
    error,
    reset
  };
}
