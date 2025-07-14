
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CarouselImage } from '@/lib/carousel';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './use-toast';

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
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las imágenes del carrusel. Asegúrate de que la tabla "carousel_images" exista en Supabase.' });
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

  return { carouselImages, isLoading, addCarouselImage, updateCarouselImage, deleteCarouselImage };
}
