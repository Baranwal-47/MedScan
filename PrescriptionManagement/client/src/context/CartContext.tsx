import React, { createContext, useContext, useState, useEffect } from 'react';
import { Cart, CartItem } from '../types/Cart';
import { cartAPI } from '../services/cartApi';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  addToCart: (medicineId: string, quantity?: number) => Promise<void>;
  updateQuantity: (medicineId: string, quantity: number) => Promise<void>;
  removeFromCart: (medicineId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartItemCount: () => number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchCart = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      setCart(response.data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  const addToCart = async (medicineId: string, quantity: number = 1) => {
    try {
      setLoading(true);
      const response = await cartAPI.addToCart(medicineId, quantity);
      setCart(response.data);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (medicineId: string, quantity: number) => {
    try {
      setLoading(true);
      const response = await cartAPI.updateQuantity(medicineId, quantity);
      setCart(response.data);
    } catch (error) {
      console.error('Failed to update quantity:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (medicineId: string) => {
    try {
      setLoading(true);
      const response = await cartAPI.removeFromCart(medicineId);
      setCart(response.data);
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      await cartAPI.clearCart();
      setCart(null);
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getCartItemCount = () => {
    return cart?.items.reduce((total, item) => total + item.quantity, 0) || 0;
  };

  const refreshCart = async () => {
    await fetchCart();
  };

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      getCartItemCount,
      refreshCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
