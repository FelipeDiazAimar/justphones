import { createClient } from '@/lib/supabase/client';
import type { FileMetadata } from './r2-storage';

export interface ImageRecord {
  id?: string;
  url: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  bucket: string;
  storage_path: string;
  category: string;
  metadata?: Record<string, any>;
  uploaded_at?: string;
  created_at?: string;
}

/**
 * Guarda la metadata de un archivo subido a R2 en Supabase
 */
export async function saveImageMetadata(
  url: string,
  originalName: string,
  fileSize: number,
  mimeType: string,
  bucket: string,
  storagePath: string,
  category: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = createClient();
    
    const imageRecord: Omit<ImageRecord, 'id' | 'created_at'> = {
      url,
      original_name: originalName,
      file_size: fileSize,
      mime_type: mimeType,
      bucket,
      storage_path: storagePath,
      category,
      metadata,
      uploaded_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('uploaded_images')
      .insert([imageRecord])
      .select('id')
      .single();

    if (error) {
      console.error('Error saving image metadata:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      id: data?.id,
    };
  } catch (error) {
    console.error('Unexpected error saving metadata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Obtiene la metadata de una imagen por su URL
 */
export async function getImageMetadata(url: string): Promise<ImageRecord | null> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('uploaded_images')
      .select('*')
      .eq('url', url)
      .single();

    if (error) {
      console.error('Error fetching image metadata:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching metadata:', error);
    return null;
  }
}

/**
 * Elimina la metadata de una imagen
 */
export async function deleteImageMetadata(url: string): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('uploaded_images')
      .delete()
      .eq('url', url);

    if (error) {
      console.error('Error deleting image metadata:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error deleting metadata:', error);
    return false;
  }
}

/**
 * Función completa que sube a R2 y guarda metadata en Supabase
 */
export async function uploadImageWithMetadata(
  file: File,
  uploadFunction: (file: File) => Promise<{ success: boolean; url?: string; path?: string; error?: string }>,
  category: string,
  additionalMetadata?: Record<string, any>
): Promise<{ success: boolean; url?: string; metadataId?: string; error?: string }> {
  console.log('🔄 [METADATA] uploadImageWithMetadata started');
  console.log('📁 [METADATA] File:', file.name, file.size, 'bytes');
  console.log('🏷️ [METADATA] Category:', category);
  
  try {
    // Subir a R2
    console.log('⬆️ [METADATA] Calling upload function...');
    const uploadResult = await uploadFunction(file);
    console.log('📤 [METADATA] Upload result:', uploadResult);
    
    if (!uploadResult.success || !uploadResult.url || !uploadResult.path) {
      console.error('❌ [METADATA] Upload failed:', uploadResult);
      return {
        success: false,
        error: uploadResult.error || 'Error al subir archivo',
      };
    }

    // Guardar metadata en Supabase
    const metadataResult = await saveImageMetadata(
      uploadResult.url,
      file.name,
      file.size,
      file.type,
      category.includes('carousel') ? 'carousel-images' : 'product-images',
      uploadResult.path,
      category,
      additionalMetadata
    );

    if (!metadataResult.success) {
      console.warn('Image uploaded but metadata save failed:', metadataResult.error);
      // Archivo subido exitosamente, pero falló guardar metadata
      return {
        success: true,
        url: uploadResult.url,
        error: `Imagen subida, pero error guardando metadata: ${metadataResult.error}`,
      };
    }

    return {
      success: true,
      url: uploadResult.url,
      metadataId: metadataResult.id,
    };
  } catch (error) {
    console.error('Error in uploadImageWithMetadata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
