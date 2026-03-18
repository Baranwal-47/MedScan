import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";

interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  refills: number;
  medicationType?: string;
  pharmacy?: string;
  startDate?: string;
  endDate?: string;
}

interface MedicationDetailModalProps {
  medication: Medication;
  isOpen: boolean;
  onClose: () => void;
}

export default function MedicationDetailModal({ medication, isOpen, onClose }: MedicationDetailModalProps) {
  const { toast } = useToast();
  
  // Order refill mutation
  const orderRefillMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/orders", {
        userId: 1,
        orderDate: new Date().toISOString(),
        status: "ordered",
        estimatedDelivery: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
        pharmacy: medication.pharmacy || "MedExpress Pharmacy",
        totalItems: 1
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/active"] });
      toast({
        title: "Refill Ordered",
        description: `Your refill for ${medication.name} has been ordered.`
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to order refill: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  if (!isOpen) return null;
  
  // Suggest times based on frequency
  const suggestTimes = () => {
    const frequency = medication.frequency.toLowerCase();
    
    if (frequency.includes("once") || frequency.includes("daily")) {
      return [{ time: "7:00 AM" }];
    } else if (frequency.includes("twice") || frequency.includes("two times")) {
      return [{ time: "7:00 AM" }, { time: "7:00 PM" }];
    } else if (frequency.includes("three") || frequency.includes("3 times")) {
      return [{ time: "7:00 AM" }, { time: "1:00 PM" }, { time: "7:00 PM" }];
    } else {
      return [{ time: "As needed" }];
    }
  };
  
  const suggestedTimes = suggestTimes();
  
  // Format dates if available
  const startDate = medication.startDate ? format(new Date(medication.startDate), "MMMM d, yyyy") : "Not specified";
  const endDate = medication.endDate ? format(new Date(medication.endDate), "MMMM d, yyyy") : "Ongoing";
  
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
          <div className="bg-neutral-light px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-sans font-medium text-gray-900">
              {medication.name} {medication.dosage}
            </h3>
            <button type="button" className="text-gray-400 hover:text-gray-500" onClick={onClose}>
              <span className="material-icons">close</span>
            </button>
          </div>
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="sm:flex sm:items-start">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-secondary/20 text-secondary sm:mx-0 sm:h-10 sm:w-10">
                <span className="material-icons">medication</span>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h4 className="text-lg leading-6 font-medium text-gray-900">
                  Prescription Details
                </h4>
                <div className="mt-4 text-sm">
                  {medication.pharmacy && (
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="col-span-1 text-gray-500">Pharmacy</div>
                      <div className="col-span-2 font-medium">{medication.pharmacy}</div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="col-span-1 text-gray-500">Type</div>
                    <div className="col-span-2 font-medium capitalize">{medication.medicationType || "Tablet"}</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="col-span-1 text-gray-500">Start Date</div>
                    <div className="col-span-2 font-medium">{startDate}</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="col-span-1 text-gray-500">End Date</div>
                    <div className="col-span-2 font-medium">{endDate}</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="col-span-1 text-gray-500">Refills</div>
                    <div className="col-span-2 font-medium">{medication.refills} remaining</div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-md leading-6 font-medium text-gray-900 mb-3">
                    Dosage Instructions
                  </h4>
                  <div className="bg-neutral-light rounded-md p-3 mb-4">
                    <p className="text-sm text-gray-700">{medication.frequency}. {medication.instructions}</p>
                  </div>
                  
                  <h4 className="text-md leading-6 font-medium text-gray-900 mb-2">
                    Schedule
                  </h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {suggestedTimes.map((timeObj, index) => (
                      <Badge key={index} className="bg-secondary/10 rounded-full px-3 py-1 text-xs font-medium text-secondary">
                        {timeObj.time}
                      </Badge>
                    ))}
                  </div>
                  
                  {medication.instructions && (
                    <>
                      <h4 className="text-md leading-6 font-medium text-gray-900 mb-2">
                        Special Instructions
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        {medication.instructions}
                      </p>
                    </>
                  )}
                </div>
                
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <Button
                    className="w-full sm:w-auto sm:ml-3"
                    onClick={() => orderRefillMutation.mutate()}
                    disabled={medication.refills <= 0 || orderRefillMutation.isPending}
                  >
                    {orderRefillMutation.isPending ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Ordering...
                      </>
                    ) : (
                      "Order Refill"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="mt-3 w-full sm:mt-0 sm:w-auto"
                    onClick={onClose}
                  >
                    Adjust Schedule
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
