import { S3Client } from '@aws-sdk/client-s3';

/**
 * JustPhones — cliente S3 compatible con Cloudflare R2, con fallback demo.
 *
 * - Importar este módulo NUNCA crea conexiones ni crashea sin env (antes había
 *   un `new S3Client` a nivel de módulo con `!` sobre env ausente + logs de
 *   credenciales en cada import; eso se eliminó).
 * - `r2Client` mantiene su nombre y tipo, pero ahora es un proxy perezoso:
 *   con env funciona igual que antes; sin env, cualquier uso lanza un error
 *   claro en lugar de fallar dentro del SDK.
 * - `getR2Client()` es la forma explícita (crea y cachea el `S3Client` real).
 */

// Configuración de buckets (usando los nombres reales de tu Cloudflare)
export const R2_BUCKETS = {
  CAROUSEL_IMAGES: 'carousel-images',
  PRODUCT_IMAGES: 'product-images',
} as const;

export type R2BucketName = typeof R2_BUCKETS[keyof typeof R2_BUCKETS];

export const R2_UNCONFIGURED_MESSAGE =
  'Cloudflare R2 no está configurado: faltan R2_ENDPOINT / R2_ACCESS_KEY_ID / ' +
  'R2_SECRET_ACCESS_KEY. Definilas en .env.local (ver .env.local.example) o usá el ' +
  'modo demo, donde la subida de imágenes es no-op.';

function readEnv(key: string): string | undefined {
  try {
    return (
      globalThis as { process?: { env?: Record<string, string | undefined> } }
    ).process?.env?.[key];
  } catch {
    return undefined;
  }
}

/** true si están las 3 vars server-side de R2. */
export function isR2Configured(): boolean {
  return Boolean(
    readEnv('R2_ENDPOINT') && readEnv('R2_ACCESS_KEY_ID') && readEnv('R2_SECRET_ACCESS_KEY'),
  );
}

let cachedClient: S3Client | null = null;

/** Crea (y cachea) el `S3Client` real; lanza error claro sin env. */
export function getR2Client(): S3Client {
  if (cachedClient) return cachedClient;
  const endpoint = readEnv('R2_ENDPOINT');
  const accessKeyId = readEnv('R2_ACCESS_KEY_ID');
  const secretAccessKey = readEnv('R2_SECRET_ACCESS_KEY');
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(R2_UNCONFIGURED_MESSAGE);
  }
  // Configuración del cliente S3 compatible con Cloudflare R2.
  // Cloudflare R2 siempre usa 'auto' como región.
  cachedClient = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cachedClient;
}

/**
 * Proxy perezoso con la misma superficie que el `S3Client` anterior.
 * Sin env, el primer acceso (p. ej. `.send(...)`) lanza el error claro.
 */
export const r2Client: S3Client = new Proxy({} as S3Client, {
  get(_target, prop) {
    const client = getR2Client();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
  set(_target, prop, value) {
    (getR2Client() as unknown as Record<string | symbol, unknown>)[prop] = value;
    return true;
  },
});
