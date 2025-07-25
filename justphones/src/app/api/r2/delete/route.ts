import { NextRequest, NextResponse } from 'next/server';
import { deleteFromR2, R2_BUCKETS } from '@/lib/r2-storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bucket, path } = body;

    if (!path) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    if (!bucket) {
      return NextResponse.json(
        { error: 'Bucket name is required' },
        { status: 400 }
      );
    }

    console.log('🗑️ [API] Deleting file from R2:', { bucket, path });
    
    // Map bucket name to R2_BUCKETS constant
    let bucketName: keyof typeof R2_BUCKETS;
    if (bucket === 'carousel-images') {
      bucketName = 'CAROUSEL_IMAGES';
    } else if (bucket === 'product-images') {
      bucketName = 'PRODUCT_IMAGES';
    } else {
      return NextResponse.json(
        { error: `Unknown bucket: ${bucket}` },
        { status: 400 }
      );
    }
    
    const success = await deleteFromR2(R2_BUCKETS[bucketName], path);
    
    if (success) {
      console.log('✅ [API] File deleted successfully from R2');
      return NextResponse.json({ success: true });
    } else {
      console.error('❌ [API] Failed to delete file from R2');
      return NextResponse.json(
        { error: 'Failed to delete file' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ [API] Error in delete route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    console.log('🗑️ [API] Deleting file from R2:', filePath);
    
    // Default to carousel images bucket for legacy DELETE method
    const success = await deleteFromR2(R2_BUCKETS.CAROUSEL_IMAGES, filePath);
    
    if (success) {
      console.log('✅ [API] File deleted successfully from R2');
      return NextResponse.json({ success: true });
    } else {
      console.error('❌ [API] Failed to delete file from R2');
      return NextResponse.json(
        { error: 'Failed to delete file' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ [API] Error in delete route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
