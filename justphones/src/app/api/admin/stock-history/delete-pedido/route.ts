import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined

  if (!url) {
    console.error('[API][DELETE-PEDIDO] Missing NEXT_PUBLIC_SUPABASE_URL')
    throw new Error('Missing Supabase URL')
  }

  const key = serviceKey || anonKey
  if (!key) {
    console.error('[API][DELETE-PEDIDO] Missing Supabase keys (service or anon)')
    throw new Error('Missing Supabase keys')
  }

  const isAdmin = Boolean(serviceKey)
  if (!isAdmin) {
    console.warn('[API][DELETE-PEDIDO] Using ANON key fallback. Set SUPABASE_SERVICE_ROLE_KEY for admin deletes.')
  }

  const client = createClient(url, key, {
    db: { schema: 'public' },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  return { client, isAdmin }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { pedidoId, entryIds } = body as { pedidoId?: string; entryIds?: string[] }
    if (!pedidoId && (!entryIds || entryIds.length === 0)) {
      return NextResponse.json({ success: false, error: 'Missing pedidoId or entryIds' }, { status: 400 })
    }

  const { client: supabase, isAdmin } = getServerClient()

    // Try delete by IDs first if provided
    let totalDeleted = 0
    if (entryIds && entryIds.length > 0) {
      const { error, count } = await supabase
        .from('stock_history')
        .delete({ count: 'exact' })
        .in('id', entryIds)

      if (error) {
        console.error('[API][DELETE-PEDIDO] Error deleting by ids', error.message)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }
      totalDeleted += count || 0
    }

    // If none deleted, try by pedido_id
    if (totalDeleted === 0 && pedidoId) {
      const { error, count } = await supabase
        .from('stock_history')
        .delete({ count: 'exact' })
        .eq('pedido_id', pedidoId)

      if (error) {
        console.error('[API][DELETE-PEDIDO] Error deleting by pedido_id', error.message)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }
      totalDeleted += count || 0
    }

    // Soft-delete fallback
    if (totalDeleted === 0 && pedidoId) {
      const { error, count } = await supabase
        .from('stock_history')
        .update({ quantity_added: 0, notes: '__DELETED__' }, { count: 'exact' as any })
        .eq('pedido_id', pedidoId)

      if (error) {
        console.error('[API][DELETE-PEDIDO] Error soft-deleting by pedido_id', error.message)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }
      totalDeleted += count || 0
    }

    if (totalDeleted === 0) {
      return NextResponse.json({ success: false, error: 'No rows deleted (RLS?)', isAdmin }, { status: 403 })
    }

    return NextResponse.json({ success: true, deleted: totalDeleted, isAdmin })
  } catch (e: any) {
    console.error('[API][DELETE-PEDIDO] Unexpected error', e)
    return NextResponse.json({ success: false, error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
