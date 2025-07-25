import { NextRequest, NextResponse } from 'next/server';
import { uploadImageWithMetadata } from '@/lib/image-metadata';
import { uploadProductCoverImage } from '@/lib/r2-storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('🚀 [API] /api/upload/product-cover called');
    console.log('📁 [API] File received:', file.name, file.size, 'bytes');

    const result = await uploadImageWithMetadata(
      file,
      (f) => uploadProductCoverImage(f),
      'product-cover',
      {
        type: 'cover',
        aspect_ratio: '3:5',
      }
    );

    console.log('📤 [API] Upload result:', result);

    if (!result.success) {
      console.error('❌ [API] Upload failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to upload image' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      metadataId: result.metadataId
    });
  } catch (error) {
    console.error('❌ [API] Error in product-cover upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
