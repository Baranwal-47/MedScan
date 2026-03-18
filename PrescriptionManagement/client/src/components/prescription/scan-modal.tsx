import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTesseract } from "@/hooks/use-prescription-scanner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ScanModal({ isOpen, onClose }: ScanModalProps) {
  const { toast } = useToast();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualText, setManualText] = useState("");
  
  const { recognizeText, isRecognizing, recognizedText } = useTesseract();

  const scanMutation = useMutation({
    mutationFn: async (imageData: string) => {
      const response = await apiRequest("POST", "/api/scan-prescription", {
        image: imageData
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Prescription Scanned Successfully",
        description: `${data.medications.length} medications found.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/medications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/schedules/today'] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to scan prescription",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      setCapturedImage(base64data);
      
      // Attempt to recognize text with Tesseract as a fallback/preprocessing step
      recognizeText(base64data);
    };
    reader.readAsDataURL(file);
  };

  const handleTakePhoto = () => {
    // In a real implementation, this would trigger the device camera
    // For now, we'll simulate by clicking the file input
    document.getElementById('file-input')?.click();
  };

  const handleProcessPrescription = () => {
    if (capturedImage) {
      scanMutation.mutate(capturedImage);
    } else if (manualEntry && manualText) {
      // Handle manual text entry
      toast({
        title: "Manual Entry Submitted",
        description: "Processing your prescription information.",
      });
      onClose();
    } else {
      toast({
        title: "Missing Information",
        description: "Please capture an image or enter prescription details.",
        variant: "destructive"
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed z-20 inset-0 overflow-y-auto" onClick={onClose}>
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div 
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg leading-6 font-sans font-medium text-gray-900" id="modal-headline">
                {manualEntry ? "Enter Prescription Details" : "Scan Your Prescription"}
              </h3>
              <button type="button" className="text-gray-400 hover:text-gray-500" onClick={onClose}>
                <span className="material-icons">close</span>
              </button>
            </div>
            
            <div className="mt-2">
              {!manualEntry ? (
                <>
                  <div className="bg-gray-100 rounded-lg overflow-hidden aspect-[4/3] relative flex flex-col items-center justify-center">
                    {capturedImage ? (
                      <>
                        <img 
                          src={capturedImage} 
                          alt="Captured prescription" 
                          className="w-full h-full object-contain"
                        />
                        <Button 
                          variant="outline" 
                          className="absolute top-2 right-2 bg-white"
                          onClick={() => setCapturedImage(null)}
                        >
                          Replace
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="scanner-animation"></div>
                        <div className="absolute inset-0 border-2 border-dashed border-primary/50 m-6 pointer-events-none"></div>
                        <span className="material-icons text-5xl text-gray-400 mb-2">photo_camera</span>
                        <p className="text-sm text-gray-500">Position your prescription in the frame</p>
                      </>
                    )}
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      Make sure the prescription is well-lit and all text is clearly visible. The system will automatically detect and extract medication information.
                    </p>
                  </div>
                  
                  <input 
                    type="file" 
                    id="file-input" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileInputChange}
                  />
                  
                  {isRecognizing && (
                    <Alert className="mt-4">
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                      <AlertDescription>
                        Recognizing text in image...
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {recognizedText && (
                    <div className="mt-4 border rounded-md p-2 bg-gray-50">
                      <h4 className="text-sm font-medium mb-1">Preview:</h4>
                      <div className="max-h-24 overflow-y-auto text-xs font-mono bg-white p-2 rounded">
                        {recognizedText}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-3">
                  <p className="text-sm text-gray-500 mb-3">
                    Enter the details from your prescription
                  </p>
                  <Textarea 
                    placeholder="Enter all details from your prescription..."
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    rows={10}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button
              className="w-full sm:w-auto sm:ml-3"
              onClick={handleProcessPrescription}
              disabled={scanMutation.isPending}
            >
              {scanMutation.isPending ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                manualEntry ? "Process Text" : "Take Photo"
              )}
            </Button>
            
            <Button
              variant="outline"
              className="mt-3 w-full sm:mt-0 sm:w-auto sm:mr-3"
              onClick={() => manualEntry ? setManualEntry(false) : handleFileInputChange}
              disabled={scanMutation.isPending}
            >
              {manualEntry ? "Cancel" : "Upload Image"}
            </Button>
            
            <Button
              variant="ghost"
              className="mt-3 w-full sm:mt-0 sm:w-auto"
              onClick={() => setManualEntry(!manualEntry)}
              disabled={scanMutation.isPending}
            >
              <span className="material-icons text-sm mr-2">
                {manualEntry ? "photo_camera" : "edit"}
              </span>
              {manualEntry ? "Use Camera" : "Enter Manually"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
