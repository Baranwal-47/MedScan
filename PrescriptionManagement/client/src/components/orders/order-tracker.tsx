import { format } from "date-fns";
import { Link } from "wouter";

interface Order {
  id: number;
  status: string;
  orderDate: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  totalItems: number;
}

interface OrderTrackerProps {
  order: Order;
}

export default function OrderTracker({ order }: OrderTrackerProps) {
  // Calculate order progress percentage based on status
  let progressPercentage = 0;
  switch (order.status.toLowerCase()) {
    case "ordered":
      progressPercentage = 25;
      break;
    case "shipped":
      progressPercentage = 50;
      break;
    case "in_transit":
      progressPercentage = 75;
      break;
    case "delivered":
      progressPercentage = 100;
      break;
  }
  
  // Format dates
  const formattedEstimatedDelivery = format(new Date(order.estimatedDelivery), "MMM dd, yyyy");
  const formattedActualDelivery = order.actualDelivery ? format(new Date(order.actualDelivery), "MMM dd, yyyy") : null;
  
  // Determine status badge class
  const getStatusBadgeClass = () => {
    switch (order.status.toLowerCase()) {
      case "ordered":
        return "bg-gray-100 text-gray-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "in_transit":
        return "bg-secondary/10 text-secondary";
      case "delivered":
        return "bg-status-success/10 text-status-success";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Order #{order.id}</h3>
          <p className="text-xs text-gray-500">{order.totalItems} medications</p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass()}`}>
          {order.status}
        </span>
      </div>
      
      <div className="relative">
        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 mt-3 mb-1">
          <div 
            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
              order.status.toLowerCase() === "delivered" ? "bg-status-success" : "bg-secondary"
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span className={order.status.toLowerCase() === "ordered" ? "text-secondary font-medium" : ""}>Ordered</span>
          <span className={order.status.toLowerCase() === "shipped" ? "text-secondary font-medium" : ""}>Shipped</span>
          <span className={order.status.toLowerCase() === "in_transit" ? "text-secondary font-medium" : ""}>In Transit</span>
          <span className={order.status.toLowerCase() === "delivered" ? "text-status-success font-medium" : ""}>Delivered</span>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        <span className="font-medium">
          {order.status.toLowerCase() === "delivered" ? "Delivered on:" : "Estimated delivery:"}
        </span>
        <span className="ml-1">
          {formattedActualDelivery || formattedEstimatedDelivery}
        </span>
      </div>
    </div>
  );
}
