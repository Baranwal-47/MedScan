import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTesseract } from "@/hooks/use-prescription-scanner";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

import { API_BASE_URL } from "@/lib/apiBase";
import {
  Loader, PlusCircle, Trash2, Check, XCircle, ShoppingCart,
  Camera, Upload, PencilLine, ExternalLink, ShieldAlert
} from "lucide-react";

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

interface ScanMatch {
  medicine: {
    _id: string;
    name: string;
    price: string;
    prescriptionRequired?: boolean;
    manufacturer?: string;
  };
  query: string;
}

interface ScanResult {
  prescriptionId: string;
  matches: ScanMatch[];
  unmatched: string[];
  ocrEngine: string;
}

const inputCls =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none";

export default function ScanPrescription() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  // Image scanning state
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [manualEntry, setManualEntry] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  // Tesseract runs silently in the background — its text is only the
  // last-resort fallback sent to the server; never shown to the user.
  const { recognizeText, recognizedText } = useTesseract();

  // Server-side scan: uploads the image, OCRs it (TrOCR → ocr.space →
  // client Tesseract text), matches against the catalogue, stores the
  // prescription for pharmacist review at checkout.
  const scanMutation = useMutation({
    mutationFn: async (): Promise<ScanResult> => {
      const blob = await (await fetch(capturedImage!)).blob();
      const form = new FormData();
      form.append('image', blob, 'prescription.png');
      if (recognizedText?.trim()) form.append('clientText', recognizedText);

      const res = await fetch(`${API_BASE_URL}/prescriptions/scan`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: form
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Scan failed');
      return json.data;
    },
    onSuccess: (data) => {
      setScanResult(data);
      // Checkout attaches this prescription to the order
      sessionStorage.setItem('prescriptionId', data.prescriptionId);
      if (data.matches.length === 0 && data.unmatched.length === 0) {
        toast({
          title: 'No medicines recognized',
          description: 'Try a clearer photo or manual entry.',
          variant: 'destructive'
        });
      }
    },
    onError: (err: any) => {
      toast({
        title: 'Scan failed',
        description: err.message ?? "Couldn't process the prescription",
        variant: 'destructive'
      });
    }
  });

  // Manual entry state
  const [doctorName, setDoctorName] = useState("");
  const [prescriptionDate, setPrescriptionDate] = useState("");
  const [medications, setMedications] = useState<ManualMed[]>([
    { name: "", composition: "" }
  ]);
  const [searchResults, setSearchResults] = useState<Record<number, SearchResult>>({});

  // Search medicines mutation
  const searchMutation = useMutation({
    mutationFn: async (meds: ManualMed[]) => {
      const promises = meds.map(async (med) => {
        const searchQuery = med.name || med.composition;
        if (!searchQuery.trim()) {
          return { success: true, data: [] };
        }

        try {
          const response = await fetch(`${API_BASE_URL}/medicines/search?query=${encodeURIComponent(searchQuery)}`, {
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
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to scan prescriptions.',
        variant: 'destructive'
      });
      navigate('/login');
      return;
    }
    if (capturedImage && !manualEntry) {
      // Tesseract may still be running — it's only the last-resort fallback
      // text, the server scan (Gemini) doesn't need it.
      scanMutation.mutate();
    } else if (manualEntry) {
      if (!doctorName || !prescriptionDate) {
        toast({
          title: "Missing Information",
          description: "Please fill doctor name and date",
          variant: "destructive"
        });
        return;
      }

      searchMutation.mutate(medications);
    } else {
      toast({
        title: "Missing Information",
        description: "Please capture an image or enter prescription details.",
        variant: "destructive"
      });
    }
  };

  const busy = searchMutation.isPending || scanMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Scan Prescription</h1>
        <p className="text-gray-600 mb-6">
          Upload a photo of your prescription and we'll find the medicines in our store.
        </p>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setManualEntry(false)}
            disabled={busy}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !manualEntry
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
            }`}
          >
            <Camera className="w-4 h-4" />
            Scan image
          </button>
          <button
            onClick={() => setManualEntry(true)}
            disabled={busy}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              manualEntry
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
            }`}
          >
            <PencilLine className="w-4 h-4" />
            Enter manually
          </button>
        </div>

        {!manualEntry ? (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <input
              type="file"
              id="file-input"
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
            />

            {capturedImage ? (
              <div className="relative rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={capturedImage}
                  alt="Captured prescription"
                  className="w-full max-h-96 object-contain"
                />
                <button
                  onClick={() => { setCapturedImage(null); setScanResult(null); }}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-white text-gray-700 text-sm font-medium rounded-lg shadow hover:bg-gray-100"
                >
                  Replace
                </button>
              </div>
            ) : (
              <label
                htmlFor="file-input"
                className="flex flex-col items-center justify-center gap-3 py-16 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900">Click to upload a prescription</p>
                  <p className="text-sm text-gray-500 mt-1">or take a photo — JPG or PNG, up to 10&nbsp;MB</p>
                </div>
              </label>
            )}

            <button
              onClick={handleProcessPrescription}
              disabled={!capturedImage || busy}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {scanMutation.isPending ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Reading your prescription with AI...
                </>
              ) : (
                "Find my medicines"
              )}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor's Name</label>
                <input
                  className={inputCls}
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="Dr. Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  className={inputCls}
                  value={prescriptionDate}
                  onChange={(e) => setPrescriptionDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Medicines</h3>
                <button
                  type="button"
                  onClick={addMedication}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add medicine
                </button>
              </div>

              {medications.map((med, idx) => (
                <div key={idx} className="relative border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
                  {medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedication(idx)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name</label>
                      <input
                        className={inputCls}
                        value={med.name}
                        onChange={(e) => updateMedication(idx, "name", e.target.value)}
                        placeholder="Paracetamol"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Composition</label>
                      <input
                        className={inputCls}
                        value={med.composition}
                        onChange={(e) => updateMedication(idx, "composition", e.target.value)}
                        placeholder="Acetaminophen 500mg"
                      />
                    </div>
                  </div>

                  {searchResults[idx] && (
                    searchResults[idx].found ? (
                      <div className="flex items-center justify-between gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <span className="flex items-center gap-2 text-sm text-green-800 min-w-0">
                          <Check className="w-4 h-4 shrink-0" />
                          <span className="truncate">Found: {searchResults[idx].medicineName}</span>
                        </span>
                        <button
                          onClick={() => addToCartMutation.mutate({ medicineId: searchResults[idx].medicineId! })}
                          disabled={addToCartMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Add to Cart
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        <XCircle className="w-4 h-4 shrink-0" />
                        Medicine not found in our database
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleProcessPrescription}
              disabled={busy}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {searchMutation.isPending ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                "Search medicines"
              )}
            </button>
          </div>
        )}

        {/* Scan results */}
        {scanResult && !manualEntry && (
          <div className="mt-6 space-y-6">
            {scanResult.matches.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Check className="w-5 h-5 mr-2 text-green-600" />
                  Found in our store ({scanResult.matches.length})
                </h2>
                <div className="space-y-3">
                  {scanResult.matches.map((m) => (
                    <div
                      key={m.medicine._id}
                      className="flex items-center justify-between gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {m.medicine.name}
                          {m.medicine.prescriptionRequired && (
                            <span className="ml-2 inline-flex items-center text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                              <ShieldAlert className="w-3 h-3 mr-1" />
                              Rx
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          read as “{m.query}”{m.medicine.price ? ` · ${m.medicine.price}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => addToCartMutation.mutate({ medicineId: m.medicine._id })}
                        disabled={addToCartMutation.isPending || !m.medicine.price}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {scanResult.unmatched.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center">
                  <XCircle className="w-5 h-5 mr-2 text-orange-500" />
                  Not in our catalogue
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  We couldn't match these lines — they may be available on Tata 1mg.
                </p>
                <div className="space-y-2">
                  {scanResult.unmatched.map((name) => (
                    <div
                      key={name}
                      className="flex items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                    >
                      <span className="text-sm text-gray-700 truncate">{name}</span>
                      <a
                        href={`https://www.1mg.com/search/all?name=${encodeURIComponent(name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline whitespace-nowrap"
                      >
                        View on 1mg
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {scanResult.matches.length > 0 && (
              <button
                onClick={() => navigate('/cart')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Go to Cart
              </button>
            )}

            <p className="text-xs text-gray-500 text-center">
              Your prescription image was saved and will be attached to your order for pharmacist review.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
