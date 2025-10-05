import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const TABLE_NAME = 'finance_closures'
type ClosureRow = { id: string; month: string; start_date: string; created_at: string | null }
type RawClosureRow = Record<string, unknown>

function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined

  if (!url) {
    console.error('[API][FINANCE-CLOSURES] Missing NEXT_PUBLIC_SUPABASE_URL')
    throw new Error('Missing Supabase URL')
  }

  const key = serviceKey || anonKey
  if (!key) {
    console.error('[API][FINANCE-CLOSURES] Missing Supabase keys (service or anon)')
    throw new Error('Missing Supabase keys')
  }

  const isAdmin = Boolean(serviceKey)
  if (!isAdmin) {
    console.warn('[API][FINANCE-CLOSURES] Using ANON key fallback. Set SUPABASE_SERVICE_ROLE_KEY for full access.')
  }

  const client = createClient(url, key, {
    db: { schema: 'public' },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  return { client, isAdmin }
}

function validateMonth(month: unknown): string {
  if (typeof month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new Error('Formato de mes inválido. Usa AAAA-MM.')
  }
  return month
}

function validateStartDate(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Fecha de inicio inválida')
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Fecha de inicio inválida')
  }
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).toISOString()
}

function normalizeRow(row: RawClosureRow | null): ClosureRow | null {
  if (!row) return null
  const id = typeof row.id === 'string' ? row.id : null
  const month = typeof row.month === 'string' ? row.month : null
  const startDate = typeof row.start_date === 'string' ? row.start_date : null
  const createdAt = typeof row.created_at === 'string' ? row.created_at : null

  if (!id || !month || !startDate) {
    return null
  }

  return {
    id,
    month,
    start_date: startDate,
    created_at: createdAt,
  }
}

export async function GET() {
  try {
    const { client: supabase } = getServerClient()
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('start_date', { ascending: true })

    if (error) {
      console.error('[API][FINANCE-CLOSURES][GET] Supabase error:', error.message)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const normalized = Array.isArray(data)
      ? (data as RawClosureRow[])
          .map(item => normalizeRow(item))
          .filter((row): row is ClosureRow => Boolean(row))
      : []
    return NextResponse.json({ success: true, data: normalized })
  } catch (err) {
    console.error('[API][FINANCE-CLOSURES][GET] Unexpected error:', err)
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Cuerpo inválido' }, { status: 400 })
    }

    const payload = body as Record<string, unknown>
    const month = validateMonth(payload.month)
    const startDate = validateStartDate(payload.startDate)

    const { client: supabase } = getServerClient()

    const { data: existing, error: existingError } = await supabase
      .from(TABLE_NAME)
      .select('id, month')
      .eq('month', month)
      .maybeSingle()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('[API][FINANCE-CLOSURES][POST] Error buscando duplicados:', existingError.message)
      return NextResponse.json({ success: false, error: existingError.message }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json({ success: false, error: 'Ya existe un cierre para ese mes.' }, { status: 409 })
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert({ month, start_date: startDate })
      .select()
      .single()

    if (error) {
      console.error('[API][FINANCE-CLOSURES][POST] Supabase error:', error.message)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: normalizeRow(data) })
  } catch (err) {
    console.error('[API][FINANCE-CLOSURES][POST] Unexpected error:', err)
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Cuerpo inválido' }, { status: 400 })
    }

    const payload = body as Record<string, unknown>
    const id = typeof payload.id === 'string' ? payload.id : undefined

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido para revertir el cierre.' }, { status: 400 })
    }

    const { client: supabase } = getServerClient()

    const { data: latest, error: latestError } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestError && latestError.code !== 'PGRST116') {
      console.error('[API][FINANCE-CLOSURES][DELETE] Error obteniendo último cierre:', latestError.message)
      return NextResponse.json({ success: false, error: latestError.message }, { status: 500 })
    }

    if (!latest) {
      return NextResponse.json({ success: false, error: 'No hay cierres para revertir.' }, { status: 404 })
    }

    if (latest.id !== id) {
      return NextResponse.json({ success: false, error: 'Solo se puede revertir el último cierre registrado.' }, { status: 400 })
    }

    const { error } = await supabase
      .from(TABLE_NAME)
      .delete({ count: 'exact' })
      .eq('id', id)

    if (error) {
      console.error('[API][FINANCE-CLOSURES][DELETE] Supabase error:', error.message)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

  return NextResponse.json({ success: true, deleted: normalizeRow(latest as RawClosureRow) })
  } catch (err) {
    console.error('[API][FINANCE-CLOSURES][DELETE] Unexpected error:', err)
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
