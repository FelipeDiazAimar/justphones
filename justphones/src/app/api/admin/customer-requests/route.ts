import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@supabase/supabase-js';
import { DEMO_PRODUCTS, isDemoMode } from '@/lib/demo';

export const dynamic = 'force-dynamic';

type CustomerRequest = {
  id: string;
  created_at: string;
  product_id: string;
  product_name: string;
  product_model: string;
  color_name: string;
  color_hex: string;
  quantity: number;
};

// Mapeo inline mínimo color -> hex (adaptador local; no toca src/lib).
const DEMO_HEX_BY_COLOR: Record<string, string> = {
  Transparente: '#FFFFFF',
  'Negro Humo': '#1C1C1E',
  'Negro Mate': '#1C1C1E',
  Negro: '#1C1C1E',
  'Azul Medianoche': '#1D3461',
  'Azul Marino': '#1D3461',
  'Verde Oliva': '#5C5F37',
  'Verde Menta': '#98FF98',
  Menta: '#98FF98',
  'Marrón Castaño': '#8B5E3C',
  Blanco: '#F5F5F7',
  Rojo: '#FF3B30',
  Lila: '#C8A2C8',
  Plata: '#C0C0C0',
  'Azul Celeste': '#AEC6CF',
  'Rosa Durazno': '#FFCBA4',
};

function demoHex(colorName: string): string {
  return DEMO_HEX_BY_COLOR[colorName] ?? '#9CA3AF';
}

// Pedidos demo coherentes derivados del contrato demo (slug/modelo/color reales).
const now = Date.now();
const DEMO_REQUESTS: CustomerRequest[] = DEMO_PRODUCTS.slice(0, 8).map((p, i) => ({
  id: `demo-req-${String(i + 1).padStart(3, '0')}`,
  created_at: new Date(now - i * 86_400_000).toISOString(),
  product_id: p.id,
  product_name: p.slug,
  product_model: p.modelos[0] ?? 'Universal',
  color_name: p.colores[0] ?? 'Único',
  color_hex: demoHex(p.colores[0] ?? ''),
  quantity: (i % 3) + 1,
}));

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

function validateRequestInput(
  input: Record<string, unknown>,
): { ok: true; value: Omit<CustomerRequest, 'id' | 'created_at'> } | { ok: false; error: string } {
  const product_id = typeof input.product_id === 'string' ? input.product_id.trim() : '';
  const product_name = typeof input.product_name === 'string' ? input.product_name.trim() : '';
  const product_model = typeof input.product_model === 'string' ? input.product_model.trim() : '';
  const color_name = typeof input.color_name === 'string' ? input.color_name.trim() : '';
  const color_hex = typeof input.color_hex === 'string' ? input.color_hex.trim() : demoHex(color_name);
  const quantity = input.quantity;
  if (!product_id) return { ok: false, error: 'El campo "product_id" es requerido.' };
  if (!product_name) return { ok: false, error: 'El campo "product_name" es requerido.' };
  if (!product_model) return { ok: false, error: 'El campo "product_model" es requerido.' };
  if (!color_name) return { ok: false, error: 'El campo "color_name" es requerido.' };
  if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity < 1) {
    return { ok: false, error: 'El campo "quantity" debe ser un número >= 1.' };
  }
  return { ok: true, value: { product_id, product_name, product_model, color_name, color_hex, quantity } };
}

