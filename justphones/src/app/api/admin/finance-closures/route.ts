import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@supabase/supabase-js';
import { isDemoMode } from '@/lib/demo';

export const dynamic = 'force-dynamic';

type FinanceClosure = {
  id: string;
  month: string;
  start_date: string;
  created_at: string | null;
  opening_capital: number;
  closing_capital: number | null;
  period_income: number | null;
  period_costs: number | null;
  period_net: number | null;
  period_end_date: string | null;
};

// Demo coherente inline (no depende de src/lib de otro agente).
// Encadena capitales: el opening de cada mes = closing del anterior.
const DEMO_CLOSURES: FinanceClosure[] = [
  {
    id: 'demo-close-001',
    month: '2026-04',
    start_date: '2026-04-01T00:00:00.000Z',
    created_at: '2026-05-01T00:00:00.000Z',
    opening_capital: 500000,
    closing_capital: 638500,
    period_income: 484500,
    period_costs: 346000,
    period_net: 138500,
    period_end_date: '2026-04-30T23:59:59.000Z',
  },
  {
    id: 'demo-close-002',
    month: '2026-05',
    start_date: '2026-05-01T00:00:00.000Z',
    created_at: '2026-06-01T00:00:00.000Z',
    opening_capital: 638500,
    closing_capital: 795000,
    period_income: 526500,
    period_costs: 370000,
    period_net: 156500,
    period_end_date: '2026-05-31T23:59:59.000Z',
  },
  {
    id: 'demo-close-003',
    month: '2026-06',
    start_date: '2026-06-01T00:00:00.000Z',
    created_at: null,
    opening_capital: 795000,
    closing_capital: null,
    period_income: null,
    period_costs: null,
    period_net: null,
    period_end_date: null,
  },
];

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

export async function GET() {
  const demo = useDemo();
  try {
    if (demo) {
      return NextResponse.json({ success: true, data: DEMO_CLOSURES, demo: true });
    }
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('finance_closures')
      .select('*')
      .order('start_date', { ascending: true });
    if (error) {
      return NextResponse.json(
        { success: false, error: `No se pudieron cargar los cierres de caja: ${error.message}`, demo: false },
        { status: 500 },
      );
    }
    return NextResponse.json({ success: true, data: data ?? [], demo: false });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: toErrorMessage(e, 'Error inesperado al cargar los cierres de caja.'), demo },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const demo = useDemo();
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const month = typeof body.month === 'string' ? body.month : '';
    const rawStart =
      typeof body.start_date === 'string'
        ? body.start_date
        : typeof body.startDate === 'string'
          ? body.startDate
          : new Date().toISOString();

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return NextResponse.json(
        { success: false, error: 'El campo "month" es requerido con formato YYYY-MM (ej. 2026-06).', demo },
        { status: 400 },
      );
    }
    const start = new Date(rawStart);
    if (Number.isNaN(start.getTime())) {
      return NextResponse.json(
        { success: false, error: 'El campo "startDate" no es una fecha válida (ISO).', demo },
        { status: 400 },
      );
    }

    if (demo) {
      const last = DEMO_CLOSURES[DEMO_CLOSURES.length - 1];
      const data: FinanceClosure = {
        id: `demo-close-${Date.now()}`,
        month,
        start_date: start.toISOString(),
        created_at: new Date().toISOString(),
        opening_capital: last?.closing_capital ?? last?.opening_capital ?? 0,
        closing_capital: null,
        period_income: null,
        period_costs: null,
        period_net: null,
        period_end_date: null,
      };
      return NextResponse.json(
        { success: true, data, finalizedMonth: null, demo: true },
        { status: 201 },
      );
    }

    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('finance_closures')
      .insert([{ month, start_date: start.toISOString() }])
      .select('*')
      .single();
    if (error) {
      return NextResponse.json(
        { success: false, error: `No se pudo registrar el cierre de caja: ${error.message}`, demo: false },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { success: true, data, finalizedMonth: null, demo: false },
      { status: 201 },
    );
  } catch (e) {
    return NextResponse.json(
      { success: false, error: toErrorMessage(e, 'Error inesperado al registrar el cierre de caja.'), demo },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const demo = useDemo();
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const id = typeof body.id === 'string' ? body.id : null;

    if (demo) {
      const deleted =
        DEMO_CLOSURES.find((c) => c.id === id) ?? DEMO_CLOSURES[DEMO_CLOSURES.length - 1];
      return NextResponse.json({ success: true, deleted, demo: true });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Se requiere el campo "id" del cierre a revertir.', demo: false },
        { status: 400 },
      );
    }
    const supabase = getServerClient();
    const { data: existing, error: fetchError } = await supabase
      .from('finance_closures')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, error: 'Cierre no encontrado: no existe un cierre con ese "id".', demo: false },
        { status: 404 },
      );
    }
    const { error } = await supabase.from('finance_closures').delete().eq('id', id);
    if (error) {
      return NextResponse.json(
        { success: false, error: `No se pudo revertir el cierre: ${error.message}`, demo: false },
        { status: 500 },
      );
    }
    return NextResponse.json({ success: true, deleted: existing, demo: false });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: toErrorMessage(e, 'Error inesperado al revertir el cierre.'), demo },
      { status: 500 },
    );
  }
}
