import { NextResponse } from 'next/server';

const MOCK_CAROUSEL_URL = 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=1200&q=80';

export async function POST() {
  return NextResponse.json({ success: true, url: MOCK_CAROUSEL_URL, metadataId: `meta-${Date.now()}` });
}
