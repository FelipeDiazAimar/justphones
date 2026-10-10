/**
 * JustPhones — capa de demostración (portfolio).
 *
 * Archivo autocontenido y client-safe: no importa Supabase, ni Node,
 * ni ningún módulo interno. Sirve como fuente de datos de respaldo
 * cuando `isDemoMode()` es true (por defecto) para que otros agentes
 * puedan renderizar la tienda sin credenciales reales.
 *
 * Formas reales de referencia (solo lectura, no importar aquí):
 * - Producto real: `src/lib/products.ts` → `Product`
 *   { id, name (slug), cost, price, discount?, coverImage, coverImages?,
 *     colors: { name, hex, image, stock }[], category: 'case'|'accessory'|'auriculares',
 *     model, featured?, is_new?, subCategory? }
 * - FAQ real: `src/lib/faq.ts` → `FAQ` { id, question, answer }
 * - Supabase browser: `src/lib/supabase/client.ts` → `createClient()`
 *   (usa NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY con placeholder)
 * - Cierre financiero: `supabase/finance_closures.sql` → tabla `finance_closures`
 *   (month YYYY-MM, start_date, opening_capital, closing_capital?,
 *    period_income?, period_costs?, period_net?, period_end_date?)
 * - Checkout WhatsApp real: `src/components/cart-sheet.tsx`
 *   teléfono `5493564338599`, mensaje "¡Hola! Quisiera hacer el siguiente
 *   pedido:…" + `toLocaleString('es-AR')`, URL `https://wa.me/<tel>?text=…`
 */

/** Teléfono por defecto para el checkout demo (mismo que el checkout real). */
export const DEMO_WHATSAPP_PHONE = '5493564338599';

/**
 * true salvo que `NEXT_PUBLIC_DEMO_MODE === 'false'`.
 * Client-safe: no accede a `process.env` si `process` no existe (SSR/edge/browser).
 */
export function isDemoMode(): boolean {
  try {
    const env = (
      globalThis as { process?: { env?: Record<string, string | undefined> } }
    ).process?.env;
    if (!env) return true;
    return env.NEXT_PUBLIC_DEMO_MODE !== 'false';
  } catch {
    return true;
  }
}

export type DemoCategorySlug =
  | 'fundas'
  | 'auriculares'
  | 'cargadores'
  | 'vidrios-templados'
  | 'soportes'
  | 'parlantes';

export interface DemoProduct {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  precio: number;
  precioOferta?: number;
  categoria: DemoCategorySlug;
  modelos: string[];
  colores: string[];
  stock: number;
  imagenes: string[];
  destacado: boolean;
  rating: number;
}

export interface DemoFaq {
  id: string;
  pregunta: string;
  respuesta: string;
}

export interface DemoCategory {
  slug: DemoCategorySlug;
  nombre: string;
  descripcion: string;
}

/** Ítem mínimo que `whatsappCheckoutUrl` sabe serializar. */
export interface DemoCheckoutItem {
  nombre: string;
  cantidad: number;
  precio: number;
  modelo?: string;
  color?: string;
}

export const DEMO_CATEGORIES: DemoCategory[] = [
  {
    slug: 'fundas',
    nombre: 'Fundas',
    descripcion: 'Fundas MagSafe, silicona, cuero y antigolpes para iPhone y Samsung.',
  },
  {
    slug: 'auriculares',
    nombre: 'Auriculares',
    descripcion: 'Auriculares TWS y deportivos Bluetooth con estuche de carga.',
  },
  {
    slug: 'cargadores',
    nombre: 'Cargadores y cables',
    descripcion: 'Carga inalámbrica MagSafe, carga rápida USB-C, cables y power banks.',
  },
  {
    slug: 'vidrios-templados',
    nombre: 'Vidrios templados',
    descripcion: 'Vidrios templados 9H con kit de instalación para iPhone y Samsung.',
  },
  {
    slug: 'soportes',
    nombre: 'Soportes',
    descripcion: 'Soportes magnéticos para auto, escritorio y anillos MagSafe.',
  },
  {
    slug: 'parlantes',
    nombre: 'Parlantes',
    descripcion: 'Parlantes Bluetooth portátiles con sonido estéreo y batería de larga duración.',
  },
];

