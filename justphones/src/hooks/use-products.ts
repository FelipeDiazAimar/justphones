
'use client';

import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import type { Product } from '@/lib/products';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './use-toast';
import type { ProductHistory } from '@/lib/product-history';

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
    const supabase = createClient();
    const { toast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
  
    const fetchProducts = useCallback(async () => {
      // setIsLoading(true); // Don't set loading on refetch to avoid UI flicker
      const { data, error } = await supabase.from('products').select('*');
  
      if (error) {
        console.error('Error fetching products:', error.message);
        setProducts([]);
      } else {
        setProducts(data as Product[]);
      }
      setIsLoading(false);
    }, [supabase]);
  
    useEffect(() => {
      fetchProducts();
    }, [fetchProducts]);
  
    const addProduct = async (productData: Omit<Product, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('products').insert([productData]).select().single();
      
      if (error || !data) {
        console.error('Error adding product:', error?.message);
        const description = error?.message.includes('violates row-level security policy')
          ? 'Acción bloqueada por la seguridad de la base de datos. Por favor, revisa las políticas de RLS para la tabla "products".'
          : `No se pudo crear el producto: ${error?.message}`;
        toast({ variant: 'destructive', title: 'Error', description });
        return false;
      }
  
      const newProduct = data as Product;
  
      const historyEntry: Omit<ProductHistory, 'id' | 'created_at'> = {
          product_id: newProduct.id,
          product_name: newProduct.name,
          product_model: newProduct.model,
          product_category: newProduct.category,
          price: newProduct.price,
          initial_stock: newProduct.colors.reduce((sum, color) => sum + color.stock, 0),
      };
  
      const { error: historyError } = await supabase.from('product_history').insert([historyEntry]);
  
      if (historyError) {
          console.error('Error adding product to history:', historyError.message);
          toast({
              variant: 'destructive',
              title: 'Error de Historial',
              description: 'El producto fue creado, pero no se pudo registrar en el historial de ingresos.'
          });
      }
  
      await fetchProducts();
      return true;
    };
    
    const updateProduct = async (productId: string, productData: Partial<Product>, shouldRefetch = true) => {
      const { error } = await supabase.from('products').update(productData).eq('id', productId);
      if (error) {
        console.error('Error updating product:', error.message);
        const description = error.message.includes('violates row-level security policy')
          ? 'Acción bloqueada por la seguridad de la base de datos. Por favor, revisa las políticas de RLS para la tabla "products".'
          : `No se pudo actualizar el producto: ${error.message}`;
        toast({ variant: 'destructive', title: 'Error', description });
        return false;
      }
      if (shouldRefetch) {
        await fetchProducts();
      } else {
        // Optimistic UI update
        setProducts(prev => 
          prev.map(p => p.id === productId ? {...p, ...productData} as Product : p)
        )
      }
      return true;
    };
    
    const deleteProduct = async (productId: string) => {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) {
        console.error('Error deleting product:', error.message);
        const description = error.message.includes('violates row-level security policy')
          ? 'Acción bloqueada por la seguridad de la base de datos. Por favor, revisa las políticas de RLS para la tabla "products".'
          : `No se pudo eliminar el producto: ${error.message}`;
        toast({ variant: 'destructive', title: 'Error', description });
        return false;
      }
      await fetchProducts();
      return true;
    };
  
    const getProductById = useCallback((id: string): Product | undefined => {
      return products.find(p => p.id === id);
    }, [products]);
  
    return { products, isLoading, addProduct, updateProduct, deleteProduct, getProductById, fetchProducts };
}

export function ProductsProvider({ children }: { children: ReactNode }) {
  const productsState = useProductsState();
  return React.createElement(
    ProductsContext.Provider,
    { value: productsState },
    children
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
}
