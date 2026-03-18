import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader } from "lucide-react";

interface PharmacyOption {
  id: string;
  name: string;
  logo: string;
  deliveryEstimate: string;
  price: number;
  description: string;
  preferred?: boolean;
}

interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  refills: number;
}

interface PharmacySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  medications: Medication[];
}

export default function PharmacySelector({ isOpen, onClose, medications }: PharmacySelectorProps) {
  const { toast } = useToast();
  const [selectedPharmacy, setSelectedPharmacy] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Pharmacy options (in a real implementation, these would come from an API)
  const pharmacyOptions: PharmacyOption[] = [
    {
      id: "medexpress",
      name: "MedExpress Pharmacy",
      logo: "pharmacy-logo-1", // Would be an actual image path in production
      deliveryEstimate: "1-2 business days",
      price: 4500, // $45.00
      description: "Our trusted partner with fast delivery and competitive prices.",
      preferred: true
    },
    {
      id: "quickmeds",
      name: "QuickMeds Online",
      logo: "pharmacy-logo-2",
      deliveryEstimate: "Same day delivery",
      price: 5200, // $52.00
      description: "Premium service with same day delivery in most areas."
    },
    {
      id: "valuedrugstore",
      name: "Value Drugstore",
      logo: "pharmacy-logo-3",
      deliveryEstimate: "2-3 business days",
      price: 3800, // $38.00
      description: "Best value option with slightly longer delivery times."
    }
  ];

  // Order creation mutation
  const orderMutation = useMutation({
    mutationFn: async (pharmacyId: string) => {
      const selectedOption = pharmacyOptions.find(p => p.id === pharmacyId);
      
      if (!selectedOption) throw new Error("Invalid pharmacy selection");
      
      // Format the dates as ISO strings for the API
      const now = new Date();
      const deliveryDate = getEstimatedDeliveryDate(selectedOption.deliveryEstimate);
      
      // First create the order
      const response = await apiRequest("POST", "/api/orders", {
        userId: 1,
        orderDate: now.toISOString(),
        status: "ordered",
        estimatedDelivery: deliveryDate.toISOString(),
        pharmacy: selectedOption.name,
        totalItems: medications.length
      });
      
      const orderResult = await response.json();
      const orderId = orderResult.id;
      
      // Create order items for each medication
      for (const medication of medications) {
        await apiRequest("POST", "/api/order-items", {
          orderId: orderId,
          medicationId: medication.id,
          quantity: 1,
          price: Math.floor(selectedOption.price / medications.length) // Distribute price across items
        });
      }
      
      return orderResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/active"] });
      
      // Simulate redirect to external pharmacy
      if (selectedPharmacy) {
        setIsRedirecting(true);
        
        // In a real app, this could be a redirect to the pharmacy's site
        // For demo purposes, we'll just wait a bit and then close with a success message
        setTimeout(() => {
          toast({
            title: "Order Placed Successfully",
            description: `Your order has been placed with ${pharmacyOptions.find(p => p.id === selectedPharmacy)?.name}.`,
          });
          setIsRedirecting(false);
          onClose();
        }, 2000);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to place order: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  function getEstimatedDeliveryDate(estimateText: string): Date {
    // Parse delivery estimate text and return an estimated date
    const today = new Date();
    let daysToAdd = 1;
    
    if (estimateText.includes("Same day")) {
      daysToAdd = 0;
    } else if (estimateText.includes("1-2")) {
      daysToAdd = 2;
    } else if (estimateText.includes("2-3")) {
      daysToAdd = 3;
    }
    
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + daysToAdd);
    return deliveryDate; // Return a Date object directly
  }

  const handleSelectPharmacy = (pharmacyId: string) => {
    setSelectedPharmacy(pharmacyId);
  };

  const handlePlaceOrder = () => {
    if (selectedPharmacy) {
      orderMutation.mutate(selectedPharmacy);
    } else {
      toast({
        title: "No Pharmacy Selected",
        description: "Please select a pharmacy to place your order.",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (isRedirecting) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Connecting to Pharmacy</DialogTitle>
            <DialogDescription className="text-center">
              Please wait while we connect you to the pharmacy...
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <Loader className="h-12 w-12 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select a Pharmacy</DialogTitle>
          <DialogDescription>
            Choose from our partner pharmacies to place your order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {pharmacyOptions.map((pharmacy) => (
            <Card 
              key={pharmacy.id} 
              className={`cursor-pointer border-2 transition-all ${
                selectedPharmacy === pharmacy.id ? "border-primary" : "border-transparent"
              }`}
              onClick={() => handleSelectPharmacy(pharmacy.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{pharmacy.name}</CardTitle>
                    <CardDescription>{pharmacy.description}</CardDescription>
                  </div>
                  {pharmacy.preferred && (
                    <Badge className="bg-blue-100 text-blue-800">Preferred</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex justify-between text-sm">
                  <span>Estimated delivery:</span>
                  <span className="font-medium">{pharmacy.deliveryEstimate}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Total cost:</span>
                  <span className="font-medium">{formatCurrency(pharmacy.price)}</span>
                </div>
                <div className="mt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`https://${pharmacy.name.toLowerCase().replace(/\s+/g, '')}.example.com/checkout`, '_blank');
                    }}
                  >
                    Visit Pharmacy Website
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-2">
          <h3 className="text-sm font-medium mb-2">Order Summary</h3>
          <div className="bg-gray-50 p-3 rounded-lg">
            <ul className="space-y-2">
              {medications.map((med) => (
                <li key={med.id} className="flex justify-between text-sm">
                  <span>{med.name} {med.dosage}</span>
                  <span className="font-medium">{med.refills > 0 ? `${med.refills} refills` : '1 refill'}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row sm:justify-between">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handlePlaceOrder} 
            disabled={!selectedPharmacy || orderMutation.isPending}
          >
            {orderMutation.isPending ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Place Order"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}