export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: 'demo-001',
    slug: 'funda-magsafe-transparente-iphone',
    nombre: 'Funda MagSafe Transparente iPhone',
    descripcion:
      'Funda transparente con imanes MagSafe, bordes reforzados antigolpes y botones metálicos. Compatible con carga inalámbrica.',
    precio: 8900,
    categoria: 'fundas',
    modelos: ['iPhone 16', 'iPhone 16 Pro', 'iPhone 15', 'iPhone 15 Pro', 'iPhone 14'],
    colores: ['Transparente', 'Negro Humo'],
    stock: 20,
    imagenes: ['https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80'],
    destacado: true,
    rating: 4.8,
  },
  {
    id: 'demo-002',
    slug: 'funda-silicona-premium-iphone',
    nombre: 'Funda de Silicona Premium iPhone',
    descripcion:
      'Silicona suave al tacto con interior de microfibra. Protección contra rayones y caídas, acabado mate anti-huellas.',
    precio: 7900,
    precioOferta: 6900,
    categoria: 'fundas',
    modelos: ['iPhone 16', 'iPhone 15', 'iPhone 14', 'iPhone 13'],
    colores: ['Negro Mate', 'Azul Medianoche', 'Verde Oliva'],
    stock: 25,
    imagenes: ['https://images.unsplash.com/photo-1556656793-08538906a9f8?w=600&q=80'],
    destacado: false,
    rating: 4.7,
  },
  {
    id: 'demo-003',
    slug: 'funda-cuero-premium-marron',
    nombre: 'Funda de Cuero Premium',
    descripcion:
      'Cuero genuino con costuras reforzadas y patina natural con el uso. Elegancia clásica con protección militar sutil.',
    precio: 14900,
    categoria: 'fundas',
    modelos: ['iPhone 16 Pro', 'iPhone 15 Pro', 'iPhone 14 Pro'],
    colores: ['Marrón Castaño', 'Negro'],
    stock: 12,
    imagenes: ['https://images.unsplash.com/photo-1473188588951-666fce8e7c68?w=600&q=80'],
    destacado: true,
    rating: 4.9,
  },
  {
    id: 'demo-004',
    slug: 'funda-antigolpes-samsung-galaxy',
    nombre: 'Funda Antigolpes Samsung Galaxy',
    descripcion:
      'Doble capa con esquinas reforzadas y certificación militar contra caídas. Grip texturado para uso diario.',
    precio: 7500,
    categoria: 'fundas',
    modelos: ['Samsung Galaxy S24', 'Samsung Galaxy S23', 'Samsung Galaxy A54'],
    colores: ['Negro', 'Azul Marino'],
    stock: 18,
    imagenes: ['https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&q=80'],
    destacado: false,
    rating: 4.6,
  },
  {
    id: 'demo-005',
    slug: 'auriculares-tws-pro',
    nombre: 'Auriculares TWS Pro con estuche',
    descripcion:
      'Auriculares inalámbricos con cancelación de ruido, 36 h de batería con estuche y micrófonos duales para llamadas claras.',
    precio: 32900,
    precioOferta: 28900,
    categoria: 'auriculares',
    modelos: ['Universal'],
    colores: ['Blanco', 'Negro'],
    stock: 15,
    imagenes: ['https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=600&q=80'],
    destacado: true,
    rating: 4.8,
  },
  {
    id: 'demo-006',
    slug: 'auriculares-deportivos-bluetooth',
    nombre: 'Auriculares Deportivos Bluetooth',
    descripcion:
      'Diseño ergonómico con ganchos para deporte, resistencia al sudor IPX5 y hasta 12 h de reproducción continua.',
    precio: 18900,
    categoria: 'auriculares',
    modelos: ['Universal'],
    colores: ['Negro', 'Rojo'],
    stock: 16,
    imagenes: ['https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=80'],
    destacado: false,
    rating: 4.5,
  },
  {
    id: 'demo-007',
    slug: 'cargador-inalambrico-magsafe-15w',
    nombre: 'Cargador Inalámbrico MagSafe 15W',
    descripcion:
      'Carga inalámbrica rápida de 15W con alineación magnética perfecta. Incluye cable USB-C de 1 m.',
    precio: 19900,
    categoria: 'cargadores',
    modelos: ['iPhone 16', 'iPhone 15', 'iPhone 14', 'iPhone 13'],
    colores: ['Blanco'],
    stock: 14,
    imagenes: ['https://images.unsplash.com/photo-1615526675159-e248c3021d3f?w=600&q=80'],
    destacado: true,
    rating: 4.7,
  },
  {
    id: 'demo-008',
    slug: 'cargador-rapido-25w-usb-c',
    nombre: 'Cargador Rápido 25W USB-C',
    descripcion:
      'Cargador de pared de 25W con puerto USB-C y protección contra sobrecarga. Carga el 50% en 30 minutos.',
    precio: 12900,
    precioOferta: 10900,
    categoria: 'cargadores',
    modelos: ['Universal', 'Samsung Galaxy S24', 'iPhone 16'],
    colores: ['Blanco', 'Negro'],
    stock: 22,
    imagenes: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80'],
    destacado: false,
    rating: 4.6,
  },
  {
    id: 'demo-009',
    slug: 'cable-trenzado-usb-c-2m',
    nombre: 'Cable Trenzado USB-C 2 m',
    descripcion:
      'Cable trenzado de nylon extra resistente de 2 metros, carga rápida y transmisión de datos. Compatible USB-C universal.',
    precio: 7900,
    categoria: 'cargadores',
    modelos: ['Universal'],
    colores: ['Negro', 'Plata'],
    stock: 30,
    imagenes: ['https://images.unsplash.com/photo-1550004254-fea373b47897?w=600&q=80'],
    destacado: false,
    rating: 4.7,
  },
  {
    id: 'demo-010',
    slug: 'vidrio-templado-9h-iphone',
    nombre: 'Vidrio Templado 9H iPhone',
    descripcion:
      'Pack protector de vidrio templado 9H con bordes redondeados, anti-huellas y kit de instalación fácil. Pack x2.',
    precio: 3900,
    categoria: 'vidrios-templados',
    modelos: ['iPhone 16', 'iPhone 15', 'iPhone 14', 'iPhone 13'],
    colores: ['Transparente'],
    stock: 40,
    imagenes: ['https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&q=80'],
    destacado: false,
    rating: 4.8,
  },
  {
    id: 'demo-011',
    slug: 'vidrio-templado-9h-samsung',
    nombre: 'Vidrio Templado 9H Samsung',
    descripcion:
      'Vidrio templado 9H de alta transparencia para Samsung Galaxy, con marco guía para colocación perfecta. Pack x2.',
    precio: 3900,
    precioOferta: 3200,
    categoria: 'vidrios-templados',
    modelos: ['Samsung Galaxy S24', 'Samsung Galaxy S23', 'Samsung Galaxy A54'],
    colores: ['Transparente'],
    stock: 35,
    imagenes: ['https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&q=80'],
    destacado: false,
    rating: 4.7,
  },
  {
    id: 'demo-012',
    slug: 'funda-silicona-samsung-galaxy',
    nombre: 'Funda de Silicona Samsung Galaxy',
    descripcion:
      'Silicona líquida premium para Samsung Galaxy, tacto suave y limpieza fácil. Protección completa de cámara y bordes.',
    precio: 6900,
    categoria: 'fundas',
    modelos: ['Samsung Galaxy S24', 'Samsung Galaxy S23', 'Samsung Galaxy A54'],
    colores: ['Negro Mate', 'Lila', 'Verde Menta'],
    stock: 24,
    imagenes: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80'],
    destacado: false,
    rating: 4.5,
  },
  {
    id: 'demo-013',
    slug: 'funda-billetera-samsung-s24',
    nombre: 'Funda Billetera Samsung S24',
    descripcion:
      'Funda tipo billetera con tarjetero para 3 tarjetas y cierre magnético. Interior suave que protege la pantalla.',
    precio: 12900,
    categoria: 'fundas',
    modelos: ['Samsung Galaxy S24', 'Samsung Galaxy S23'],
    colores: ['Marrón Castaño', 'Negro'],
    stock: 16,
    imagenes: [
      'https://images.unsplash.com/photo-1473188588951-666fce8e7c68?w=600&q=80',
      'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80',
    ],
    destacado: false,
    rating: 4.6,
  },
  {
    id: 'demo-014',
    slug: 'funda-deportiva-antigolpes-iphone-16',
    nombre: 'Funda Deportiva Antigolpes iPhone 16',
    descripcion:
      'Funda deportiva con agarre antideslizante y esquinas reforzadas. Ideal para running y entrenamiento diario.',
    precio: 9900,
    precioOferta: 8400,
    categoria: 'fundas',
    modelos: ['iPhone 16', 'iPhone 16 Pro', 'iPhone 15'],
    colores: ['Negro', 'Azul Marino'],
    stock: 20,
    imagenes: [
      'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&q=80',
      'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80',
      'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80',
    ],
    destacado: true,
    rating: 4.7,
  },
  {
    id: 'demo-015',
    slug: 'funda-silicona-iphone-15-mate',
    nombre: 'Funda Silicona iPhone 15 Mate',
    descripcion:
      'Silicona mate anti-huellas para iPhone 15 con interior de microfibra. Liviana, flexible y de limpieza fácil.',
    precio: 7900,
    categoria: 'fundas',
    modelos: ['iPhone 15', 'iPhone 15 Pro', 'iPhone 14'],
    colores: ['Negro Mate', 'Azul Medianoche', 'Lila'],
    stock: 28,
    imagenes: [
      'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=600&q=80',
      'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80',
    ],
    destacado: false,
    rating: 4.6,
  },
  {
    id: 'demo-016',
    slug: 'funda-cuero-envejecido-samsung-a54',
    nombre: 'Funda Cuero Samsung A54',
    descripcion:
      'Cuero con acabado envejecido para Galaxy A54, elegante y resistente al desgaste. Bordes elevados para cámara.',
    precio: 13900,
    categoria: 'fundas',
    modelos: ['Samsung Galaxy A54', 'Samsung Galaxy S23'],
    colores: ['Marrón Castaño', 'Negro'],
    stock: 10,
    imagenes: [
      'https://images.unsplash.com/photo-1473188588951-666fce8e7c68?w=600&q=80',
      'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&q=80',
    ],
    destacado: false,
    rating: 4.8,
  },
  {
    id: 'demo-017',
    slug: 'auriculares-tws-lite-enc',
    nombre: 'Auriculares TWS Lite ENC',
    descripcion:
      'TWS con cancelación de ruido en llamadas, modo baja latencia para juegos y estuche compacto de 24 h totales.',
    precio: 24900,
    categoria: 'auriculares',
    modelos: ['Universal'],
    colores: ['Blanco', 'Negro'],
    stock: 18,
    imagenes: [
      'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=600&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=80',
    ],
    destacado: false,
    rating: 4.6,
  },
  {
    id: 'demo-018',
    slug: 'auriculares-tws-elite-anc',
    nombre: 'Auriculares TWS Elite ANC',
    descripcion:
      'TWS insignia con cancelación activa de ruido, drivers de 11 mm y 40 h de batería con carga inalámbrica del estuche.',
    precio: 39900,
    precioOferta: 34900,
    categoria: 'auriculares',
    modelos: ['Universal'],
    colores: ['Blanco', 'Negro'],
    stock: 12,
    imagenes: [
      'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=600&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=80',
    ],
    destacado: true,
    rating: 4.9,
  },
  {
    id: 'demo-019',
    slug: 'auriculares-deportivos-gancho-pro',
    nombre: 'Auriculares Deportivos Gancho Pro',
    descripcion:
      'Auriculares con ganchos ajustables que no se caen, IPX6 resistente al sudor y graves potentes para entrenar.',
    precio: 21900,
    categoria: 'auriculares',
    modelos: ['Universal'],
    colores: ['Negro', 'Rojo'],
    stock: 14,
    imagenes: [
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=80',
      'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=600&q=80',
    ],
    destacado: false,
    rating: 4.5,
  },
  {
    id: 'demo-020',
    slug: 'auriculares-deportivos-tws-sport',
    nombre: 'Auriculares Deportivos TWS Sport',
    descripcion:
      'TWS deportivos con aletas de sujeción, modo ambiente para correr seguro y hasta 10 h por carga.',
    precio: 23900,
    precioOferta: 19900,
    categoria: 'auriculares',
    modelos: ['Universal'],
    colores: ['Negro', 'Blanco'],
    stock: 15,
    imagenes: [
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=80',
      'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=600&q=80',
    ],
    destacado: false,
    rating: 4.7,
  },
  {
    id: 'demo-021',
    slug: 'auriculares-over-ear-bluetooth-max',
    nombre: 'Auriculares Over-Ear Bluetooth Max',
    descripcion:
      'Over-ear con almohadillas memory foam, 50 h de batería y sonido envolvente. Plegables para llevar en mochila.',
    precio: 45900,
    categoria: 'auriculares',
    modelos: ['Universal'],
    colores: ['Negro', 'Plata'],
    stock: 9,
    imagenes: [
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=80',
      'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=600&q=80',
    ],
    destacado: true,
    rating: 4.8,
  },
  {
    id: 'demo-022',
    slug: 'cargador-pared-65w-gan-dual',
    nombre: 'Cargador Pared 65W GaN Dual',
    descripcion:
      'Cargador GaN de 65W con doble puerto USB-C, carga notebooks y celulares a máxima velocidad con protección térmica.',
    precio: 25900,
    categoria: 'cargadores',
    modelos: ['Universal', 'iPhone 16', 'Samsung Galaxy S24'],
    colores: ['Blanco', 'Negro'],
    stock: 16,
    imagenes: [
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80',
      'https://images.unsplash.com/photo-1615526675159-e248c3021d3f?w=600&q=80',
    ],
    destacado: true,
    rating: 4.8,
  },
  {
    id: 'demo-023',
    slug: 'base-inalambrica-3-en-1-magsafe',
    nombre: 'Base Inalámbrica 3 en 1 MagSafe',
    descripcion:
      'Estación 3 en 1 para iPhone, Apple Watch y auriculares. Alineación magnética y base antideslizante de aluminio.',
    precio: 32900,
    precioOferta: 28900,
    categoria: 'cargadores',
    modelos: ['iPhone 16', 'iPhone 15', 'iPhone 14'],
    colores: ['Blanco', 'Negro'],
    stock: 11,
    imagenes: [
      'https://images.unsplash.com/photo-1615526675159-e248c3021d3f?w=600&q=80',
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80',
    ],
    destacado: false,
    rating: 4.7,
  },
  {
    id: 'demo-024',
    slug: 'cable-usb-c-100w-trenzado-15m',
    nombre: 'Cable USB-C 100W Trenzado 1.5 m',
    descripcion:
      'Cable trenzado de 100W con chip inteligente, 1.5 m de largo y conectores reforzados. Carga y datos de alta velocidad.',
    precio: 8900,
    categoria: 'cargadores',
    modelos: ['Universal'],
    colores: ['Negro', 'Plata'],
    stock: 32,
    imagenes: [
      'https://images.unsplash.com/photo-1550004254-fea373b47897?w=600&q=80',
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80',
    ],
    destacado: false,
    rating: 4.7,
  },
  {
    id: 'demo-025',
    slug: 'cable-lightning-trenzado-1m',
    nombre: 'Cable Lightning Trenzado 1 m',
    descripcion:
      'Cable Lightning certificado de 1 m con funda trenzada anti-enredos. Ideal para iPhone 13 y 14.',
    precio: 7900,
    categoria: 'cargadores',
    modelos: ['iPhone 14', 'iPhone 13'],
    colores: ['Blanco', 'Negro'],
    stock: 30,
    imagenes: [
      'https://images.unsplash.com/photo-1550004254-fea373b47897?w=600&q=80',
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80',
    ],
    destacado: false,
    rating: 4.6,
  },
  {
    id: 'demo-026',
    slug: 'powerbank-10000mah-carga-rapida',
    nombre: 'Power Bank 10000 mAh Carga Rápida',
    descripcion:
      'Batería portátil de 10000 mAh con carga rápida 22.5W, display LED y doble salida USB + USB-C.',
    precio: 28900,
    precioOferta: 24900,
    categoria: 'cargadores',
    modelos: ['Universal'],
    colores: ['Negro', 'Blanco'],
    stock: 17,
    imagenes: [
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80',
      'https://images.unsplash.com/photo-1550004254-fea373b47897?w=600&q=80',
      'https://images.unsplash.com/photo-1615526675159-e248c3021d3f?w=600&q=80',
    ],
    destacado: false,
    rating: 4.7,
  },
  {
    id: 'demo-027',
    slug: 'powerbank-20000mah-225w-led',
    nombre: 'Power Bank 20000 mAh 22.5W LED',
    descripcion:
      'Batería de 20000 mAh para varios días, carga rápida bidireccional y linterna integrada. Para viajes y camping.',
    precio: 35900,
    categoria: 'cargadores',
    modelos: ['Universal'],
    colores: ['Negro'],
    stock: 13,
    imagenes: [
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80',
      'https://images.unsplash.com/photo-1615526675159-e248c3021d3f?w=600&q=80',
      'https://images.unsplash.com/photo-1550004254-fea373b47897?w=600&q=80',
    ],
    destacado: true,
    rating: 4.8,
  },
  {
    id: 'demo-028',
    slug: 'vidrio-privacidad-iphone-15-16',
    nombre: 'Vidrio Privacidad iPhone 15/16',
    descripcion:
      'Vidrio templado con filtro de privacidad lateral 9H, anti-espía y anti-huellas. Pack x2 con kit de instalación.',
    precio: 4900,
    categoria: 'vidrios-templados',
    modelos: ['iPhone 16', 'iPhone 15', 'iPhone 14'],
    colores: ['Transparente'],
    stock: 38,
    imagenes: [
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&q=80',
      'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80',
    ],
    destacado: false,
    rating: 4.6,
  },
  {
    id: 'demo-029',
    slug: 'vidrio-ceramico-irrompible-samsung',
    nombre: 'Vidrio Cerámico Samsung',
    descripcion:
      'Protector cerámico flexible irrompible para Samsung Galaxy, cobertura total curva y tacto suave. Pack x2.',
    precio: 5500,
    precioOferta: 4500,
    categoria: 'vidrios-templados',
    modelos: ['Samsung Galaxy S24', 'Samsung Galaxy S23', 'Samsung Galaxy A54'],
    colores: ['Transparente'],
    stock: 34,
    imagenes: [
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&q=80',
      'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&q=80',
    ],
    destacado: false,
    rating: 4.7,
  },
  {
    id: 'demo-030',
    slug: 'film-hidrogel-mate-universal',
    nombre: 'Film Hidrogel Mate Universal',
    descripcion:
      'Film de hidrogel mate anti-reflejo que se adapta a pantallas curvas. Autorreparable ante micro-rayones.',
    precio: 4500,
    categoria: 'vidrios-templados',
    modelos: ['Universal', 'iPhone 16', 'Samsung Galaxy S24'],
    colores: ['Transparente'],
    stock: 42,
    imagenes: [
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&q=80',
      'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=600&q=80',
    ],
    destacado: false,
    rating: 4.5,
  },
  {
    id: 'demo-031',
    slug: 'protector-lente-camara-iphone-samsung',
    nombre: 'Protector Lente Cámara',
    descripcion:
      'Anillos protectores de aluminio para lentes de cámara, antireflejo y anti-rayones. Instalación simple sin burbujas.',
    precio: 5900,
    categoria: 'vidrios-templados',
    modelos: ['iPhone 16', 'iPhone 15', 'Samsung Galaxy S24'],
    colores: ['Negro', 'Transparente'],
    stock: 36,
    imagenes: [
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&q=80',
      'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80',
    ],
    destacado: false,
    rating: 4.6,
  },
  {
    id: 'demo-032',
    slug: 'soporte-auto-rejilla-magnetico',
    nombre: 'Soporte Auto Rejilla Magnético',
    descripcion:
      'Soporte magnético para rejilla de auto con imanes N52 y rotación 360°. Compatible con MagSafe y fundas magnéticas.',
    precio: 12900,
    precioOferta: 10900,
    categoria: 'soportes',
    modelos: ['Universal', 'iPhone 16', 'Samsung Galaxy S24'],
    colores: ['Negro'],
    stock: 19,
    imagenes: [
      'https://images.unsplash.com/photo-1615526675159-e248c3021d3f?w=600&q=80',
      'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&q=80',
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80',
    ],
    destacado: true,
    rating: 4.7,
  },
  {
    id: 'demo-033',
    slug: 'soporte-escritorio-aluminio-360',
    nombre: 'Soporte Escritorio Aluminio 360°',
    descripcion:
      'Soporte de aluminio plegable para escritorio con giro 360° y altura regulable. Ideal para videollamadas y escritorio.',
    precio: 11900,
    categoria: 'soportes',
    modelos: ['Universal'],
    colores: ['Plata', 'Negro'],
    stock: 15,
    imagenes: [
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80',
      'https://images.unsplash.com/photo-1615526675159-e248c3021d3f?w=600&q=80',
    ],
    destacado: false,
    rating: 4.6,
  },
  {
    id: 'demo-034',
    slug: 'anillo-magsafe-soporte-stand',
    nombre: 'Anillo MagSafe Soporte Stand',
    descripcion:
      'Anillo magnético MagSafe con función de stand y agarre para dedos. Giro ajustable y adhesión reforzada.',
    precio: 6900,
    categoria: 'soportes',
    modelos: ['iPhone 16', 'iPhone 15', 'iPhone 14'],
    colores: ['Negro', 'Plata'],
    stock: 26,
    imagenes: [
      'https://images.unsplash.com/photo-1615526675159-e248c3021d3f?w=600&q=80',
      'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80',
    ],
    destacado: false,
    rating: 4.5,
  },
  {
    id: 'demo-035',
    slug: 'parlante-bluetooth-portatil-10w',
    nombre: 'Parlante Bluetooth Portátil 10W',
    descripcion:
      'Parlante compacto de 10W con graves profundos, IPX6 resistente al agua y 12 h de batería. Correa para llevar.',
    precio: 35900,
    precioOferta: 29900,
    categoria: 'parlantes',
    modelos: ['Universal'],
    colores: ['Negro', 'Azul Marino'],
    stock: 12,
    imagenes: [
      'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=600&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=80',
    ],
    destacado: true,
    rating: 4.8,
  },
  {
    id: 'demo-036',
    slug: 'parlante-bluetooth-party-30w-tws',
    nombre: 'Parlante Bluetooth Party 30W TWS',
    descripcion:
      'Parlante fiesta de 30W con luces LED, emparejamiento TWS doble y 18 h de autonomía. Entrada micrófono incluida.',
    precio: 54900,
    categoria: 'parlantes',
    modelos: ['Universal'],
    colores: ['Negro'],
    stock: 8,
    imagenes: [
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=80',
      'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=600&q=80',
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80',
    ],
    destacado: false,
    rating: 4.9,
  },
];

