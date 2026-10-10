import { NextResponse } from 'next/server';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createClient as createServerClient } from '@supabase/supabase-js';
import { isDemoMode } from '@/lib/demo';

function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY,
  );
}

function useDemo(): boolean {
  try {
    if (isDemoMode()) return true;
  } catch {
    return true;
  }
  return !isR2Configured();
}

function toErrorMessage(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

// Extrae el storage path desde una URL pública de R2.
// Soporta https://pub-<id>.r2.dev/<path> y dominios personalizados https://<dominio>/<path>.
function extractPathFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const match = parsed.hostname.match(/^pub-[\w-]+\.r2\.dev$/);
    if (match) {
      return parsed.pathname.replace(/^\/+/, '') || null;
    }
    const custom = process.env.R2_PUBLIC_DOMAIN;
    if (custom) {
      try {
        if (url.startsWith(custom)) return url.slice(custom.length).replace(/^\/+/, '') || null;
      } catch {
        // ignora y sigue con el fallback genérico
      }
    }
    const carousel = process.env.R2_CAROUSEL_PUBLIC_URL;
    if (carousel && url.startsWith(carousel)) {
      return url.slice(carousel.length).replace(/^\/+/, '') || null;
    }
    const product = process.env.R2_PRODUCT_PUBLIC_URL;
    if (product && url.startsWith(product)) {
      return url.slice(product.length).replace(/^\/+/, '') || null;
    }
    return null;
  } catch {
    return null;
  }
}

function inferBucket(path: string): 'carousel-images' | 'product-images' {
  return path.startsWith('carousel/') ? 'carousel-images' : 'product-images';
}

async function handleDelete(req: Request) {
  const demo = useDemo();
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const url = new URL(req.url);
    const rawUrl =
      typeof body.url === 'string' && body.url ? body.url : url.searchParams.get('url');
    const rawPath =
      typeof body.path === 'string' && body.path
        ? body.path
        : typeof body.key === 'string' && body.key
          ? body.key
          : url.searchParams.get('path');
    const rawBucket = typeof body.bucket === 'string' ? body.bucket : null;

    let path = rawPath ? rawPath.replace(/^\/+/, '') : null;
    if (!path && rawUrl) path = extractPathFromUrl(rawUrl);
    if (!path) {
      return NextResponse.json(
        {
          success: false,
          error: 'Se requiere "path" (storage key en R2) o una "url" pública de R2 para eliminarla.',
          demo,
        },
        { status: 400 },
      );
    }
    const bucket =
      rawBucket === 'carousel-images' || rawBucket === 'product-images'
        ? rawBucket
        : inferBucket(path);

    if (demo) {
      return NextResponse.json({
        success: true,
        message: 'Modo demo: archivo no eliminado (origen de ejemplo).',
        bucket,
        path,
        demo: true,
      });
    }

    const client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT as string,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
      },
    });
    try {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: path }));
    } catch (e) {
      return NextResponse.json(
        { success: false, error: `No se pudo eliminar el archivo en R2: ${toErrorMessage(e, 'error desconocido')}`, demo: false },
        { status: 500 },
      );
    }

    // Limpieza best-effort de la metadata en Supabase (no falla la operación si falla).
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string,
      );
      await supabase.from('uploaded_images').delete().eq('storage_path', path);
    } catch {
      // best-effort: se ignora
    }

    return NextResponse.json({ success: true, deleted: true, bucket, path, demo: false });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: toErrorMessage(e, 'Error inesperado al eliminar el archivo.'), demo },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  return handleDelete(req);
}

export async function DELETE(req: Request) {
  return handleDelete(req);
}
