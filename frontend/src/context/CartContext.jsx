import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { getApiUrl } from '../utils/apiConfig';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { auth } = useAuth();
  const [cart, setCart] = useState({
    items: [],
    itemCount: 0,
    subtotal: 0,
    totalAmount: 0
  });
  const [loading, setLoading] = useState(false);

  const getHeaders = useCallback(() => {
    return {
      headers: {
        Authorization: `Bearer ${auth.token}`
      }
    };
  }, [auth.token]);

  const fetchCart = useCallback(async () => {
    if (!auth.token) {
      setCart({ items: [], itemCount: 0, subtotal: 0, totalAmount: 0 });
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(getApiUrl('/marketplace/cart'), getHeaders());
      if (res.data?.success && res.data.cart) {
        setCart(res.data.cart);
      }
    } catch (err) {
      // ignore unauthorized or network error
    } finally {
      setLoading(false);
    }
  }, [auth.token, getHeaders]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId) => {
    if (!auth.token) {
      return { success: false, requireAuth: true, message: 'Please log in to add items to your cart' };
    }
    try {
      const res = await axios.post(
        getApiUrl('/marketplace/cart/items'),
        { productId },
        getHeaders()
      );
      if (res.data?.success) {
        await fetchCart();
        return { success: true, message: res.data.message || 'Product added to cart!' };
      }
      return { success: false, message: res.data?.message || 'Failed to add to cart' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to add product to cart'
      };
    }
  };

  const removeFromCart = async (itemId) => {
    if (!auth.token) return;
    try {
      const res = await axios.delete(
        getApiUrl(`/marketplace/cart/items/${itemId}`),
        getHeaders()
      );
      if (res.data?.success) {
        await fetchCart();
      }
    } catch (err) {
      console.error('Error removing from cart:', err);
    }
  };

  const clearCart = async () => {
    if (!auth.token) return;
    try {
      await axios.delete(getApiUrl('/marketplace/cart'), getHeaders());
      setCart({ items: [], itemCount: 0, subtotal: 0, totalAmount: 0 });
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        removeFromCart,
        clearCart,
        refreshCart: fetchCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

