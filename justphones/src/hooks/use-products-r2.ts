'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Product } from '@/lib/products';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './use-toast';
import { extractPathFromR2Url } from '@/lib/r2-storage';
import { deleteImageMetadata } from '@/lib/image-metadata';

export function useProductsR2() {
  const supabase = createClient();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error.message);
      setProducts([]);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'No se pudieron cargar los productos.' 
      });
    } else {
      setProducts(data as Product[]);
    }
    setIsLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /**
   * Función para subir imagen de portada a R2 usando API endpoint
   */
  const uploadCoverImage = async (
    file: File
  ): Promise<{ success: boolean; url?: string; error?: string }> => {
    console.log('🚀 [PRODUCTS R2] uploadCoverImage called');
    console.log('📁 [PRODUCTS R2] File:', file.name, file.size, 'bytes', file.type);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('📤 [PRODUCTS R2] Calling cover upload API endpoint...');
      const response = await fetch('/api/upload/product-cover', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('📊 [PRODUCTS R2] Cover API response:', result);

      if (!result.success) {
        console.error('❌ [PRODUCTS R2] Cover API upload failed:', result.error);
        toast({
          variant: 'destructive',
          title: 'Error al subir imagen de portada',
          description: result.error || 'No se pudo subir la imagen',
        });
        return { success: false, error: result.error };
      }

      console.log('✅ [PRODUCTS R2] Cover image uploaded successfully');
      toast({
        title: 'Imagen de portada subida',
        description: 'La imagen se subió correctamente a Cloudflare R2',
      });

      return { success: true, url: result.url };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ [PRODUCTS R2] Error uploading cover image:', error);
      toast({
        variant: 'destructive',
        title: 'Error al subir imagen de portada',
        description: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Función para subir imagen de color a R2 usando API endpoint
   */
  const uploadColorImage = async (
    file: File
  ): Promise<{ success: boolean; url?: string; error?: string }> => {
    console.log('🚀 [PRODUCTS R2] uploadColorImage called');
    console.log('📁 [PRODUCTS R2] File:', file.name, file.size, 'bytes', file.type);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('📤 [PRODUCTS R2] Calling color upload API endpoint...');
      const response = await fetch('/api/upload/product-color', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('📊 [PRODUCTS R2] Color API response:', result);

      if (!result.success) {
        console.error('❌ [PRODUCTS R2] Color API upload failed:', result.error);
        toast({
          variant: 'destructive',
          title: 'Error al subir imagen de color',
          description: result.error || 'No se pudo subir la imagen',
        });
        return { success: false, error: result.error };
      }

      console.log('✅ [PRODUCTS R2] Color image uploaded successfully');
      toast({
        title: 'Imagen de color subida',
        description: 'La imagen se subió correctamente a Cloudflare R2',
      });

      return { success: true, url: result.url };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ [PRODUCTS R2] Error uploading color image:', error);
      toast({
        variant: 'destructive',
        title: 'Error al subir imagen de color',
        description: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  const addProduct = async (productData: Omit<Product, 'id' | 'created_at'>) => {
    console.log('🔄 [PRODUCTS R2] addProduct called:', productData);
    
    const { data, error } = await supabase.from('products').insert([productData]).select().single();
    if (error || !data) {
      console.error('❌ [PRODUCTS R2] Error adding product:', error?.message);
      const description = error?.message.includes('violates row-level security policy')
        ? 'Acción bloqueada por la seguridad de la base de datos. Por favor, revisa las políticas de RLS para la tabla "products".'
        : `No se pudo añadir el producto: ${error?.message}`;
      toast({ variant: 'destructive', title: 'Error', description });
      return false;
    }
    
    console.log('✅ [PRODUCTS R2] Product added successfully');
    await fetchProducts();
    return true;
  };

  const updateProduct = async (productId: string, productData: Partial<Omit<Product, 'id' | 'created_at'>>, shouldRefetch: boolean = true) => {
    console.log('🔄 [PRODUCTS R2] updateProduct called:', { productId, productData });
    
    const { error } = await supabase.from('products').update(productData).eq('id', productId);
    if (error) {
      console.error('❌ [PRODUCTS R2] Error updating product:', error.message);
      const description = error.message.includes('violates row-level security policy')
        ? 'Acción bloqueada por la seguridad de la base de datos. Por favor, revisa las políticas de RLS para la tabla "products".'
        : `No se pudo actualizar el producto: ${error.message}`;
      toast({ variant: 'destructive', title: 'Error', description });
      return false;
    }
    
    console.log('✅ [PRODUCTS R2] Product updated successfully');
    if (shouldRefetch) {
      await fetchProducts();
    }
    return true;
  };

  const deleteProduct = async (productId: string) => {
    console.log('🗑️ [PRODUCTS R2] deleteProduct called for ID:', productId);
    
    // Obtener los datos del producto para saber qué imágenes eliminar
    const productToDelete = products.find(p => p.id === productId);
    if (!productToDelete) {
      console.error('❌ [PRODUCTS R2] Product not found:', productId);
      toast({ variant: 'destructive', title: 'Error', description: 'Producto no encontrado' });
      return false;
    }

    console.log('🔍 [PRODUCTS R2] Product to delete:', {
      id: productToDelete.id,
      name: productToDelete.name,
      coverImage: productToDelete.coverImage,
      colorImages: productToDelete.colors?.map(c => c.image) || []
    });

    try {
      // Recopilar todas las imágenes de R2 que necesitan ser eliminadas
      const imagesToDelete: string[] = [];
      
      // Imagen de portada
      if (productToDelete.coverImage && 
          (productToDelete.coverImage.includes('.r2.dev') || 
           productToDelete.coverImage.includes('r2.cloudflarestorage.com'))) {
        imagesToDelete.push(productToDelete.coverImage);
      }

      // Imágenes de colores
      if (productToDelete.colors) {
        productToDelete.colors.forEach(color => {
          if (color.image && 
              (color.image.includes('.r2.dev') || 
               color.image.includes('r2.cloudflarestorage.com'))) {
            imagesToDelete.push(color.image);
          }
        });
      }

      console.log(`🗑️ [PRODUCTS R2] Found ${imagesToDelete.length} R2 images to delete`);

      // Eliminar imágenes de R2 y metadata
      for (const imageUrl of imagesToDelete) {
        console.log('🗑️ [PRODUCTS R2] Deleting image:', imageUrl);
        
        const path = extractPathFromR2Url(imageUrl);
        if (path) {
          // Eliminar de R2 usando API endpoint
          try {
            const r2Response = await fetch('/api/r2/delete', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                bucket: 'product-images',
                path: path
              }),
            });

            const r2Result = await r2Response.json();
            
            if (r2Result.success) {
              console.log('✅ [PRODUCTS R2] Successfully deleted from R2:', path);
            } else {
              console.warn('⚠️ [PRODUCTS R2] Failed to delete from R2:', r2Result.error);
            }
          } catch (r2Error) {
            console.warn('⚠️ [PRODUCTS R2] Error calling R2 delete API:', r2Error);
          }

          // Eliminar metadata
          try {
            const metadataDeleted = await deleteImageMetadata(imageUrl);
            if (metadataDeleted) {
              console.log('✅ [PRODUCTS R2] Successfully deleted metadata for:', imageUrl);
            } else {
              console.warn('⚠️ [PRODUCTS R2] Failed to delete metadata for:', imageUrl);
            }
          } catch (metaError) {
            console.warn('⚠️ [PRODUCTS R2] Error deleting metadata:', metaError);
          }
        } else {
          console.warn('⚠️ [PRODUCTS R2] Could not extract path from URL:', imageUrl);
        }
      }

      // Eliminar el producto de la base de datos
      console.log('🗃️ [PRODUCTS R2] Deleting product from database...');
      const { error } = await supabase.from('products').delete().eq('id', productId);
      
      if (error) {
        console.error('❌ [PRODUCTS R2] Database deletion failed:', error.message);
        const description = error.message.includes('violates row-level security policy')
          ? 'Acción bloqueada por la seguridad de la base de datos. Por favor, revisa las políticas de RLS para la tabla "products".'
          : `No se pudo eliminar el producto: ${error.message}`;
        toast({ variant: 'destructive', title: 'Error', description });
        return false;
      }

      console.log('✅ [PRODUCTS R2] Successfully deleted from database');
      
      // Actualizar la lista local
      await fetchProducts();
      
      // Mostrar mensaje de éxito
      const hasR2Images = imagesToDelete.length > 0;
      if (hasR2Images) {
        toast({ 
          title: 'Producto eliminado', 
          description: `El producto y ${imagesToDelete.length} imagen(es) han sido eliminadas de Cloudflare R2` 
        });
      } else {
        toast({ 
          title: 'Producto eliminado', 
          description: 'El producto ha sido eliminado exitosamente' 
        });
      }
      
      console.log('🎉 [PRODUCTS R2] Product deletion completed successfully');
      return true;

    } catch (error) {
      console.error('❌ [PRODUCTS R2] Error during deletion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({ 
        variant: 'destructive', 
        title: 'Error eliminando producto', 
        description: errorMessage 
      });
      return false;
    }
  };

  const getProductById = (id: string): Product | undefined => {
    return products.find(product => product.id === id);
  };

  return { 
    products, 
    isLoading, 
    addProduct, 
    updateProduct, 
    deleteProduct,
    uploadCoverImage,
    uploadColorImage,
    fetchProducts,
    getProductById
  };
}
