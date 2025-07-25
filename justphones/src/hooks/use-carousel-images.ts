'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CarouselImage } from '@/lib/carousel';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './use-toast';
import { uploadCarouselImage, deleteFromR2, extractPathFromR2Url, R2_BUCKETS } from '@/lib/r2-storage';
import { uploadImageWithMetadata, deleteImageMetadata } from '@/lib/image-metadata';

/**
 * Hook para manejar imágenes del carousel usando Cloudflare R2
 * ESTE ES EL HOOK PRINCIPAL - REEMPLAZA AL VIEJO
 */
export function useCarouselImages() {
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
    console.log('🔄 addCarouselImage called with R2 hook:', imageData);
    
    const { error } = await supabase.from('carousel_images').insert([imageData]);
    if (error) {
      console.error('Error adding carousel image:', error.message);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: `No se pudo añadir la imagen: ${error.message}` 
      });
      return false;
    }
    
    console.log('✅ Carousel image added successfully');
    await fetchCarouselImages();
    return true;
  };
  
  const updateCarouselImage = async (imageId: string, imageData: Partial<Omit<CarouselImage, 'id' | 'created_at'>>) => {
    const { error } = await supabase.from('carousel_images').update(imageData).eq('id', imageId);
    if (error) {
      console.error('Error updating carousel image:', error.message);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: `No se pudo actualizar la imagen: ${error.message}` 
      });
      return false;
    }
    await fetchCarouselImages();
    return true;
  };

  const deleteCarouselImage = async (imageId: string) => {
    const { error } = await supabase.from('carousel_images').delete().eq('id', imageId);
    if (error) {
      console.error('Error deleting carousel image:', error.message);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: `No se pudo eliminar la imagen: ${error.message}` 
      });
      return false;
    }
    await fetchCarouselImages();
    return true;
  };

  /**
   * Función principal para subir archivo a R2 con metadata
   * ESTA ES LA FUNCIÓN QUE DEBE USAR LA APP
   */
  const uploadCarouselImageFile = async (file: File): Promise<{ success: boolean; url?: string; error?: string }> => {
    console.log('🚀 uploadCarouselImageFile called with R2 hook');
    console.log('📁 File:', file.name, file.size, 'bytes');
    
    try {
      const result = await uploadImageWithMetadata(
        file,
        uploadCarouselImage,
        'carousel',
        {
          type: 'banner',
          dimensions: '1200x400',
        }
      );

      if (!result.success) {
        console.error('❌ Upload failed:', result.error);
        toast({
          variant: 'destructive',
          title: 'Error al subir imagen',
          description: result.error || 'No se pudo subir la imagen',
        });
        return { success: false, error: result.error };
      }

      console.log('✅ R2 upload successful:', result.url);
      toast({
        title: 'Imagen subida',
        description: 'La imagen se subió correctamente a Cloudflare R2',
      });

      return { success: true, url: result.url };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error uploading carousel image:', error);
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
