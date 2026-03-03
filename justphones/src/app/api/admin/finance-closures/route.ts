import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const TABLE_NAME = 'finance_closures'
type ClosureRow = {
  id: string
  month: string
  start_date: string
  created_at: string | null
  opening_capital: number
  closing_capital: number | null
  period_income: number | null
  period_costs: number | null
  period_net: number | null
  period_end_date: string | null
}
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

function parseCutoffDate(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return new Date().toISOString()
  }

  if (typeof value !== 'string') {
    throw new Error('Fecha de corte inválida')
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Fecha de corte inválida')
  }
  return date.toISOString()
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function normalizeRow(row: RawClosureRow | null): ClosureRow | null {
  if (!row) return null
  const id = typeof row.id === 'string' ? row.id : null
  const month = typeof row.month === 'string' ? row.month : null
  const startDate = typeof row.start_date === 'string' ? row.start_date : null
  const createdAt = typeof row.created_at === 'string' ? row.created_at : null
  const openingCapital = toNumber(row.opening_capital) ?? 0
  const closingCapital = toNumber(row.closing_capital)
  const periodIncome = toNumber(row.period_income)
  const periodCosts = toNumber(row.period_costs)
  const periodNet = toNumber(row.period_net)
  const periodEndDate = typeof row.period_end_date === 'string' ? row.period_end_date : null

  if (!id || !month || !startDate) {
    return null
  }

  return {
    id,
    month,
    start_date: startDate,
    created_at: createdAt,
    opening_capital: openingCapital,
    closing_capital: closingCapital,
    period_income: periodIncome,
    period_costs: periodCosts,
    period_net: periodNet,
    period_end_date: periodEndDate,
  }
}

type PeriodSummary = {
  income: number
  costs: number
  net: number
}

