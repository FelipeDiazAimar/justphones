'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CarouselImage } from '@/lib/carousel';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './use-toast';

// Función para subir usando la API de Cloudflare directamente
async function uploadToCloudflareR2(
  file: File,
  bucket: string,
  path: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const accountId = 'ecf5a330cc03f3e606d227a0ec1822e1';
    const token = 'u65L77j1s4GAoxnvkjgxEm7sNK0cFoA2RuHiOBwA';
    
    // Crear FormData para el upload
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/objects/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: file, // Enviar el archivo directamente
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Upload failed: ${response.status} ${errorData}`);
    }

    // Construir la URL pública
    const publicUrl = `https://pub-${accountId}.r2.dev/${path}`;
    
    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error('Error uploading to R2:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export function useCarouselImagesCloudflareAPI() {
  const supabase = createClient();
  const { toast } = useToast();
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCarouselImages = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('carousel_images')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching carousel images:', error.message);
      setCarouselImages([]);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'No se pudieron cargar las imágenes del carrusel.' 
      });
    } else {
      setCarouselImages(data as CarouselImage[]);
    }
    setIsLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
    fetchCarouselImages();
  }, [fetchCarouselImages]);
  
  const addCarouselImage = async (imageData: Omit<CarouselImage, 'id' | 'created_at'>) => {
    const { error } = await supabase.from('carousel_images').insert([imageData]);
    if (error) {
      console.error('Error adding carousel image:', error.message);
      const description = error.message.includes('violates row-level security policy')
        ? 'Acción bloqueada por la seguridad de la base de datos. Por favor, revisa las políticas de RLS para la tabla "carousel_images".'
        : `No se pudo añadir la imagen: ${error.message}`;
      toast({ variant: 'destructive', title: 'Error', description });
      return false;
    }
    await fetchCarouselImages();
    return true;
  };
  
  const updateCarouselImage = async (imageId: string, imageData: Partial<Omit<CarouselImage, 'id' | 'created_at'>>) => {
    const { error } = await supabase.from('carousel_images').update(imageData).eq('id', imageId);
    if (error) {
      console.error('Error updating carousel image:', error.message);
      const description = error.message.includes('violates row-level security policy')
        ? 'Acción bloqueada por la seguridad de la base de datos. Por favor, revisa las políticas de RLS para la tabla "carousel_images".'
        : `No se pudo actualizar la imagen: ${error.message}`;
      toast({ variant: 'destructive', title: 'Error', description });
      return false;
    }
    await fetchCarouselImages();
    return true;
  };

  const deleteCarouselImage = async (imageId: string) => {
    // Eliminar de la base de datos (por ahora no eliminamos de R2)
    const { error } = await supabase.from('carousel_images').delete().eq('id', imageId);
    if (error) {
      console.error('Error deleting carousel image:', error.message);
      const description = error.message.includes('violates row-level security policy')
        ? 'Acción bloqueada por la seguridad de la base de datos. Por favor, revisa las políticas de RLS para la tabla "carousel_images".'
        : `No se pudo eliminar la imagen: ${error.message}`;
      toast({ variant: 'destructive', title: 'Error', description });
      return false;
    }

    await fetchCarouselImages();
    return true;
  };

  /**
   * Función para subir archivo a R2 usando la API de Cloudflare
   */
  const uploadCarouselImageFile = async (file: File): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      // Generar nombre único
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const cleanName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
      const fileName = `${timestamp}_${randomId}_${cleanName}`;
      const path = `carousel/public/${fileName}`;
      
      const result = await uploadToCloudflareR2(file, 'carousel-images', path);

      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Error al subir imagen',
          description: result.error || 'No se pudo subir la imagen',
        });
        return { success: false, error: result.error };
      }

      toast({
        title: 'Imagen subida',
        description: 'La imagen se subió correctamente a Cloudflare R2',
      });

      return { success: true, url: result.url };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error uploading carousel image:', error);
      toast({
        variant: 'destructive',
        title: 'Error al subir imagen',
        description: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  return { 
    carouselImages, 
    isLoading, 
    addCarouselImage, 
    updateCarouselImage, 
    deleteCarouselImage,
    uploadCarouselImageFile,
    fetchCarouselImages
  };
}
