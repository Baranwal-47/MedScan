import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader, ShoppingCart } from "lucide-react";
import PharmacySelector from "./pharmacy-selector";

interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  refills: number;
}

interface BatchOrderButtonProps {
  medications: Medication[];
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  buttonText?: string;
  isPending?: boolean;
  showIcon?: boolean;
  disabled?: boolean;
}

export default function BatchOrderButton({
  medications,
  variant = "default",
  size = "default",
  className = "",
  buttonText = "Order Selected Medications",
  isPending = false,
  showIcon = true,
  disabled = false
}: BatchOrderButtonProps) {
  const [isPharmacyModalOpen, setIsPharmacyModalOpen] = useState(false);

  const handleOpenPharmacyModal = () => {
    setIsPharmacyModalOpen(true);
  };

  const handleClosePharmacyModal = () => {
    setIsPharmacyModalOpen(false);
  };

  // Filter medications with refills available
  const eligibleMedications = medications.filter(med => med.refills > 0);
  const hasEligibleMedications = eligibleMedications.length > 0;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleOpenPharmacyModal}
        disabled={isPending || !hasEligibleMedications || disabled}
      >
        {isPending ? (
          <>
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            {showIcon && <ShoppingCart className="mr-2 h-4 w-4" />}
            {buttonText}
            {medications.length > 1 && ` (${eligibleMedications.length})`}
          </>
        )}
      </Button>

      <PharmacySelector
        isOpen={isPharmacyModalOpen}
        onClose={handleClosePharmacyModal}
        medications={eligibleMedications}
      />
    </>
  );
}