import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import PharmacySelector from "./pharmacy-selector";

interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  refills: number;
}

interface OrderMedicationButtonProps {
  medication: Medication;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  buttonText?: string;
  isPending?: boolean;
}

export default function OrderMedicationButton({
  medication,
  variant = "default",
  size = "default",
  className = "",
  buttonText = "Order Now",
  isPending = false
}: OrderMedicationButtonProps) {
  const [isPharmacyModalOpen, setIsPharmacyModalOpen] = useState(false);

  const handleOpenPharmacyModal = () => {
    setIsPharmacyModalOpen(true);
  };

  const handleClosePharmacyModal = () => {
    setIsPharmacyModalOpen(false);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleOpenPharmacyModal}
        disabled={isPending || medication.refills <= 0}
      >
        {isPending ? (
          <>
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          buttonText
        )}
      </Button>

      <PharmacySelector
        isOpen={isPharmacyModalOpen}
        onClose={handleClosePharmacyModal}
        medications={[medication]}
      />
    </>
  );
}