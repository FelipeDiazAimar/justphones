'use client';

import React, { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import type { Product } from '@/lib/products';
import { MOCK_PRODUCTS } from '@/lib/mock-data';
import { useToast } from './use-toast';

interface ProductsContextType {
  products: Product[];
  isLoading: boolean;
  addProduct: (productData: Omit<Product, 'id' | 'created_at'>) => Promise<boolean>;
  updateProduct: (productId: string, productData: Partial<Product>, shouldRefetch?: boolean) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;
  getProductById: (id: string) => Product | undefined;
  fetchProducts: () => Promise<void>;
}

export const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export function useProductsState() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [isLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    // No-op in mock mode
  }, []);

  const addProduct = async (productData: Omit<Product, 'id' | 'created_at'>): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 400));
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setProducts(prev => [newProduct, ...prev]);
    toast({ title: 'Producto creado', description: `"${productData.name}" fue añadido correctamente.` });
    return true;
  };

  const updateProduct = async (productId: string, productData: Partial<Product>): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...productData } as Product : p));
    toast({ title: 'Producto actualizado', description: 'Los cambios se guardaron correctamente.' });
    return true;
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    setProducts(prev => prev.filter(p => p.id !== productId));
    toast({ title: 'Producto eliminado' });
    return true;
  };

  const getProductById = useCallback((id: string): Product | undefined => {
    return products.find(p => p.id === id);
  }, [products]);

  return { products, isLoading, addProduct, updateProduct, deleteProduct, getProductById, fetchProducts };
}

export function ProductsProvider({ children }: { children: ReactNode }) {
  const productsState = useProductsState();
  return React.createElement(ProductsContext.Provider, { value: productsState }, children);
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
}
