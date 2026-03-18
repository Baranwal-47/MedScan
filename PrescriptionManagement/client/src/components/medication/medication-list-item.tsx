import { useState } from "react";
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
}

interface Schedule {
  id: number;
  time: string;
  taken: boolean;
  medication: Medication;
}

interface MedicationListItemProps {
  schedule: Schedule;
  onViewDetails: () => void;
}

export default function MedicationListItem({ schedule, onViewDetails }: MedicationListItemProps) {
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  
  // Format time for display (24h to 12h)
  const formatTime = (time24h: string) => {
    const [hours, minutes] = time24h.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  // Get time period icon
  const getTimeIcon = (time: string) => {
    const hour = parseInt(time.split(':')[0], 10);
    
    if (hour >= 5 && hour < 12) {
      return "wb_sunny"; // Morning
    } else if (hour >= 12 && hour < 18) {
      return "wb_twighlight"; // Afternoon
    } else {
      return "nightlight"; // Evening/Night
    }
  };
  
  // Mark medication as taken
  const markAsTakenMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PUT", `/api/schedules/${schedule.id}/take`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules/today"] });
      toast({
        title: "Medication marked as taken",
        description: `${schedule.medication.name} has been marked as taken.`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Calculate due status
  const getDueStatus = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const [scheduleHour, scheduleMinute] = schedule.time.split(':').map(Number);
    
    // Convert to minutes for easier comparison
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const scheduleTimeInMinutes = scheduleHour * 60 + scheduleMinute;
    
    const timeDifference = scheduleTimeInMinutes - currentTimeInMinutes;
    
    if (schedule.taken) {
      return (
        <Badge className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
          Taken
        </Badge>
      );
    } else if (timeDifference < 0) {
      // Overdue
      return (
        <Badge variant="destructive" className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
          Overdue
        </Badge>
      );
    } else if (timeDifference <= 60) {
      // Due within an hour
      return (
        <Badge className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-status-warning/20 text-status-warning">
          Due {timeDifference === 0 ? 'now' : `in ${timeDifference}m`}
        </Badge>
      );
    } else {
      // Upcoming
      return (
        <Badge variant="outline" className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
          Upcoming
        </Badge>
      );
    }
  };
  
  // Handle taking medication
  const handleTakeMedication = () => {
    markAsTakenMutation.mutate();
  };
  
  const formattedTime = formatTime(schedule.time);
  const timeIcon = getTimeIcon(schedule.time);
  
  return (
    <li 
      className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
            <span className="material-icons">{timeIcon}</span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{schedule.medication.name} {schedule.medication.dosage}</div>
            <div className="text-sm text-gray-500">{formattedTime} · {schedule.medication.instructions}</div>
          </div>
        </div>
        <div className="flex items-center">
          {isHovered && !schedule.taken ? (
            <Button 
              size="sm"
              variant="outline"
              className="mr-2"
              onClick={handleTakeMedication}
              disabled={markAsTakenMutation.isPending}
            >
              {markAsTakenMutation.isPending ? (
                <Loader className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <span className="material-icons text-sm mr-1">check</span>
              )}
              Take
            </Button>
          ) : (
            getDueStatus()
          )}
          <button 
            className="ml-2 text-gray-400 hover:text-gray-500"
            onClick={onViewDetails}
          >
            <span className="material-icons text-sm">more_horiz</span>
          </button>
        </div>
      </div>
    </li>
  );
}
