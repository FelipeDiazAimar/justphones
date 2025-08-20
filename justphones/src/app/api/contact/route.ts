import { NextResponse } from 'next/server'

// This API route is deprecated. The contact form now uses EmailJS on the client.
export async function POST() {
  return NextResponse.json(
    { error: 'Contact API disabled. The site uses EmailJS on the client.' },
    { status: 410 }
  )
}
