import { NextResponse } from 'next/server'

export async function PATCH() {
  return NextResponse.json({ success: true, updated: [], count: 0 })
}
