import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@supabase/supabase-js';
import { isDemoMode } from '@/lib/demo';

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  const markers = ['placeholder', 'YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY', 'example'];
  return !markers.some((m) => url.includes(m) || key.includes(m));
}

function useDemo(): boolean {
  try {
    if (isDemoMode()) return true;
  } catch {
    return true;
  }
  return !isSupabaseConfigured();
}

function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string);
  return createServerClient(url, key);
}

function toErrorMessage(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

export async function POST(req: Request) {
  const demo = useDemo();
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const pedidoId = typeof body.pedidoId === 'string' ? body.pedidoId : null;
    const entryIds = body.entryIds;

    if (!Array.isArray(entryIds) || entryIds.length === 0 || !entryIds.every((v) => typeof v === 'string')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Se requiere "entryIds" como arreglo no vacío de strings y opcionalmente "pedidoId".',
          demo,
        },
        { status: 400 },
      );
    }
    const ids = entryIds as string[];

    if (demo) {
      return NextResponse.json({
        success: true,
        deleted: ids.length,
        pedidoId,
        entryIds: ids,
        demo: true,
      });
    }

    const supabase = getServerClient();
    const { error, count } = await supabase
      .from('stock_history')
      .delete({ count: 'exact' })
      .in('id', ids);
    if (error) {
      return NextResponse.json(
        { success: false, error: `No se pudo eliminar el pedido: ${error.message}`, demo: false },
        { status: 500 },
      );
    }
    return NextResponse.json({
      success: true,
      deleted: count ?? ids.length,
      pedidoId,
      entryIds: ids,
      demo: false,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: toErrorMessage(e, 'Error inesperado al eliminar el pedido.'), demo },
      { status: 500 },
    );
  }
}
