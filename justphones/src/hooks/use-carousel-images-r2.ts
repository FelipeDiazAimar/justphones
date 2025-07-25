'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CarouselImage } from '@/lib/carousel';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './use-toast';
import { extractPathFromR2Url } from '@/lib/r2-storage';
import { deleteImageMetadata } from '@/lib/image-metadata';

export function useCarouselImagesR2() {
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
        description: 'No se pudieron cargar las imágenes del carrusel. Asegúrate de que la tabla "carousel_images" exista en Supabase.' 
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
    console.log('🔄 [R2 HOOK] addCarouselImage called:', imageData);
    
    const { error } = await supabase.from('carousel_images').insert([imageData]);
    if (error) {
      console.error('❌ [R2 HOOK] Error adding carousel image:', error.message);
      const description = error.message.includes('violates row-level security policy')
        ? 'Acción bloqueada por la seguridad de la base de datos. Por favor, revisa las políticas de RLS para la tabla "carousel_images".'
        : `No se pudo añadir la imagen: ${error.message}`;
      toast({ variant: 'destructive', title: 'Error', description });
      return false;
    }
    
    console.log('✅ [R2 HOOK] Carousel image added successfully');
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
    console.log('🗑️ [R2 HOOK] deleteCarouselImage called for ID:', imageId);
    
    // Primero obtener los datos de la imagen para saber qué eliminar
    const imageToDelete = carouselImages.find(img => img.id === imageId);
    if (!imageToDelete) {
      console.error('❌ [R2 HOOK] Image not found:', imageId);
      toast({ variant: 'destructive', title: 'Error', description: 'Imagen no encontrada' });
      return false;
    }

    console.log('🔍 [R2 HOOK] Image to delete:', {
      id: imageToDelete.id,
      url: imageToDelete.image_url,
      alt_text: imageToDelete.alt_text
    });

    // Verificar si es una imagen de R2
    const isR2Image = imageToDelete.image_url.includes('.r2.dev') || 
                     imageToDelete.image_url.includes('r2.cloudflarestorage.com');
    
    console.log('🔍 [R2 HOOK] Is R2 image:', isR2Image);

    try {
      // Si es imagen de R2, intentar eliminar primero del bucket
      if (isR2Image) {
        console.log('🗑️ [R2 HOOK] Attempting to delete from R2 bucket...');
        
        const path = extractPathFromR2Url(imageToDelete.image_url);
        console.log('📂 [R2 HOOK] Extracted path:', path);
        
        if (path) {
          // Eliminar de R2 usando API endpoint
          console.log('🪣 [R2 HOOK] Deleting from R2 bucket via API...');
          
          try {
            const r2Response = await fetch('/api/r2/delete', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                bucket: 'carousel-images',
                path: path
              }),
            });

            const r2Result = await r2Response.json();
            
            if (r2Result.success) {
              console.log('✅ [R2 HOOK] Successfully deleted from R2');
            } else {
              console.warn('⚠️ [R2 HOOK] Failed to delete from R2:', r2Result.error);
            }
          } catch (r2Error) {
            console.warn('⚠️ [R2 HOOK] Error calling R2 delete API:', r2Error);
          }

          // Eliminar metadata
          console.log('📝 [R2 HOOK] Deleting metadata...');
          try {
            const metadataDeleted = await deleteImageMetadata(imageToDelete.image_url);
            
            if (metadataDeleted) {
              console.log('✅ [R2 HOOK] Successfully deleted metadata');
            } else {
              console.warn('⚠️ [R2 HOOK] Failed to delete metadata, but continuing...');
            }
          } catch (metaError) {
            console.warn('⚠️ [R2 HOOK] Error deleting metadata:', metaError);
          }
        } else {
          console.warn('⚠️ [R2 HOOK] Could not extract path from URL, skipping R2 deletion');
        }
      } else {
        console.log('ℹ️ [R2 HOOK] External URL, skipping R2 deletion');
      }

      // Eliminar de la base de datos
      console.log('🗃️ [R2 HOOK] Deleting from database...');
      const { error } = await supabase.from('carousel_images').delete().eq('id', imageId);
      
      if (error) {
        console.error('❌ [R2 HOOK] Database deletion failed:', error.message);
        const description = error.message.includes('violates row-level security policy')
          ? 'Acción bloqueada por la seguridad de la base de datos. Por favor, revisa las políticas de RLS para la tabla "carousel_images".'
          : `No se pudo eliminar la imagen: ${error.message}`;
        toast({ variant: 'destructive', title: 'Error', description });
        return false;
      }

      console.log('✅ [R2 HOOK] Successfully deleted from database');
      
      // Actualizar la lista local
      await fetchCarouselImages();
      
      // Mostrar mensaje de éxito
      if (isR2Image) {
        toast({ 
          title: 'Imagen eliminada', 
          description: 'La imagen ha sido eliminada del carrusel y del almacenamiento de Cloudflare R2' 
        });
      } else {
        toast({ 
          title: 'Imagen eliminada', 
          description: 'La imagen ha sido eliminada del carrusel' 
        });
      }
      
      console.log('🎉 [R2 HOOK] Deletion completed successfully');
      return true;

    } catch (error) {
      console.error('❌ [R2 HOOK] Error during deletion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({ 
        variant: 'destructive', 
        title: 'Error eliminando imagen', 
        description: errorMessage 
      });
      return false;
    }
  };

  /**
   * Función para subir archivo a R2 usando API endpoint
   */
  const uploadCarouselImageFile = async (
    file: File, 
    altText: string = '', 
    sortOrder: number = 0
  ): Promise<{ success: boolean; url?: string; error?: string }> => {
    console.log('🚀 [R2 HOOK] uploadCarouselImageFile called (using API)');
    console.log('📁 [R2 HOOK] File:', file.name, file.size, 'bytes', file.type);
    
    try {
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('file', file);

      console.log('📤 [R2 HOOK] Calling API endpoint...');
      const response = await fetch('/api/upload/carousel', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('� [R2 HOOK] API response:', result);

      if (!result.success) {
        console.error('❌ [R2 HOOK] API upload failed:', result.error);
        toast({
          variant: 'destructive',
          title: 'Error al subir imagen',
          description: result.error || 'No se pudo subir la imagen',
        });
        return { success: false, error: result.error };
      }

      console.log('✅ [R2 HOOK] API upload successful, now saving to carousel_images...');
      
      // Ahora guardar en la tabla carousel_images
      const carouselData = {
        image_url: result.url,
        alt_text: altText,
        sort_order: sortOrder,
      };
      
      const saveResult = await addCarouselImage(carouselData);
      
      if (!saveResult) {
        console.error('❌ [R2 HOOK] Failed to save carousel image data');
        return { success: false, error: 'Error al guardar datos del carrusel' };
      }

      console.log('✅ [R2 HOOK] Carousel image saved successfully');
      toast({
        title: 'Imagen subida',
        description: 'La imagen se subió correctamente a Cloudflare R2',
      });

      return { success: true, url: result.url };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ [R2 HOOK] Error uploading carousel image:', error);
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
