import { NextResponse } from 'next/server';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createClient as createServerClient } from '@supabase/supabase-js';
import { isDemoMode } from '@/lib/demo';

const MOCK_CAROUSEL_URL = 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=1200&q=80';
const MAX_BYTES = 10 * 1024 * 1024;

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

function sanitizeFileName(name: string): string {
  const clean = name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
  return clean || 'carousel.jpg';
}

function toErrorMessage(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

export async function POST(req: Request) {
  const demo = useDemo();
  try {
    const form = await req.formData().catch(() => null);
    if (!form) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se pudo leer el formulario. Enviá el campo "file" como multipart/form-data.',
          demo,
        },
        { status: 400 },
      );
    }
    const file = form.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se recibió ningún archivo. Enviá el campo "file" como multipart/form-data.',
          demo,
        },
        { status: 400 },
      );
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: `El archivo debe ser una imagen (recibido: ${file.type || 'desconocido'}).`, demo },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: 'La imagen supera el máximo permitido de 10 MB.', demo },
        { status: 400 },
      );
    }

    if (demo) {
      return NextResponse.json({
        success: true,
        url: MOCK_CAROUSEL_URL,
        metadataId: `demo-meta-${Date.now()}`,
        fileName: file.name,
        fileSize: file.size,
        demo: true,
      });
    }

    // Path real: subida a Cloudflare R2 + metadata en Supabase (best-effort).
    const key = `carousel/public/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${sanitizeFileName(file.name)}`;

    const client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT as string,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
      },
    });
    const bytes = Buffer.from(await file.arrayBuffer());
    await client.send(
      new PutObjectCommand({
        Bucket: 'carousel-images',
        Key: key,
        Body: bytes,
        ContentType: file.type,
      }),
    );

    const base =
      process.env.R2_CAROUSEL_PUBLIC_URL ||
      process.env.R2_PUBLIC_DOMAIN ||
      `https://pub-${process.env.R2_ACCOUNT_ID ?? 'r2'}.r2.dev`;
    const url = `${base}/${key}`;

    let metadataId: string | undefined;
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string,
      );
      const { data } = await supabase
        .from('uploaded_images')
        .insert([
          {
            url,
            original_name: file.name,
            file_size: file.size,
            mime_type: file.type,
            bucket: 'carousel-images',
            storage_path: key,
            category: 'carousel',
            uploaded_at: new Date().toISOString(),
          },
        ])
        .select('id')
        .single();
      metadataId = (data as { id?: string } | null)?.id;
    } catch {
      metadataId = undefined;
    }

    return NextResponse.json(
      { success: true, url, path: key, metadataId, demo: false },
      { status: 201 },
    );
  } catch (e) {
    return NextResponse.json(
      { success: false, error: toErrorMessage(e, 'Error inesperado al subir la imagen del carrusel.'), demo },
      { status: 500 },
    );
  }
}
