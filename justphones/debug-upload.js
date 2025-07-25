// 🔍 Script de debugging para simular subida de imagen como lo hace la app
require('dotenv').config({ path: '.env.local' });

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

console.log('🧪 Simulando subida de imagen exactamente como la app...\n');

// Configurar clientes
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

// Función para generar nombre único (igual que en r2-storage.ts)
function generateUniqueFileName(originalName) {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const extension = cleanName.substring(cleanName.lastIndexOf('.'));
  const nameWithoutExt = cleanName.substring(0, cleanName.lastIndexOf('.'));
  
  return `${timestamp}_${randomSuffix}_${nameWithoutExt}${extension}`;
}

// Función para construir URL pública (igual que en r2-storage.ts)
function buildPublicUrl(bucket, path) {
  if (bucket === 'carousel-images') {
    const carouselUrl = process.env.R2_CAROUSEL_PUBLIC_URL || 'https://pub-8a88032e9585477594ec585cb7d48eef.r2.dev';
    return `${carouselUrl}/${path}`;
  }
  
  const accountId = process.env.R2_ACCOUNT_ID || 'ecf5a330cc03f3e606d227a0ec1822e1';
  return `https://pub-${accountId}.r2.dev/${path}`;
}

async function simulateUpload() {
  try {
    console.log('📋 Paso 1: Creando archivo de prueba...');
    
    // Crear un archivo de prueba
    const testContent = `Test image upload - ${new Date().toISOString()}`;
    const testFile = {
      name: 'test-carousel-image.jpg',
      size: Buffer.byteLength(testContent),
      type: 'image/jpeg'
    };
    
    console.log(`   Archivo: ${testFile.name} (${testFile.size} bytes)\n`);
    
    console.log('📋 Paso 2: Subiendo a R2...');
    
    // Simular subida a R2 (igual que uploadCarouselImage)
    const fileName = generateUniqueFileName(testFile.name);
    const fullPath = `covers/${fileName}`;  // R2_PATHS.CAROUSEL.PUBLIC = 'covers'
    const bucket = 'carousel-images';
    
    console.log(`   Bucket: ${bucket}`);
    console.log(`   Path: ${fullPath}`);
    
    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: fullPath,
      Body: Buffer.from(testContent),
      ContentType: testFile.type,
      Metadata: {
        'original-name': testFile.name,
        'upload-timestamp': new Date().toISOString(),
        'file-size': testFile.size.toString(),
        'category': 'carousel',
        'type': 'banner-image',
      },
    });

    await r2Client.send(putCommand);
    
    const publicUrl = buildPublicUrl(bucket, fullPath);
    console.log(`   ✅ Subido exitosamente!`);
    console.log(`   URL: ${publicUrl}\n`);
    
    console.log('📋 Paso 3: Guardando metadata en Supabase...');
    
    const imageRecord = {
      url: publicUrl,
      original_name: testFile.name,
      file_size: testFile.size,
      mime_type: testFile.type,
      bucket: bucket,
      storage_path: fullPath,
      category: 'carousel',
      metadata: {
        type: 'banner',
        dimensions: '1200x400',
      },
      uploaded_at: new Date().toISOString(),
    };
    
    console.log(`   Record:`, JSON.stringify(imageRecord, null, 2));
    
    const { data, error } = await supabase
      .from('uploaded_images')
      .insert([imageRecord])
      .select('id')
      .single();
    
    if (error) {
      console.log(`   ❌ Error guardando metadata:`, error.message);
      console.log(`   Code:`, error.code);
      console.log(`   Details:`, error.details);
      
      if (error.message.includes('row-level security')) {
        console.log('\n🔧 PROBLEMA: Row Level Security bloqueando inserción');
        console.log('   Necesitas ejecutar EJECUTAR_EN_SUPABASE.sql para las políticas RLS');
      }
    } else {
      console.log(`   ✅ Metadata guardada exitosamente!`);
      console.log(`   ID: ${data.id}\n`);
      
      console.log('🎉 ÉXITO COMPLETO:');
      console.log('1. ✅ Archivo subido a R2');
      console.log('2. ✅ Metadata guardada en Supabase');
      console.log('3. ✅ URL pública generada');
      console.log('\n🚀 El proceso debería funcionar igual en tu app!');
    }
    
  } catch (error) {
    console.error('❌ Error en simulación:', error.message);
    console.log('\n🔧 Verifica la configuración en .env.local');
  }
}

simulateUpload();
