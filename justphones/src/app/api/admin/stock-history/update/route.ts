import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@supabase/supabase-js';
import { isDemoMode } from '@/lib/demo';

type StockUpdateInput = {
  id: string;
  quantity_added?: number;
  cost?: number;
  price?: number;
};

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

function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export async function PATCH(req: Request) {
  const demo = useDemo();
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const updates = body.updates;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Se requiere "updates" como arreglo no vacío: [{ id, quantity_added?, cost? }].',
          demo,
        },
        { status: 400 },
      );
    }

    const parsed: StockUpdateInput[] = [];
    for (const item of updates) {
      if (typeof item !== 'object' || item === null || typeof (item as Record<string, unknown>).id !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Cada actualización debe incluir un "id" de tipo string.', demo },
          { status: 400 },
        );
      }
      const entry = item as Record<string, unknown>;
      const patch: StockUpdateInput = { id: entry.id as string };
      if (entry.quantity_added !== undefined) {
        if (!isValidNumber(entry.quantity_added)) {
          return NextResponse.json(
            { success: false, error: `"quantity_added" debe ser un número >= 0 (id ${(entry.id as string)}).`, demo },
            { status: 400 },
          );
        }
        patch.quantity_added = entry.quantity_added;
      }
      if (entry.cost !== undefined) {
        if (!isValidNumber(entry.cost)) {
          return NextResponse.json(
            { success: false, error: `"cost" debe ser un número >= 0 (id ${(entry.id as string)}).`, demo },
            { status: 400 },
          );
        }
        patch.cost = entry.cost;
      }
      if (entry.price !== undefined) {
        if (!isValidNumber(entry.price)) {
          return NextResponse.json(
            { success: false, error: `"price" debe ser un número >= 0 (id ${(entry.id as string)}).`, demo },
            { status: 400 },
          );
        }
        patch.price = entry.price;
      }
      if (patch.quantity_added === undefined && patch.cost === undefined && patch.price === undefined) {
        return NextResponse.json(
          {
            success: false,
            error: `La actualización (id ${patch.id}) no trae cambios: incluí "quantity_added", "cost" o "price".`,
            demo,
          },
          { status: 400 },
        );
      }
      parsed.push(patch);
    }

    if (demo) {
      const now = new Date().toISOString();
      const updated = parsed.map((u) => ({ ...u, updated_at: now }));
      return NextResponse.json({ success: true, updated, count: updated.length, demo: true });
    }

    const supabase = getServerClient();
    const updated: unknown[] = [];
    for (const u of parsed) {
      const { id, ...fields } = u;
      const { data, error } = await supabase
        .from('stock_history')
        .update(fields)
        .eq('id', id)
        .select('*');
      if (error) {
        return NextResponse.json(
          { success: false, error: `No se pudo actualizar el registro ${id}: ${error.message}`, demo: false },
          { status: 500 },
        );
      }
      if (!data || data.length === 0) {
        return NextResponse.json(
          { success: false, error: `Registro no encontrado en stock_history (id ${id}).`, demo: false },
          { status: 404 },
        );
      }
      updated.push(...data);
    }
    return NextResponse.json({ success: true, updated, count: updated.length, demo: false });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: toErrorMessage(e, 'Error inesperado al actualizar el historial de stock.'),
        demo,
      },
      { status: 500 },
    );
  }
}
