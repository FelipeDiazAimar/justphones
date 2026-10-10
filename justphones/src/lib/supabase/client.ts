import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * JustPhones — cliente Supabase browser con fallback demo.
 *
 * - Sin env (`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`):
 *   `createClient()` NO crashea ni crea conexiones. Devuelve un stub perezoso
 *   que solo lanza un error claro cuando se intenta usar
 *   (`.from(...).select()`, `.rpc(...)`, etc.). Crear el cliente, pasarlo por
 *   props o guardarlo en `useMemo`/`useState` es seguro.
 * - Con env: path real intacto (mismo `createBrowserClient` de antes; ahora
 *   con instancia cacheada, lo que además evita recrearlo en cada render).
 */

export const SUPABASE_UNCONFIGURED_MESSAGE =
  'Supabase no está configurado: faltan NEXT_PUBLIC_SUPABASE_URL y/o ' +
  'NEXT_PUBLIC_SUPABASE_ANON_KEY. Definilas en .env.local (ver .env.local.example) ' +
  'o usá el modo demo (NEXT_PUBLIC_DEMO_MODE distinto de "false").'

function readEnv(key: string): string | undefined {
  try {
    return (
      globalThis as { process?: { env?: Record<string, string | undefined> } }
    ).process?.env?.[key]
  } catch {
    return undefined
  }
}

/** true si hay URL y anon key reales (no placeholders). Client-safe. */
export function isSupabaseConfigured(): boolean {
  const url = readEnv('NEXT_PUBLIC_SUPABASE_URL')
  const key = readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return Boolean(url && key && !url.includes('placeholder'))
}

/**
 * Stub que encadena cualquier acceso (`.from('t').select()`, `.rpc(...)`)
 * y lanza el error claro solo al invocar el terminal. `await` directo del
 * cliente resuelve sin romper (prop `then` neutralizada).
 */
function createUnconfiguredClient(): SupabaseClient {
  const fail = (): never => {
    throw new Error(SUPABASE_UNCONFIGURED_MESSAGE)
  }
  const proxy = new Proxy(fail as unknown as Record<string | symbol, unknown>, {
    get(_target, prop) {
      if (prop === 'then' || typeof prop === 'symbol') return undefined
      return proxy
    },
    apply() {
      fail()
    },
  })
  return proxy as unknown as SupabaseClient
}

let cachedClient: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  if (!isSupabaseConfigured()) return createUnconfiguredClient()
  if (!cachedClient) {
    const url = readEnv('NEXT_PUBLIC_SUPABASE_URL') as string
    const key = readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') as string
    cachedClient = createBrowserClient(url, key, {
      db: { schema: 'public' },
    }) as unknown as SupabaseClient
  }
  return cachedClient
}
