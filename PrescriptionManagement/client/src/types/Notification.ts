export interface Notification {
  _id: string;
  user: string;
  order: {
    _id: string;
    orderNumber: string;
    totalAmount: number;
  };
  type: 'order_status_change' | 'order_created' | 'order_delivered' | 'prescription_approved';
  title: string;
  message: string;
  status: 'pending_approval' | 'confirmed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  previousStatus?: string;
  isRead: boolean;
  readAt?: string;
  metadata: {
    orderNumber: string;
    itemCount: number;
    totalAmount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  success: boolean;
  data: Notification[];
  unreadCount: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
}
