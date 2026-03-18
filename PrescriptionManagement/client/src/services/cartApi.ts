import axios from 'axios';
import { Cart } from '../types/Cart';

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

export const cartAPI = {
  getCart: async (): Promise<{ success: boolean; data: Cart }> => {
    const response = await api.get('/cart');
    return response.data;
  },

  addToCart: async (medicineId: string, quantity: number = 1): Promise<{ success: boolean; data: Cart }> => {
    const response = await api.post('/cart/add', { medicineId, quantity });
    return response.data;
  },

  updateQuantity: async (medicineId: string, quantity: number): Promise<{ success: boolean; data: Cart }> => {
    const response = await api.put('/cart/update', { medicineId, quantity });
    return response.data;
  },

  removeFromCart: async (medicineId: string): Promise<{ success: boolean; data: Cart }> => {
    const response = await api.delete(`/cart/remove/${medicineId}`);
    return response.data;
  },

  clearCart: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete('/cart/clear');
    return response.data;
  }
};
