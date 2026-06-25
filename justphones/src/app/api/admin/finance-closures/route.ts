import { NextResponse } from 'next/server'
import { MOCK_FINANCE_CLOSURES } from '@/lib/mock-data'

export async function GET() {
  return NextResponse.json({ success: true, data: MOCK_FINANCE_CLOSURES })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const month = body.month ?? '2025-07'
  const lastClosure = MOCK_FINANCE_CLOSURES[MOCK_FINANCE_CLOSURES.length - 1]
  const openingCapital = lastClosure?.closing_capital ?? lastClosure?.opening_capital ?? 0

  const newClosure = {
    id: `fc-close-${Date.now()}`,
    month,
    start_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    opening_capital: openingCapital,
    closing_capital: null,
    period_income: null,
    period_costs: null,
    period_net: null,
    period_end_date: null,
  }

  return NextResponse.json({ success: true, data: newClosure, finalizedMonth: null })
}

export async function DELETE() {
  return NextResponse.json({ success: true, deleted: MOCK_FINANCE_CLOSURES[MOCK_FINANCE_CLOSURES.length - 1] })
}
