import { NextResponse } from 'next/server';

const MOCK_COVER_URL = 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80';

export async function POST() {
  return NextResponse.json({ success: true, url: MOCK_COVER_URL, metadataId: `meta-${Date.now()}` });
}
