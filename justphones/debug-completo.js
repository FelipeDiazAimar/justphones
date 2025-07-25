// 🚨 DEBUGGING COMPLETO EN TIEMPO REAL
require('dotenv').config({ path: '.env.local' });

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

console.log('🔍 DEBUGGING COMPLETO - Simulando subida desde la app...\n');

// Configurar exactamente igual que la app
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Funciones exactas del código real
function generateUniqueFileName(originalName) {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const extension = cleanName.substring(cleanName.lastIndexOf('.'));
  const nameWithoutExt = cleanName.substring(0, cleanName.lastIndexOf('.'));
  return `${timestamp}_${randomSuffix}_${nameWithoutExt}${extension}`;
}

function buildPublicUrl(bucket, path) {
  if (bucket === 'carousel-images') {
    const carouselUrl = process.env.R2_CAROUSEL_PUBLIC_URL || 'https://pub-8a88032e9585477594ec585cb7d48eef.r2.dev';
    return `${carouselUrl}/${path}`;
  }
  return `https://fallback.r2.dev/${path}`;
}

// PASO 1: uploadCarouselImage (R2 upload)
async function simulateUploadCarouselImage(fileName, fileContent, fileSize, mimeType) {
  console.log('📋 PASO 1: uploadCarouselImage...');
  
  try {
    const uniqueFileName = generateUniqueFileName(fileName);
    const fullPath = `covers/${uniqueFileName}`;
    const bucket = 'carousel-images';
    
    console.log(`   Generando nombre único: ${uniqueFileName}`);
    console.log(`   Path completo: ${fullPath}`);
    console.log(`   Bucket: ${bucket}`);
    
    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: fullPath,
      Body: Buffer.from(fileContent),
      ContentType: mimeType,
      Metadata: {
        'original-name': fileName,
        'upload-timestamp': new Date().toISOString(),
        'file-size': fileSize.toString(),
        'category': 'carousel',
        'type': 'banner-image',
      },
    });

    console.log('   Enviando a R2...');
    await r2Client.send(putCommand);
    
    const publicUrl = buildPublicUrl(bucket, fullPath);
    console.log(`   ✅ PASO 1 EXITOSO`);
    console.log(`   URL: ${publicUrl}\n`);
    
    return { success: true, url: publicUrl, path: fullPath };
  } catch (error) {
    console.log(`   ❌ PASO 1 FALLÓ: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

// PASO 2: saveImageMetadata (uploaded_images)
async function simulateSaveImageMetadata(url, originalName, fileSize, mimeType, bucket, storagePath, category) {
  console.log('📋 PASO 2: saveImageMetadata (uploaded_images)...');
  
  try {
    const imageRecord = {
      url,
      original_name: originalName,
      file_size: fileSize,
      mime_type: mimeType,
      bucket,
      storage_path: storagePath,
      category,
      metadata: { type: 'banner', dimensions: '1200x400' },
      uploaded_at: new Date().toISOString(),
    };

    console.log('   Insertando en uploaded_images...');
    const { data, error } = await supabase
      .from('uploaded_images')
      .insert([imageRecord])
      .select('id')
      .single();

    if (error) {
      console.log(`   ❌ PASO 2 FALLÓ: ${error.message}`);
      console.log(`   Code: ${error.code}\n`);
      return { success: false, error: error.message };
    } else {
      console.log(`   ✅ PASO 2 EXITOSO`);
      console.log(`   Metadata ID: ${data.id}\n`);
      return { success: true, id: data.id };
    }
  } catch (error) {
    console.log(`   ❌ PASO 2 ERROR: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

// PASO 3: addCarouselImage (carousel_images)
async function simulateAddCarouselImage(imageUrl, title = 'Test Image', description = 'Test Description') {
  console.log('📋 PASO 3: addCarouselImage (carousel_images)...');
  
  try {
    const carouselRecord = {
      image_url: imageUrl,
      title: title,
      description: description,
      sort_order: 1,
      is_active: true
    };

    console.log('   Insertando en carousel_images...');
    console.log(`   Record:`, JSON.stringify(carouselRecord, null, 2));
    
    const { data, error } = await supabase
      .from('carousel_images')
      .insert([carouselRecord])
      .select('id')
      .single();

    if (error) {
      console.log(`   ❌ PASO 3 FALLÓ: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      if (error.code === '42501') {
        console.log(`   🔒 PROBLEMA RLS: Políticas bloqueando inserción\n`);
      }
      return { success: false, error: error.message };
    } else {
      console.log(`   ✅ PASO 3 EXITOSO`);
      console.log(`   Carousel ID: ${data.id}\n`);
      return { success: true, id: data.id };
    }
  } catch (error) {
    console.log(`   ❌ PASO 3 ERROR: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

// SIMULACIÓN COMPLETA
async function fullSimulation() {
  console.log('🚀 INICIANDO SIMULACIÓN COMPLETA DE LA APP...\n');
  
  const fileName = 'debug-app-upload.jpg';
  const fileContent = `Real app upload test - ${new Date().toISOString()}`;
  const fileSize = Buffer.byteLength(fileContent);
  const mimeType = 'image/jpeg';
  
  console.log(`📁 Archivo: ${fileName} (${fileSize} bytes)\n`);
  
  // PASO 1: Subir a R2
  const step1 = await simulateUploadCarouselImage(fileName, fileContent, fileSize, mimeType);
  if (!step1.success) {
    console.log('🚨 PROCESO INTERRUMPIDO - PASO 1 falló');
    return;
  }
  
  // PASO 2: Guardar metadata
  const step2 = await simulateSaveImageMetadata(
    step1.url, fileName, fileSize, mimeType, 
    'carousel-images', step1.path, 'carousel'
  );
  
  if (!step2.success) {
    console.log('🚨 PROCESO INTERRUMPIDO - PASO 2 falló');
    console.log('   Imagen subida a R2 pero metadata falló');
    return;
  }
  
  // PASO 3: Añadir a carousel
  const step3 = await simulateAddCarouselImage(step1.url, 'Debug Upload', 'Test from debugging script');
  
  if (!step3.success) {
    console.log('🚨 PROCESO INTERRUMPIDO - PASO 3 falló');
    console.log('   Imagen en R2 ✅ + Metadata ✅ pero carousel_images falló ❌');
    return;
  }
  
  console.log('🎉 ¡SIMULACIÓN COMPLETA EXITOSA!');
  console.log('✅ Imagen subida a R2');
  console.log('✅ Metadata guardada');
  console.log('✅ Registro en carousel_images creado');
  console.log('\n🔍 Si esto funciona pero la app no, el problema está en el frontend UI');
}

fullSimulation().catch(console.error);
