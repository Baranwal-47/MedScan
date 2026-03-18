import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { format } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import MedicationDetailModal from "@/components/medication/medication-detail-modal";
import { useState } from "react";

interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  medicationType: string;
  startDate: string;
  endDate?: string;
  refills: number;
  pharmacy: string;
  active: boolean;
}

interface Prescription {
  id: number;
  doctorName: string;
  date: string;
  status: string;
  notes: string;
  medications: Medication[];
}

export default function PrescriptionDetail() {
  const params = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  
  const { data: prescription, isLoading, error } = useQuery<Prescription>({
    queryKey: [`/api/prescriptions/${params.id}`],
  });

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-32 mb-8" />
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-full mb-6" />
                
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-full mb-6" />
              </div>
              <div>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-full mb-6" />
                
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-8">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Error Loading Prescription</h1>
        <p className="text-gray-600 mb-6">Unable to load the prescription details.</p>
        <Button onClick={() => navigate("/")}>Return to Dashboard</Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return 'bg-status-success/10 text-status-success';
      case 'processing':
        return 'bg-status-warning/10 text-status-warning';
      case 'active':
        return 'bg-secondary/10 text-secondary';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format dates
  const prescriptionDate = new Date(prescription.date);
  const formattedDate = format(prescriptionDate, 'MMMM d, yyyy');

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Prescription Details</h1>
          <p className="text-gray-500">Prescribed on {formattedDate}</p>
        </div>
        <Button 
          variant="outline" 
          className="mt-4 sm:mt-0"
          onClick={() => navigate("/")}
        >
          <span className="material-icons text-sm mr-2">arrow_back</span>
          Back to Dashboard
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl">{prescription.doctorName}</CardTitle>
              <CardDescription>{formattedDate}</CardDescription>
            </div>
            <Badge className={`mt-2 sm:mt-0 ${getStatusColor(prescription.status)}`}>
              {prescription.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Prescription Details</h3>
              <p className="text-sm text-gray-600 mb-4">
                {prescription.notes || "No additional notes."}
              </p>
              
              <h3 className="font-medium text-gray-900 mb-1">Medications</h3>
              <p className="text-sm text-gray-600">
                {prescription.medications.length} medication(s) prescribed
              </p>
            </div>
            
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Doctor</h3>
                <p className="text-sm text-gray-600">{prescription.doctorName}</p>
              </div>
              
              {prescription.medications[0]?.pharmacy && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Pharmacy</h3>
                  <p className="text-sm text-gray-600">{prescription.medications[0].pharmacy}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Prescribed Medications</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {prescription.medications.map((medication) => (
            <Card key={medication.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{medication.name}</CardTitle>
                  {medication.active ? (
                    <Badge className="bg-status-success/10 text-status-success">Active</Badge>
                  ) : (
                    <Badge variant="outline">Inactive</Badge>
                  )}
                </div>
                <CardDescription>
                  {medication.dosage} · {medication.medicationType}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2 mb-4">
                  <p>
                    <span className="font-medium text-gray-700">Frequency:</span>{" "}
                    <span className="text-gray-600">{medication.frequency}</span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Instructions:</span>{" "}
                    <span className="text-gray-600">{medication.instructions}</span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Refills:</span>{" "}
                    <span className="text-gray-600">{medication.refills} remaining</span>
                  </p>
                </div>
                
                <Button 
                  className="w-full"
                  onClick={() => setSelectedMedication(medication)}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Medication Detail Modal */}
      {selectedMedication && (
        <MedicationDetailModal
          medication={selectedMedication}
          isOpen={!!selectedMedication}
          onClose={() => setSelectedMedication(null)}
        />
      )}
    </div>
  );
}
