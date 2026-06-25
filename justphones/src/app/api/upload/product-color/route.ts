import { NextResponse } from 'next/server';

const MOCK_COLOR_URL = 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&q=80';

export async function POST() {
  return NextResponse.json({ success: true, url: MOCK_COLOR_URL, metadataId: `meta-${Date.now()}` });
}
