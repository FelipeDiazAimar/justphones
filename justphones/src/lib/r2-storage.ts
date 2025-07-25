import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKETS, type R2BucketName } from './r2-client';

// Re-exportar para usar en otros archivos
export { R2_BUCKETS } from './r2-client';

// Estructura de paths recomendada para organizar archivos
export const R2_PATHS = {
  // Para imágenes del carrusel
  CAROUSEL: {
    PUBLIC: 'carousel/public', // /carousel/public/timestamp_filename.jpg
  },
  
  // Para imágenes de productos
  PRODUCTS: {
    COVERS: 'products/covers',      // /products/covers/timestamp_filename.jpg
    COLORS: 'products/colors',      // /products/colors/timestamp_filename.jpg
    ACCESSORIES: 'products/accessories', // /products/accessories/timestamp_filename.jpg
  },

  // Para futuras categorías
  BRANDS: 'brands',               // /brands/apple/logo.jpg
  CATEGORIES: 'categories',       // /categories/cases/banner.jpg
} as const;

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  path?: string;
}

export interface FileMetadata {
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  category: string;
  bucket: R2BucketName;
  path: string;
}

/**
 * Genera un nombre único para el archivo con timestamp
 */
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const cleanName = originalName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
  const extension = cleanName.substring(cleanName.lastIndexOf('.'));
  const nameWithoutExt = cleanName.substring(0, cleanName.lastIndexOf('.'));
  
  return `${timestamp}_${randomSuffix}_${nameWithoutExt}${extension}`;
}

/**
 * Construye la URL pública del archivo en R2
 */
function buildPublicUrl(bucket: R2BucketName, path: string): string {
  // Usar las URLs específicas de cada bucket
  if (bucket === 'carousel-images') {
    const carouselUrl = process.env.R2_CAROUSEL_PUBLIC_URL || 'https://pub-8a88032e9585477594ec585cb7d48eef.r2.dev';
    return `${carouselUrl}/${path}`;
  }
  
  if (bucket === 'product-images') {
    const productUrl = process.env.R2_PRODUCT_PUBLIC_URL || 'https://pub-c5297a1417984a31aeee5e145ed9d35c.r2.dev';
    return `${productUrl}/${path}`;
  }
  
  // Fallback usando dominio personalizado o general
  const customDomain = process.env.R2_PUBLIC_DOMAIN;
  if (customDomain) {
    return `${customDomain}/${path}`;
  }
  
  // Fallback final usando Account ID
  const accountId = process.env.R2_ACCOUNT_ID || 'ecf5a330cc03f3e606d227a0ec1822e1';
  return `https://pub-${accountId}.r2.dev/${path}`;
}

/**
 * Sube un archivo a Cloudflare R2
 */
export async function uploadToR2(
  file: File,
  bucket: R2BucketName,
  pathPrefix: string,
  options?: {
    metadata?: Record<string, string>;
    contentType?: string;
  }
): Promise<UploadResult> {
  console.log('🚀 [R2] uploadToR2 started');
  console.log('📁 [R2] File:', file.name, file.size, 'bytes');
  console.log('🪣 [R2] Bucket:', bucket);
  console.log('📂 [R2] Path prefix:', pathPrefix);
  
  try {
    const fileName = generateUniqueFileName(file.name);
    const fullPath = `${pathPrefix}/${fileName}`;
    console.log('🔗 [R2] Full path:', fullPath);
    
    // Convertir File a Buffer
    console.log('🔄 [R2] Converting file to buffer...');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('✅ [R2] Buffer created, size:', buffer.length);
    
    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: fullPath,
      Body: buffer,
      ContentType: options?.contentType || file.type,
      Metadata: {
        'original-name': file.name,
        'upload-timestamp': new Date().toISOString(),
        'file-size': file.size.toString(),
        ...options?.metadata,
      },
    });

    console.log('📤 [R2] Sending put command...');
    await r2Client.send(putCommand);
    console.log('✅ [R2] File uploaded successfully');
    
    const publicUrl = buildPublicUrl(bucket, fullPath);
    console.log('🔗 [R2] Public URL:', publicUrl);
    
    return {
      success: true,
      url: publicUrl,
      path: fullPath,
    };
  } catch (error) {
    console.error('❌ [R2] Error uploading to R2:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al subir archivo',
    };
  }
}

/**
 * Elimina un archivo de R2
 */
export async function deleteFromR2(bucket: R2BucketName, path: string): Promise<boolean> {
  try {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucket,
      Key: path,
    });

    await r2Client.send(deleteCommand);
    return true;
  } catch (error) {
    console.error('Error deleting from R2:', error);
    return false;
  }
}

/**
 * Funciones específicas para cada tipo de imagen
 */

// Para imágenes del carrusel
export async function uploadCarouselImage(file: File): Promise<UploadResult> {
  return uploadToR2(
    file,
    R2_BUCKETS.CAROUSEL_IMAGES,
    R2_PATHS.CAROUSEL.PUBLIC,
    {
      metadata: {
        category: 'carousel',
        type: 'banner-image',
      }
    }
  );
}

// Para imagen de portada de producto
export async function uploadProductCoverImage(file: File, productModel?: string): Promise<UploadResult> {
  const pathPrefix = productModel 
    ? `${R2_PATHS.PRODUCTS.COVERS}/${productModel}` 
    : R2_PATHS.PRODUCTS.COVERS;

  return uploadToR2(
    file,
    R2_BUCKETS.PRODUCT_IMAGES,
    pathPrefix,
    {
      metadata: {
        category: 'product',
        type: 'cover-image',
        model: productModel || 'unknown',
      }
    }
  );
}

// Para imágenes de colores de producto
export async function uploadProductColorImage(file: File, productModel?: string, colorName?: string): Promise<UploadResult> {
  const pathPrefix = productModel 
    ? `${R2_PATHS.PRODUCTS.COLORS}/${productModel}` 
    : R2_PATHS.PRODUCTS.COLORS;

  return uploadToR2(
    file,
    R2_BUCKETS.PRODUCT_IMAGES,
    pathPrefix,
    {
      metadata: {
        category: 'product',
        type: 'color-image',
        model: productModel || 'unknown',
        color: colorName || 'unknown',
      }
    }
  );
}

/**
 * Función helper para extraer el path de una URL de R2
 */
export function extractPathFromR2Url(url: string): string | null {
  try {
    const customDomain = process.env.R2_PUBLIC_DOMAIN;
    
    if (customDomain && url.startsWith(customDomain)) {
      return url.replace(`${customDomain}/`, '');
    }
    
    // Para URLs del formato: https://pub-{account}.r2.dev/path
    const match = url.match(/https:\/\/pub-[\w-]+\.r2\.dev\/(.+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
