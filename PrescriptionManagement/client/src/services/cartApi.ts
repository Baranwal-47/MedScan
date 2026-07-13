import { Cart } from '../types/Cart';
import { api } from '../lib/apiBase';

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
