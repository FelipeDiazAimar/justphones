import { NextRequest, NextResponse } from 'next/server';
import { uploadCarouselImage } from '@/lib/r2-storage';
import { uploadImageWithMetadata } from '@/lib/image-metadata';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [API] /api/upload/carousel called');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('📁 [API] File received:', file.name, file.size, 'bytes');

    // Subir usando R2
    const result = await uploadImageWithMetadata(
      file,
      uploadCarouselImage,
      'carousel',
      {
        type: 'banner',
        dimensions: '1200x400',
      }
    );

    console.log('📤 [API] Upload result:', result);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      metadataId: result.metadataId,
    });

  } catch (error) {
    console.error('❌ [API] Error in upload endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