async function computePeriodSummary(
  supabase: ReturnType<typeof createClient>,
  month: string,
  startIso: string,
  endExclusiveIso: string,
): Promise<PeriodSummary> {
  const [
    salesResult,
    monetaryIncomeResult,
    salaryResult,
    stockResult,
    fixedCostsByMonthResult,
    fixedCostsWithoutMonthResult,
  ] = await Promise.all([
    supabase
      .from('sales')
      .select('total_price, created_at')
      .gte('created_at', startIso)
      .lt('created_at', endExclusiveIso),
    supabase
      .from('monetary_income')
      .select('name, amount, created_at')
      .gte('created_at', startIso)
      .lt('created_at', endExclusiveIso),
    supabase
      .from('salary_withdrawals')
      .select('amount, created_at')
      .gte('created_at', startIso)
      .lt('created_at', endExclusiveIso),
    supabase
      .from('stock_history')
      .select('cost, quantity_added, created_at')
      .gte('created_at', startIso)
      .lt('created_at', endExclusiveIso),
    supabase.from('fixed_costs').select('amount').eq('month', month),
    supabase
      .from('fixed_costs')
      .select('amount, created_at')
      .is('month', null)
      .gte('created_at', startIso)
      .lt('created_at', endExclusiveIso),
  ])

  const errors = [
    salesResult.error,
    monetaryIncomeResult.error,
    salaryResult.error,
    stockResult.error,
    fixedCostsByMonthResult.error,
    fixedCostsWithoutMonthResult.error,
  ].filter(Boolean)

  if (errors.length > 0) {
    const first = errors[0]
    throw new Error(first?.message ?? 'No se pudo calcular el cierre del período.')
  }

  const salesIncome = (salesResult.data ?? []).reduce((sum, sale) => {
    return sum + (toNumber((sale as Record<string, unknown>).total_price) ?? 0)
  }, 0)

  const positiveMonetaryIncome = (monetaryIncomeResult.data ?? []).reduce((sum, movement) => {
    const row = movement as Record<string, unknown>
    const amount = toNumber(row.amount) ?? 0
    const name = typeof row.name === 'string' ? row.name : ''
    if (amount > 0 && !name.startsWith('[EGRESO]')) {
      return sum + amount
    }
    return sum
  }, 0)

  const negativeMonetaryIncome = (monetaryIncomeResult.data ?? []).reduce((sum, movement) => {
    const row = movement as Record<string, unknown>
    const amount = toNumber(row.amount) ?? 0
    const name = typeof row.name === 'string' ? row.name : ''
    if (amount < 0 || name.startsWith('[EGRESO]')) {
      return sum + Math.abs(amount)
    }
    return sum
  }, 0)

  const salaryCosts = (salaryResult.data ?? []).reduce((sum, withdrawal) => {
    return sum + Math.abs(toNumber((withdrawal as Record<string, unknown>).amount) ?? 0)
  }, 0)

  const stockCosts = (stockResult.data ?? []).reduce((sum, stockEntry) => {
    const row = stockEntry as Record<string, unknown>
    const cost = toNumber(row.cost) ?? 0
    const quantityAdded = toNumber(row.quantity_added) ?? 0
    return sum + cost * quantityAdded
  }, 0)

  const fixedCostsByMonth = (fixedCostsByMonthResult.data ?? []).reduce((sum, fixedCost) => {
    return sum + Math.abs(toNumber((fixedCost as Record<string, unknown>).amount) ?? 0)
  }, 0)

  const fixedCostsWithoutMonth = (fixedCostsWithoutMonthResult.data ?? []).reduce((sum, fixedCost) => {
    return sum + Math.abs(toNumber((fixedCost as Record<string, unknown>).amount) ?? 0)
  }, 0)

  const income = salesIncome + positiveMonetaryIncome
  const costs = fixedCostsByMonth + fixedCostsWithoutMonth + salaryCosts + stockCosts + negativeMonetaryIncome
  const net = income - costs

  return { income, costs, net }
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
    const startDate = parseCutoffDate(payload.startDate)

    const { client: supabase } = getServerClient()

    const { data: existingByStartDate, error: existingByStartDateError } = await supabase
      .from(TABLE_NAME)
      .select('id, start_date')
      .eq('start_date', startDate)
      .maybeSingle()

    if (existingByStartDateError && existingByStartDateError.code !== 'PGRST116') {
      console.error('[API][FINANCE-CLOSURES][POST] Error buscando fecha duplicada:', existingByStartDateError.message)
      return NextResponse.json({ success: false, error: existingByStartDateError.message }, { status: 500 })
    }

    if (existingByStartDate) {
      return NextResponse.json({ success: false, error: 'Ya existe un cierre para esa fecha de corte.' }, { status: 409 })
    }

    const { data: allRows, error: listError } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('start_date', { ascending: true })

    if (listError) {
      console.error('[API][FINANCE-CLOSURES][POST] Error listando cierres:', listError.message)
      return NextResponse.json({ success: false, error: listError.message }, { status: 500 })
    }

    const normalizedRows = Array.isArray(allRows)
      ? (allRows as RawClosureRow[])
          .map(item => normalizeRow(item))
          .filter((row): row is ClosureRow => Boolean(row))
      : []

    const latestClosure = normalizedRows.length > 0 ? normalizedRows[normalizedRows.length - 1] : null
    const previousClosure = normalizedRows.length > 1 ? normalizedRows[normalizedRows.length - 2] : null
    if (latestClosure) {
      const latestTimestamp = new Date(latestClosure.start_date).getTime()
      const newTimestamp = new Date(startDate).getTime()
      if (newTimestamp <= latestTimestamp) {
        return NextResponse.json(
          {
            success: false,
            error: 'La fecha de corte debe ser posterior al último cierre registrado.',
          },
          { status: 400 },
        )
      }
    }

    let openingCapital = 0
    let finalizedMonth: string | null = null

    if (latestClosure) {
      const latestOpening = latestClosure.opening_capital ?? 0
      const latestAlreadyClosed =
        latestClosure.closing_capital !== null &&
        latestClosure.period_income !== null &&
        latestClosure.period_costs !== null &&
        latestClosure.period_net !== null

      let effectiveLatestOpening = latestOpening
      if (!latestAlreadyClosed && effectiveLatestOpening === 0 && previousClosure) {
        const previousDerivedClosing =
          previousClosure.closing_capital ??
          (previousClosure.period_net !== null
            ? (previousClosure.opening_capital ?? 0) + previousClosure.period_net
            : null)

        if (typeof previousDerivedClosing === 'number' && Number.isFinite(previousDerivedClosing)) {
          effectiveLatestOpening = previousDerivedClosing
        }
      }

      if (latestAlreadyClosed) {
        openingCapital = latestClosure.closing_capital ?? effectiveLatestOpening
      } else {
        const summary = await computePeriodSummary(
          supabase,
          latestClosure.month,
          latestClosure.start_date,
          startDate,
        )

        const latestClosing = effectiveLatestOpening + summary.net
        const previousPeriodEnd = new Date(new Date(startDate).getTime() - 1).toISOString()

        const { error: finalizeError } = await supabase
          .from(TABLE_NAME)
          .update({
            opening_capital: effectiveLatestOpening,
            period_income: summary.income,
            period_costs: summary.costs,
            period_net: summary.net,
            closing_capital: latestClosing,
            period_end_date: previousPeriodEnd,
          })
          .eq('id', latestClosure.id)

        if (finalizeError) {
          console.error('[API][FINANCE-CLOSURES][POST] Error finalizando período anterior:', finalizeError.message)
          return NextResponse.json({ success: false, error: finalizeError.message }, { status: 500 })
        }

        openingCapital = latestClosing
        finalizedMonth = latestClosure.month
      }
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert({
        month,
        start_date: startDate,
        opening_capital: openingCapital,
      })
      .select()
      .single()

    if (error) {
      console.error('[API][FINANCE-CLOSURES][POST] Supabase error:', error.message)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: normalizeRow(data), finalizedMonth })
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

    const { data: latestRows, error: latestError } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('start_date', { ascending: false })
      .limit(2)

    if (latestError && latestError.code !== 'PGRST116') {
      console.error('[API][FINANCE-CLOSURES][DELETE] Error obteniendo último cierre:', latestError.message)
      return NextResponse.json({ success: false, error: latestError.message }, { status: 500 })
    }

    const normalizedLatestRows = Array.isArray(latestRows)
      ? (latestRows as RawClosureRow[])
          .map(item => normalizeRow(item))
          .filter((row): row is ClosureRow => Boolean(row))
      : []

    const latest = normalizedLatestRows[0]
    const previous = normalizedLatestRows[1] ?? null

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

    if (previous) {
      const { error: reopenError } = await supabase
        .from(TABLE_NAME)
        .update({
          period_income: null,
          period_costs: null,
          period_net: null,
          closing_capital: null,
          period_end_date: null,
        })
        .eq('id', previous.id)

      if (reopenError) {
        console.error('[API][FINANCE-CLOSURES][DELETE] Error reabriendo período anterior:', reopenError.message)
        return NextResponse.json({ success: false, error: reopenError.message }, { status: 500 })
      }
    }

  return NextResponse.json({ success: true, deleted: latest })
  } catch (err) {
    console.error('[API][FINANCE-CLOSURES][DELETE] Unexpected error:', err)
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
