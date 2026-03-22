import axios from 'axios';
import { Order, ShippingAddress } from '../types/Order';

const API_ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
const API_BASE_URL = API_ROOT.endsWith('/api') ? API_ROOT : `${API_ROOT}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const orderAPI = {
  createOrder: async (data: {
    shippingAddress: ShippingAddress;
    paymentMethod: string;
    doctorName?: string;
  }): Promise<{ success: boolean; data: Order }> => {
    const response = await api.post('/orders/create', data);
    return response.data;
  },

  getMyOrders: async (page: number = 1): Promise<{
    success: boolean;
    data: Order[];
    pagination: any;
  }> => {
    const response = await api.get(`/orders/my-orders?page=${page}`);
    return response.data;
  },

  getOrder: async (orderId: string): Promise<{ success: boolean; data: Order }> => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  // Admin APIs
  getAllOrders: async (page: number = 1, status?: string): Promise<{
    success: boolean;
    data: Order[];
    pagination: any;
  }> => {
    const params = new URLSearchParams({ page: page.toString() });
    if (status) params.append('status', status);
    
    const response = await api.get(`/orders/admin/all?${params}`);
    return response.data;
  },

  updateOrderStatus: async (orderId: string, status: string): Promise<{ success: boolean; data: Order }> => {
    const response = await api.put(`/orders/admin/${orderId}/status`, { status });
    return response.data;
  },


  // Get user's delivered medicines
getMyMedicines: async (page: number = 1): Promise<{
  success: boolean;
  data: any[];
  stats: any;
  pagination: any;
}> => {
  const response = await api.get(`/orders/my-medicines?page=${page}`);
  return response.data;
},

// Get medicine usage history
getMedicineHistory: async (medicineId: string): Promise<{
  success: boolean;
  data: any[];
}> => {
  const response = await api.get(`/orders/medicine-history/${medicineId}`);
  
  return response.data;
},

// Create Stripe payment intent
createStripePaymentIntent: async (amount: number): Promise<{
  success: boolean;
  data: {
    clientSecret: string;
    paymentIntentId: string;
    amount: number;
    currency: string;
    publishableKey: string;
  };
}> => {
  const response = await api.post('/orders/stripe/create-payment-intent', { amount });
  return response.data;
},

// Verify Stripe payment
verifyStripePayment: async (payload: {
  paymentIntentId: string;
  mongoOrderId: string;
}): Promise<{ success: boolean; data?: any; message?: string }> => {
  const response = await api.post('/orders/stripe/verify', payload);
  return response.data;
},

};
