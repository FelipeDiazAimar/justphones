'use client';

import { useState } from 'react';
import type { CarouselImage } from '@/lib/carousel';
import { MOCK_CAROUSEL_IMAGES } from '@/lib/mock-data';
import { useToast } from './use-toast';

export function useCarouselImages() {
  const { toast } = useToast();
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>(MOCK_CAROUSEL_IMAGES);
  const [isLoading] = useState(false);

  const fetchCarouselImages = async () => {
    // No-op in mock mode
  };

  const addCarouselImage = async (imageData: Omit<CarouselImage, 'id' | 'created_at'>): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    const newImage: CarouselImage = {
      ...imageData,
      id: `car-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setCarouselImages(prev => [...prev, newImage].sort((a, b) => a.sort_order - b.sort_order));
    toast({ title: 'Imagen añadida' });
    return true;
  };

  const updateCarouselImage = async (imageId: string, imageData: Partial<Omit<CarouselImage, 'id' | 'created_at'>>): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    setCarouselImages(prev => prev.map(img => img.id === imageId ? { ...img, ...imageData } : img));
    toast({ title: 'Imagen actualizada' });
    return true;
  };

  const deleteCarouselImage = async (imageId: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    setCarouselImages(prev => prev.filter(img => img.id !== imageId));
    toast({ title: 'Imagen eliminada' });
    return true;
  };

  const uploadCarouselImageFile = async (_file: File): Promise<{ success: boolean; url?: string; error?: string }> => {
    await new Promise(r => setTimeout(r, 800));
    // In mock mode, return a placeholder image URL
    const mockUrl = `https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=1200&q=80&t=${Date.now()}`;
    toast({ title: 'Imagen subida', description: 'La imagen se subió correctamente (modo demo).' });
    return { success: true, url: mockUrl };
  };

  return {
    carouselImages,
    isLoading,
    addCarouselImage,
    updateCarouselImage,
    deleteCarouselImage,
    uploadCarouselImageFile,
    fetchCarouselImages,
  };
}