export const DEMO_FAQS: DemoFaq[] = [
  {
    id: 'demo-faq-001',
    pregunta: '¿Cuánto tarda en llegar mi pedido?',
    respuesta:
      'En la ciudad entregamos el mismo día o al día siguiente. En la zona coordinamos entrega en 24-48 h y al resto del país enviamos por correo en 3 a 7 días hábiles.',
  },
  {
    id: 'demo-faq-002',
    pregunta: '¿Las fundas son compatibles con mi modelo?',
    respuesta:
      'Cada producto indica sus modelos compatibles (iPhone 13 a 16 y Samsung Galaxy S/A). Si tu modelo no aparece, escribinos por WhatsApp y lo conseguimos en pocos días.',
  },
  {
    id: 'demo-faq-003',
    pregunta: '¿Qué medios de pago aceptan?',
    respuesta:
      'Aceptamos efectivo, transferencia, débito y crédito en 3 cuotas sin interés. El pago en efectivo o transferencia tiene un 20% de descuento y el débito un 10% OFF.',
  },
  {
    id: 'demo-faq-004',
    pregunta: '¿Puedo cambiar o devolver un producto?',
    respuesta:
      'Sí, dentro de los 7 días de recibido, sin uso y en su empaque original. Por defecto de fábrica el cambio es sin costo coordinando por WhatsApp.',
  },
  {
    id: 'demo-faq-005',
    pregunta: '¿Tienen stock de todos los modelos?',
    respuesta:
      'Mantenemos stock permanente de los modelos más recientes. Para modelos anteriores consultanos por WhatsApp: actualizamos el stock cada semana.',
  },
  {
    id: 'demo-faq-006',
    pregunta: '¿Este sitio es una demo?',
    respuesta:
      'Sí. Este es un entorno de demostración para portfolio: los productos, precios y FAQs son de ejemplo y el pedido se finaliza por WhatsApp sin procesar pagos reales.',
  },
];