export async function GET() {
  const demo = useDemo();
  try {
    if (demo) {
      return NextResponse.json({ success: true, data: DEMO_REQUESTS, demo: true });
    }
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('customer_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      return NextResponse.json(
        { success: false, error: `No se pudieron cargar los pedidos: ${error.message}`, demo: false },
        { status: 500 },
      );
    }
    return NextResponse.json({ success: true, data: data ?? [], demo: false });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: toErrorMessage(e, 'Error inesperado al cargar los pedidos.'), demo },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const demo = useDemo();
  try {
    const body = (await req.json().catch(() => null)) as unknown;
    const items = Array.isArray(body) ? body : [body];
    if (items.length === 0 || items.some((v) => typeof v !== 'object' || v === null)) {
      return NextResponse.json(
        { success: false, error: 'Enviá un pedido o un arreglo de pedidos con product_id, product_name, product_model, color_name y quantity.', demo },
        { status: 400 },
      );
    }
    const values: Omit<CustomerRequest, 'id' | 'created_at'>[] = [];
    for (const item of items) {
      const checked = validateRequestInput(item as Record<string, unknown>);
      if (!checked.ok) {
        return NextResponse.json({ success: false, error: checked.error, demo }, { status: 400 });
      }
      values.push(checked.value);
    }

    if (demo) {
      const created: CustomerRequest[] = values.map((v, i) => ({
        ...v,
        id: `demo-req-${Date.now()}-${i}`,
        created_at: new Date().toISOString(),
      }));
      return NextResponse.json(
        { success: true, data: Array.isArray(body) ? created : created[0], demo: true },
        { status: 201 },
      );
    }

    const supabase = getServerClient();
    const { data, error } = await supabase.from('customer_requests').insert(values).select('*');
    if (error) {
      return NextResponse.json(
        { success: false, error: `No se pudo crear el pedido: ${error.message}`, demo: false },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { success: true, data: Array.isArray(body) ? (data ?? []) : (data?.[0] ?? null), demo: false },
      { status: 201 },
    );
  } catch (e) {
    return NextResponse.json(
      { success: false, error: toErrorMessage(e, 'Error inesperado al crear el pedido.'), demo },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  const demo = useDemo();
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const id = typeof body.id === 'string' ? body.id : '';
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Se requiere el campo "id" del pedido a actualizar.', demo },
        { status: 400 },
      );
    }
    const allowed: Array<keyof Omit<CustomerRequest, 'id' | 'created_at'>> = [
      'product_id',
      'product_name',
      'product_model',
      'color_name',
      'color_hex',
      'quantity',
    ];
    const fields: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) fields[key] = body[key];
    }
    if (Object.keys(fields).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay cambios: incluí al menos un campo (quantity, color_name, etc.).', demo },
        { status: 400 },
      );
    }
    if (fields.quantity !== undefined) {
      const q = fields.quantity;
      if (typeof q !== 'number' || !Number.isFinite(q) || q < 1) {
        return NextResponse.json(
          { success: false, error: 'El campo "quantity" debe ser un número >= 1.', demo },
          { status: 400 },
        );
      }
    }

    if (demo) {
      const base =
        DEMO_REQUESTS.find((r) => r.id === id) ??
        ({
          id,
          created_at: new Date().toISOString(),
          product_id: 'demo-001',
          product_name: 'demo',
          product_model: 'Universal',
          color_name: 'Único',
          color_hex: '#9CA3AF',
          quantity: 1,
        } satisfies CustomerRequest);
      return NextResponse.json({ success: true, data: { ...base, ...fields }, demo: true });
    }

    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('customer_requests')
      .update(fields)
      .eq('id', id)
      .select('*')
      .single();
    if (error) {
      return NextResponse.json(
        { success: false, error: `No se pudo actualizar el pedido: ${error.message}`, demo: false },
        { status: 500 },
      );
    }
    return NextResponse.json({ success: true, data, demo: false });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: toErrorMessage(e, 'Error inesperado al actualizar el pedido.'), demo },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const demo = useDemo();
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const url = new URL(req.url);
    const id =
      typeof body.id === 'string' && body.id
        ? body.id
        : typeof url.searchParams.get('id') === 'string'
          ? (url.searchParams.get('id') as string)
          : '';

    if (demo) {
      return NextResponse.json({ success: true, deleted: id || 'demo-req-001', id: id || 'demo-req-001', demo: true });
    }
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Se requiere el campo "id" del pedido a eliminar.', demo: false },
        { status: 400 },
      );
    }
    const supabase = getServerClient();
    const { error } = await supabase.from('customer_requests').delete().eq('id', id);
    if (error) {
      return NextResponse.json(
        { success: false, error: `No se pudo eliminar el pedido: ${error.message}`, demo: false },
        { status: 500 },
      );
    }
    return NextResponse.json({ success: true, deleted: id, id, demo: false });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: toErrorMessage(e, 'Error inesperado al eliminar el pedido.'), demo },
      { status: 500 },
    );
  }
}
