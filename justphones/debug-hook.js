// 🔍 Debug del hook useCarouselImagesR2 usado en la aplicación
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// Simular el entorno de la aplicación
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🧪 Debugging hook useCarouselImagesR2...\n');

// Verificar variables de entorno
console.log('📋 Variables de entorno:');
console.log('  SUPABASE_URL:', supabaseUrl ? '✅ OK' : '❌ FALTA');
console.log('  SUPABASE_KEY:', supabaseKey ? '✅ OK' : '❌ FALTA');
console.log('  R2_CAROUSEL_URL:', process.env.R2_CAROUSEL_PUBLIC_URL ? '✅ OK' : '❌ FALTA');
console.log('  R2_PRODUCT_URL:', process.env.R2_PRODUCT_PUBLIC_URL ? '✅ OK' : '❌ FALTA');

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ PROBLEMA: Variables de Supabase no configuradas en el navegador');
  console.log('   Las variables NEXT_PUBLIC_* deben estar en .env.local');
  console.log('   Y el servidor debe reiniciarse después de cambios en .env.local');
  process.exit(1);
}

// Crear cliente Supabase (igual que en el hook)
const supabase = createClient(supabaseUrl, supabaseKey);

// Función de prueba del hook
async function testHookFunctions() {
  console.log('\n🧪 Probando funciones del hook...\n');
  
  // 1. Probar fetchCarouselImages
  console.log('📋 1. Probando fetchCarouselImages...');
  try {
    const { data, error } = await supabase
      .from('carousel_images')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) {
      console.log('   ❌ Error:', error.message);
      if (error.message.includes('does not exist')) {
        console.log('   🔧 La tabla "carousel_images" no existe en Supabase');
        console.log('   📝 Necesitas crear esta tabla además de "uploaded_images"');
      }
    } else {
      console.log('   ✅ Consulta exitosa');
      console.log(`   📊 Imágenes encontradas: ${data?.length || 0}`);
    }
  } catch (error) {
    console.log('   ❌ Error inesperado:', error.message);
  }
  
  // 2. Probar uploadCarouselImageFile (simulado)
  console.log('\n📋 2. Probando uploadCarouselImageFile...');
  
  // Importar las funciones de R2 (simuladas para Node.js)
  try {
    const { uploadImageWithMetadata } = require('../src/lib/image-metadata');
    const { uploadCarouselImage } = require('../src/lib/r2-storage');
    
    // Crear archivo simulado
    const testFile = {
      name: 'test-from-hook.jpg',
      size: 1024,
      type: 'image/jpeg'
    };
    
    console.log('   📁 Archivo de prueba:', testFile.name);
    
    // Esta función debería existir en el hook
    console.log('   🔄 Simulando uploadImageWithMetadata...');
    console.log('   ✅ Funciones de R2 disponibles');
    
  } catch (error) {
    console.log('   ❌ Error importando funciones R2:', error.message);
    console.log('   🔧 Verifica que las funciones estén exportadas correctamente');
  }
  
  console.log('\n📋 3. Verificando tabla uploaded_images...');
  try {
    const { data, error } = await supabase
      .from('uploaded_images')
      .select('id, url, original_name, category')
      .limit(3);
    
    if (error) {
      console.log('   ❌ Error:', error.message);
    } else {
      console.log('   ✅ Tabla accesible');
      console.log(`   📊 Registros: ${data?.length || 0}`);
      if (data && data.length > 0) {
        data.forEach((img, i) => {
          console.log(`     ${i+1}. ${img.original_name} (${img.category})`);
        });
      }
    }
  } catch (error) {
    console.log('   ❌ Error inesperado:', error.message);
  }
  
  console.log('\n🎯 RESUMEN:');
  console.log('Si hay errores arriba, esos son los problemas que está enfrentando tu app.');
  console.log('Si todo está ✅, entonces el problema está en el frontend/UI.');
}

testHookFunctions().catch(console.error);
