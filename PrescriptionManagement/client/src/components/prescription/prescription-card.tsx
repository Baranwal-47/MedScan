import { format } from "date-fns";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PrescriptionProps {
  prescription: {
    id: number;
    doctorName: string;
    date: string;
    status: string;
    medicationCount: number;
  };
}

export default function PrescriptionCard({ prescription }: PrescriptionProps) {
  // Format the date
  const prescriptionDate = new Date(prescription.date);
  const formattedDate = format(prescriptionDate, "MMMM d, yyyy");
  
  // Determine status badge color
  const getStatusBadge = () => {
    switch (prescription.status.toLowerCase()) {
      case "verified":
        return (
          <Badge className="bg-status-success/10 text-status-success">
            Verified
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-status-warning/10 text-status-warning">
            Processing
          </Badge>
        );
      case "active":
        return (
          <Badge className="bg-secondary/10 text-secondary">
            Active
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {prescription.status}
          </Badge>
        );
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-5 sm:px-6 bg-neutral-light flex justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{prescription.doctorName}</h3>
          <p className="text-sm text-gray-600">Dr. {prescription.doctorName}</p>
        </div>
        {getStatusBadge()}
      </div>
      <div className="border-t border-gray-200 px-4 py-4">
        <div className="text-sm mb-2">
          <span className="font-medium text-gray-700">Date:</span>
          <span className="ml-2 text-gray-600">{formattedDate}</span>
        </div>
        <div className="text-sm mb-2">
          <span className="font-medium text-gray-700">Medications:</span>
          <span className="ml-2 text-gray-600">{prescription.medicationCount} items</span>
        </div>
        <div className="text-sm">
          <span className="font-medium text-gray-700">Status:</span>
          <span className={`ml-2 ${prescription.status.toLowerCase() === "verified" ? "text-status-success" : "text-status-warning"}`}>
            {prescription.status}
          </span>
        </div>
        <div className="mt-4 flex">
          <Link href={`/prescriptions/${prescription.id}`}>
            <Button className="flex-1">
              View Details
            </Button>
          </Link>
          <Button variant="outline" className="ml-3 flex-none px-3" size="icon">
            <span className="material-icons text-sm">more_vert</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
