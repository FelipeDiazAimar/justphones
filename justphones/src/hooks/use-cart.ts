
'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import type { Product, ProductColor } from '@/lib/products';
import { useToast } from './use-toast';
import { useProducts } from './use-products';
import { useCustomerRequests } from './use-customer-requests';

export interface CartItem {
  id: string; // Combination of product.id and color.hex
  product: Product;
  color: ProductColor;
  quantity: number;
}

export interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, color: ProductColor, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  totalPrice: number;
  confirmCustomerRequests: (cartItems: CartItem[]) => Promise<void>;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'justphones-cart';


// The logic has been extracted into this hook
export function useCartState() {
  const { products } = useProducts();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { addCustomerRequest } = useCustomerRequests();
  const { toast } = useToast();

  const loadFromStorage = useCallback(() => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      
      if (storedCart) {
          const parsedItems = JSON.parse(storedCart);
          // Data hydration: ensure product data is up-to-date
          const hydratedItems = parsedItems.map((item: CartItem) => {
              const freshProduct = products.find(p => p.id === item.product.id);
              return freshProduct ? { ...item, product: freshProduct } : item;
          }).filter((item: CartItem) => products.some(p => p.id === item.product.id)); // filter out stale products

          setCartItems(hydratedItems);
      }
    } catch (error) {
      console.error("Failed to load cart from local storage", error);
    }
  }, [products]);

  useEffect(() => {
    if (products.length > 0) {
      loadFromStorage();
    }
  }, [products, loadFromStorage]);

  useEffect(() => {
    // We avoid saving an empty cart to not overwrite a cart from another tab on load
    if (cartItems.length > 0) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } else {
        localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [cartItems]);

  const addToCart = (product: Product, color: ProductColor, quantityToAdd: number = 1) => {
    const itemId = `${product.id}-${color.hex}`;
    
    // Update current cart
    const existingItem = cartItems.find(item => item.id === itemId);
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantityToAdd;
      if (newQuantity > color.stock) {
        toast({
          variant: 'destructive',
          title: 'Stock insuficiente',
          description: `No puedes añadir más unidades. Stock disponible: ${color.stock}.`,
        });
        return;
      }
      setCartItems(prevItems => prevItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    } else {
      if (quantityToAdd > color.stock) {
         toast({
          variant: 'destructive',
          title: 'Stock insuficiente',
          description: `No puedes añadir más unidades. Stock disponible: ${color.stock}.`,
        });
        return;
      }
      setCartItems(prevItems => [...prevItems, { id: itemId, product, color, quantity: quantityToAdd }]);
    }
  };

  const confirmCustomerRequests = async (currentCartItems: CartItem[]) => {
    const requests = currentCartItems.map(item => ({
      product_id: item.product.id,
      product_name: item.product.name,
      product_model: item.product.model,
      color_name: item.color.name,
      color_hex: item.color.hex,
      quantity: item.quantity,
    }));
    
    if(requests.length > 0) {
      await addCustomerRequest(requests);
    }
  };

  const removeFromCart = (itemId: string) => {
    const newCartItems = cartItems.filter(item => item.id !== itemId);
    setCartItems(newCartItems);
    // If the cart is now empty, remove it from storage
    if (newCartItems.length === 0) {
        localStorage.removeItem(CART_STORAGE_KEY);
    }
  };
  
  const updateItemQuantity = (itemId: string, quantity: number) => {
    const itemToUpdate = cartItems.find(item => item.id === itemId);
    if (!itemToUpdate) return;
    
    if (quantity > itemToUpdate.color.stock) {
      toast({
        variant: 'destructive',
        title: 'Stock insuficiente',
        description: `No puedes añadir más unidades. Stock disponible: ${itemToUpdate.color.stock}.`,
      });
      return;
    }

    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
       setCartItems(prevItems =>
         prevItems.map(item =>
          item.id === itemId ? { ...item, quantity } : item
         )
       );
    }
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  const cartCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const totalPrice = useMemo(() => {
    // This now calculates the price AFTER product-specific discounts.
    // The cart sheet will calculate the original price separately.
    return cartItems.reduce((total, item) => {
      const price = item.product.price;
      const discount = item.product.discount ?? 0;
      const itemFinalPrice = discount > 0 ? price * (1 - discount / 100) : price;
      return total + itemFinalPrice * item.quantity;
    }, 0);
  }, [cartItems]);
  
  return { cartItems, addToCart, removeFromCart, updateItemQuantity, clearCart, cartCount, totalPrice, confirmCustomerRequests };
}

export function CartProvider({ children }: { children: ReactNode }) {
    const cartState = useCartState();
    return React.createElement(
        CartContext.Provider,
        { value: cartState },
        children
    );
}


export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
