import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type MaybeNumber = number | string | null | undefined

type RawUpdate = {
  id?: string
  quantity_added?: MaybeNumber
  cost?: MaybeNumber
}

type NormalizedUpdate = {
  id: string
  payload: Record<string, number>
}

function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined

  if (!url) {
    console.error('[API][STOCK-UPDATE] Missing NEXT_PUBLIC_SUPABASE_URL')
    throw new Error('Missing Supabase URL')
  }

  const key = serviceKey || anonKey
  if (!key) {
    console.error('[API][STOCK-UPDATE] Missing Supabase keys (service or anon)')
    throw new Error('Missing Supabase keys')
  }

  const isAdmin = Boolean(serviceKey)
  if (!isAdmin) {
    console.warn('[API][STOCK-UPDATE] Using ANON key fallback. Set SUPABASE_SERVICE_ROLE_KEY for admin updates to bypass RLS restrictions.')
  }

  const client = createClient(url, key, {
    db: { schema: 'public' },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  return { client, isAdmin }
}

function coerceNumber(value: MaybeNumber, field: string): number | null {
  if (value === null || value === undefined || value === '') return null
  const numeric = typeof value === 'string' ? Number(value.replace(',', '.')) : Number(value)
  if (!Number.isFinite(numeric)) {
    throw new Error(`El campo ${field} debe ser numérico`)
  }
  if (numeric < 0) {
    throw new Error(`El campo ${field} no puede ser negativo`)
  }
  return Math.round(numeric * 100) / 100
}

function normalizeUpdates(body: unknown): NormalizedUpdate[] {
  if (!body || typeof body !== 'object') {
    throw new Error('Cuerpo inválido')
  }

  const rawBody = body as { updates?: RawUpdate[] } & RawUpdate
  const rawUpdates: RawUpdate[] = Array.isArray(rawBody.updates) ? rawBody.updates : []

  // Permitir formato corto { id, cost, quantity_added }
  if (!rawUpdates.length && rawBody.id) {
    rawUpdates.push({ id: rawBody.id, cost: rawBody.cost, quantity_added: rawBody.quantity_added })
  }

  if (!rawUpdates.length) {
    throw new Error('Se requieren registros para actualizar')
  }

  const normalized: NormalizedUpdate[] = rawUpdates.map((update, idx) => {
    const { id } = update
    if (!id || typeof id !== 'string') {
      throw new Error(`ID inválido en la posición ${idx}`)
    }

    const payload: Record<string, number> = {}
    const qty = coerceNumber(update.quantity_added, 'quantity_added')
    const cost = coerceNumber(update.cost, 'cost')

    if (qty !== null) payload.quantity_added = qty
    if (cost !== null) payload.cost = cost

    if (Object.keys(payload).length === 0) {
      throw new Error(`No hay campos válidos para actualizar en el registro ${id}`)
    }

    return { id, payload }
  })

  return normalized
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const updates = normalizeUpdates(body)

    const { client: supabase, isAdmin } = getServerClient()

    const updatedRows: Record<string, unknown>[] = []

    for (const update of updates) {
      const { id, payload } = update
      const { error, data, count } = await supabase
        .from('stock_history')
        .update(payload, { count: 'exact' })
        .eq('id', id)
        .select()

      if (error) {
        console.error('[API][STOCK-UPDATE] Error updating row', { id, error: error.message })
        return NextResponse.json({ success: false, error: error.message, id }, { status: 500 })
      }

      if (typeof count === 'number' && count === 0) {
        const msg = isAdmin ? 'Registro no encontrado' : 'Registro no encontrado o bloqueado por RLS'
        console.warn('[API][STOCK-UPDATE] No rows updated for id', { id, isAdmin })
        return NextResponse.json({ success: false, error: msg, id }, { status: isAdmin ? 404 : 403 })
      }

      if (Array.isArray(data) && data.length > 0) {
        updatedRows.push(data[0])
      }
    }

    return NextResponse.json({ success: true, updated: updatedRows, count: updatedRows.length })
  } catch (err: unknown) {
    console.error('[API][STOCK-UPDATE] Unexpected error', err)
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
