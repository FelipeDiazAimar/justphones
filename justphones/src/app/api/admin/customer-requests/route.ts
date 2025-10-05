import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined

  if (!url) {
    console.error('[API] Missing NEXT_PUBLIC_SUPABASE_URL')
    throw new Error('Missing Supabase URL')
  }

  const key = serviceKey || anonKey
  if (!key) {
    console.error('[API] Missing Supabase keys (service or anon)')
    throw new Error('Missing Supabase keys')
  }

  const isAdmin = Boolean(serviceKey)
  if (!isAdmin) {
    console.warn('[API] Using ANON key fallback. Set SUPABASE_SERVICE_ROLE_KEY for admin deletes.')
  }

  const client = createClient(url, key, {
    db: { schema: 'public' },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  return { client, isAdmin }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const { client: supabase, isAdmin } = getServerClient()
    const { error, count } = await supabase
      .from('customer_requests')
      .delete({ count: 'exact' })
      .eq('id', id)

    if (error) {
      console.error('[API] Error deleting request', { id, error: error.message })
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (typeof count === 'number' && count === 0) {
      const msg = isAdmin ? 'No rows deleted' : 'No rows deleted (RLS may block anon key)'
      console.warn('[API] No rows deleted for id', { id, isAdmin })
      return NextResponse.json({ success: false, error: msg }, { status: isAdmin ? 404 : 403 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[API] Unexpected error', e)
    return NextResponse.json({ success: false, error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

interface UpdateRequestBody {
  id?: string
  payload?: Record<string, unknown>
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as UpdateRequestBody | null

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Cuerpo inválido' }, { status: 400 })
    }

    const { id, payload } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
    }

    if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
      return NextResponse.json({ success: false, error: 'Datos para actualizar requeridos' }, { status: 400 })
    }

    const { client: supabase, isAdmin } = getServerClient()
    if (!isAdmin) {
      console.warn('[API] PATCH /customer-requests usando ANON key; posibles restricciones RLS')
    }

    const { error, data, count } = await supabase
      .from('customer_requests')
      .update(payload, { count: 'exact' })
      .eq('id', id)
      .select()

    if (error) {
      console.error('[API] Error actualizando pedido', { id, error: error.message })
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (typeof count === 'number' && count === 0) {
      const msg = isAdmin ? 'No se encontró el pedido' : 'No se encontró el pedido o RLS bloqueó la actualización'
      console.warn('[API] PATCH sin filas actualizadas', { id, isAdmin })
      return NextResponse.json({ success: false, error: msg }, { status: isAdmin ? 404 : 403 })
    }

    return NextResponse.json({ success: true, data: data?.[0] ?? null })
  } catch (e: any) {
    console.error('[API] Error inesperado en PATCH', e)
    return NextResponse.json({ success: false, error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
