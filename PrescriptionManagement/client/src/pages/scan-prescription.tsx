import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useTesseract } from "@/hooks/use-prescription-scanner";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/context/CartContext";

import { Loader, PlusCircle, Trash2, Check, XCircle, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ManualMed {
  name: string;
  composition: string;
}

interface SearchResult {
  found: boolean;
  medicineId?: string;
  medicineName?: string;
  stock?: number;
}

export default function ScanPrescription() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { addToCart } = useCart();
  
  // Image scanning state
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [manualEntry, setManualEntry] = useState(false);
  const { recognizeText, isRecognizing, recognizedText } = useTesseract();

  // Manual entry state
  const [doctorName, setDoctorName] = useState("");
  const [prescriptionDate, setPrescriptionDate] = useState("");
  const [medications, setMedications] = useState<ManualMed[]>([
    { name: "", composition: "" }
  ]);
  const [searchResults, setSearchResults] = useState<Record<number, SearchResult>>({});

  // OCR mutation
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
        description: `${data.medications?.length || 0} medications found.`,
      });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to scan prescription",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Search medicines mutation
  const searchMutation = useMutation({
    mutationFn: async (meds: ManualMed[]) => {
      const promises = meds.map(async (med) => {
        const searchQuery = med.name || med.composition;
        if (!searchQuery.trim()) {
          return { success: true, data: [] };
        }
        
        try {
          const response = await fetch(`http://localhost:5000/api/medicines/search?query=${encodeURIComponent(searchQuery)}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          return await response.json();
        } catch (error) {
          console.error('Search request failed:', error);
          return { success: false, data: [] };
        }
      });
      
      return Promise.all(promises);
    },
    onSuccess: (responses) => {
      const results: Record<number, SearchResult> = {};

      responses.forEach((res, idx) => {
        if (res.success && res.data.length > 0) {
          results[idx] = {
            found: true,
            medicineId: res.data[0]._id,
            medicineName: res.data[0].name,
            stock: res.data[0].stock || 0
          };
        } else {
          results[idx] = { found: false };
        }
      });
      
      setSearchResults(results);
    },
    onError: (err: any) => {
      toast({
        title: "Search failed",
        description: err.message ?? "Couldn't search medicines",
        variant: "destructive"
      });
    }
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ medicineId }: { medicineId: string }) => {
      await addToCart(medicineId, 1);
    },
    onSuccess: () => {
      toast({ title: "Added to cart", description: "Medicine added successfully." });
    },
    onError: (err: any) => {
      toast({
        title: "Cart error",
        description: err.message ?? "Couldn't add to cart",
        variant: "destructive"
      });
    }
  });

  // File handling
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      setCapturedImage(base64data);
      recognizeText(base64data);
    };
    reader.readAsDataURL(file);
  };

  const handleTakePhoto = () => {
    document.getElementById('file-input')?.click();
  };

  // Medication management
  const addMedication = () => {
    setMedications([...medications, { name: "", composition: "" }]);
  };

  const removeMedication = (idx: number) => {
    setMedications(prev => prev.filter((_, i) => i !== idx));
  };

  const updateMedication = (idx: number, field: keyof ManualMed, value: string) => {
    setMedications(prev =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );
  };

  // Process prescription
  const handleProcessPrescription = () => {
    if (capturedImage) {
      scanMutation.mutate(capturedImage);
    } else if (manualEntry) {
      // Validate basic fields (just for show)
      if (!doctorName || !prescriptionDate) {
        toast({
          title: "Missing Information",
          description: "Please fill doctor name and date",
          variant: "destructive"
        });
        return;
      }
      
      // Search medicines
      searchMutation.mutate(medications);
    } else {
      toast({
        title: "Missing Information",
        description: "Please capture an image or enter prescription details.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-6">Scan Prescription</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>
            {manualEntry ? "Enter Prescription Details" : "Capture Prescription Image"}
          </CardTitle>
          <CardDescription>
            {manualEntry 
              ? "Enter doctor details and medicines to search our database" 
              : "Take a clear photo of your prescription or upload an image"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!manualEntry ? (
            <div className="space-y-6">
              {/* Image Upload Section */}
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
                    <div className="absolute inset-0 border-2 border-dashed border-primary/50 m-6 pointer-events-none"></div>
                    <span className="text-5xl text-gray-400 mb-2">📷</span>
                    <p className="text-sm text-gray-500">Position your prescription in the frame</p>
                  </>
                )}
              </div>
              
              <input 
                type="file" 
                id="file-input" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileInputChange}
              />
              
              <div className="flex space-x-3">
                <Button 
                  className="flex-1" 
                  onClick={handleTakePhoto}
                  disabled={scanMutation.isPending}
                >
                  {capturedImage ? "Take New Photo" : "Take Photo"}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => document.getElementById('file-input')?.click()}
                  disabled={scanMutation.isPending}
                >
                  Upload Image
                </Button>
              </div>
              
              {isRecognizing && (
                <Alert>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  <AlertDescription>
                    Recognizing text in image...
                  </AlertDescription>
                </Alert>
              )}
              
              {recognizedText && (
                <div className="border rounded-md p-3 bg-gray-50">
                  <Label>Recognized Text (Preview)</Label>
                  <div className="mt-1 font-mono text-xs max-h-40 overflow-y-auto p-2 bg-white">
                    {recognizedText}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Doctor & Date (for show) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Doctor's Name</Label>
                  <Input
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Dr. Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={prescriptionDate}
                    onChange={(e) => setPrescriptionDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Medicines */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Medicines</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMedication}
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Add Medicine
                  </Button>
                </div>

                {medications.map((med, idx) => (
                  <div key={idx} className="border rounded-md p-4 space-y-4 bg-gray-50">
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedication(idx)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Medicine Name</Label>
                        <Input
                          value={med.name}
                          onChange={(e) => updateMedication(idx, "name", e.target.value)}
                          placeholder="Paracetamol"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Composition</Label>
                        <Input
                          value={med.composition}
                          onChange={(e) => updateMedication(idx, "composition", e.target.value)}
                          placeholder="Acetaminophen 500mg"
                        />
                      </div>
                    </div>

                    {/* Search Results */}
                    {searchResults[idx] && (
                      <Alert variant={searchResults[idx].found ? "default" : "destructive"}>
                        {searchResults[idx].found ? (
                          <>
                            <Check className="h-4 w-4 text-green-600" />
                            <AlertDescription className="flex items-center justify-between w-full">
                              <span>
                                Found: {searchResults[idx].medicineName} 
                                ({searchResults[idx].stock} in stock)
                              </span>
                              <Button
                                size="sm"
                                onClick={() => addToCartMutation.mutate({
                                  medicineId: searchResults[idx].medicineId!
                                })}
                                disabled={addToCartMutation.isPending}
                              >
                                <ShoppingCart className="h-4 w-4 mr-1" />
                                Add to Cart
                              </Button>
                            </AlertDescription>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription>
                              Medicine not found in our database
                            </AlertDescription>
                          </>
                        )}
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-3">
          <Button 
            className="w-full"
            onClick={handleProcessPrescription}
            disabled={
              (!manualEntry && !capturedImage) || 
              scanMutation.isPending || 
              searchMutation.isPending
            }
          >
            {scanMutation.isPending || searchMutation.isPending ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                {searchMutation.isPending ? "Searching..." : "Processing..."}
              </>
            ) : (
              manualEntry ? "Search Medicines" : "Process Prescription"
            )}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setManualEntry(!manualEntry)}
            disabled={scanMutation.isPending || searchMutation.isPending}
          >
            {manualEntry ? "📷 Switch to Camera" : "✏️ Enter Manually"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