/** Formatea un monto a pesos argentinos, ej. 8900 → "$ 8.900". */
export function formatPriceARS(value: number): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '$ 0';
  return `$ ${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
}

/**
 * Arma la URL de checkout por WhatsApp con el mismo formato del checkout real:
 * "¡Hola! Quisiera hacer el siguiente pedido:…" + detalle + total en ARS.
 */
export function whatsappCheckoutUrl(
  items: DemoCheckoutItem[],
  telefono: string = DEMO_WHATSAPP_PHONE,
): string {
  const phone = telefono.replace(/\D/g, '') || DEMO_WHATSAPP_PHONE;

  if (!items.length) {
    const empty = '¡Hola! Quisiera hacer una consulta sobre los productos (demo).';
    return `https://wa.me/${phone}?text=${encodeURIComponent(empty)}`;
  }

  const detalle = items
    .map((item) => {
      const extras: string[] = [];
      if (item.modelo) extras.push(item.modelo);
      if (item.color) extras.push(`Color: ${item.color}`);
      const sufijo = extras.length ? ` (${extras.join(') - (')})` : '';
      const subtotal = item.precio * item.cantidad;
      return `- ${item.cantidad}x ${item.nombre}${sufijo} — ${formatPriceARS(subtotal)}`;
    })
    .join('\n');

  const total = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  const message =
    `¡Hola! Quisiera hacer el siguiente pedido:\n\n` +
    `${detalle}\n\n` +
    `Total: ${formatPriceARS(total)}\n\n` +
    `Gracias! (Pedido demo – sin cargo)`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
