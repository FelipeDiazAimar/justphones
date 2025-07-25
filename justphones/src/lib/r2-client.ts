import { S3Client } from '@aws-sdk/client-s3';

// Debug: Verificar qué credenciales está leyendo
console.log('🔍 [R2 CLIENT] Environment variables check:');
console.log('📍 R2_ENDPOINT:', process.env.R2_ENDPOINT);
console.log('🔑 R2_ACCESS_KEY_ID:', process.env.R2_ACCESS_KEY_ID ? `${process.env.R2_ACCESS_KEY_ID.substring(0, 8)}...` : 'MISSING');
console.log('🗝️ R2_SECRET_ACCESS_KEY:', process.env.R2_SECRET_ACCESS_KEY ? `${process.env.R2_SECRET_ACCESS_KEY.substring(0, 8)}...` : 'MISSING');

// Configuración del cliente S3 compatible con Cloudflare R2
export const r2Client = new S3Client({
  region: 'auto', // Cloudflare R2 siempre usa 'auto'
  endpoint: process.env.R2_ENDPOINT!, // Tu endpoint de R2 (ej: https://abc123.r2.cloudflarestorage.com)
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// Configuración de buckets (usando los nombres reales de tu Cloudflare)
export const R2_BUCKETS = {
  CAROUSEL_IMAGES: 'carousel-images',
  PRODUCT_IMAGES: 'product-images',
} as const;

export type R2BucketName = typeof R2_BUCKETS[keyof typeof R2_BUCKETS];
