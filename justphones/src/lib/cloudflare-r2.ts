/**
 * JustPhones — alias histórico de Cloudflare R2.
 *
 * Este módulo estaba vacío y nada lo importa hoy; se deja como alias
 * demo-safe de `r2-client.ts` para compatibilidad futura. Importarlo no crea
 * conexiones ni requiere env (el cliente real es perezoso).
 */

export {
  R2_BUCKETS,
  R2_UNCONFIGURED_MESSAGE,
  getR2Client,
  isR2Configured,
  r2Client,
} from './r2-client';
export type { R2BucketName } from './r2-client';
