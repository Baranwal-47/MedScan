import { Notification, NotificationResponse } from '../types/Notification';
import { api } from '../lib/apiBase';

export const notificationAPI = {
  // Get user's notifications with pagination and filtering
  getNotifications: async (
    page: number = 1,
    limit: number = 20,
    filter: string = 'all'
  ): Promise<NotificationResponse> => {
    const params: any = { page, limit };
    
    if (filter.trim() && filter !== 'all') {
      params.filter = filter;
    }
    
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  // Mark single notification as read
  markAsRead: async (notificationId: string): Promise<{ success: boolean; data: Notification }> => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  },

  // Get unread notifications count
  getUnreadCount: async (): Promise<{ success: boolean; count: number }> => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  // Delete a notification
  deleteNotification: async (notificationId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  }
};
