import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { CartItem } from '../lib/types';

interface CartContextType {
  globalCart: CartItem[];
  addToGlobalCart: (items: CartItem | CartItem[]) => void;
  removeFromGlobalCart: (productId: string) => void;
  updateGlobalCartQty: (productId: string, qty: number) => void;
  clearGlobalCart: () => void;
  globalCartTotal: number;
  globalCartCount: number;
  selectedProduct: CartItem | null;
  setSelectedProduct: (item: CartItem | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [globalCart, setGlobalCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<CartItem | null>(null);

  const addToGlobalCart = (itemsToAdd: CartItem | CartItem[]) => {
    const newItems = Array.isArray(itemsToAdd) ? itemsToAdd : [itemsToAdd];
    
    setGlobalCart(prev => {
      const nextCart = [...prev];
      for (const newItem of newItems) {
        const existingIdx = nextCart.findIndex(i => i.productId === newItem.productId);
        if (existingIdx !== -1) {
          nextCart[existingIdx] = {
            ...nextCart[existingIdx],
            qty: nextCart[existingIdx].qty + newItem.qty
          };
        } else {
          nextCart.push(newItem);
        }
      }
      return nextCart;
    });
  };

  const removeFromGlobalCart = (productId: string) => {
    setGlobalCart(prev => prev.filter(i => i.productId !== productId));
  };

  const updateGlobalCartQty = (productId: string, qty: number) => {
    setGlobalCart(prev => prev.map(i => i.productId === productId ? { ...i, qty } : i));
  };

  const clearGlobalCart = () => {
    setGlobalCart([]);
  };

  const globalCartTotal = globalCart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const globalCartCount = globalCart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CartContext.Provider value={{
      globalCart,
      addToGlobalCart,
      removeFromGlobalCart,
      updateGlobalCartQty,
      clearGlobalCart,
      globalCartTotal,
      globalCartCount,
      selectedProduct,
      setSelectedProduct
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
