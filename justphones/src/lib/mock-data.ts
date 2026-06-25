import type { Product } from './products';
import type { CustomerRequest } from './customer-requests';
import type { Sale } from './sales';
import type { FixedCost } from './fixed-costs';
import type { MonetaryIncome } from './monetary-income';
import type { SalaryWithdrawal } from './salary-withdrawals';
import type { StockHistory } from './stock-history';
import type { ProductHistory } from './product-history';
import type { CarouselImage } from './carousel';
import type { FAQ } from './faq';
import type { DiscountCode } from './discount-codes';

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    created_at: '2026-01-15T10:00:00Z',
    name: 'magsafe-transparente',
    cost: 2500,
    price: 8500,
    coverImage: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80',
    coverImages: [
      'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80',
      'https://images.unsplash.com/photo-1512499617640-c2f999098c64?w=600&q=80',
    ],
    colors: [
      { name: 'Transparente', hex: '#FFFFFF', image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80', stock: 12 },
      { name: 'Negro Humo', hex: '#1C1C1E', image: 'https://images.unsplash.com/photo-1512499617640-c2f999098c64?w=400&q=80', stock: 8 },
    ],
    category: 'case',
    model: 'iPhone 16',
    subCategory: 'magsafe',
    featured: true,
    is_new: true,
  },
  {
    id: 'prod-002',
    created_at: '2026-01-20T10:00:00Z',
    name: 'silicona-premium-negra',
    cost: 2000,
    price: 7500,
    discount: 10,
    coverImage: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=600&q=80',
    coverImages: [
      'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=600&q=80',
    ],
    colors: [
      { name: 'Negro Mate', hex: '#1C1C1E', image: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&q=80', stock: 15 },
      { name: 'Azul Medianoche', hex: '#1D3461', image: 'https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=400&q=80', stock: 10 },
      { name: 'Verde Oliva', hex: '#5C5F37', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80', stock: 6 },
    ],
    category: 'case',
    model: 'iPhone 16',
    subCategory: 'silicona',
    featured: false,
    is_new: false,
  },
  {
    id: 'prod-003',
    created_at: '2026-02-01T10:00:00Z',
    name: 'cuero-premium-marron',
    cost: 3500,
    price: 14500,
    coverImage: 'https://images.unsplash.com/photo-1549740425-5e9ed4d8cd34?w=600&q=80',
    coverImages: [
      'https://images.unsplash.com/photo-1549740425-5e9ed4d8cd34?w=600&q=80',
    ],
    colors: [
      { name: 'Marrón Castaño', hex: '#8B5E3C', image: 'https://images.unsplash.com/photo-1549740425-5e9ed4d8cd34?w=400&q=80', stock: 7 },
      { name: 'Negro', hex: '#1C1C1E', image: 'https://images.unsplash.com/photo-1512499617640-c2f999098c64?w=400&q=80', stock: 5 },
    ],
    category: 'case',
    model: 'iPhone 15 Pro',
    subCategory: 'cuero',
    featured: true,
    is_new: false,
  },
  {
    id: 'prod-004',
    created_at: '2026-02-05T10:00:00Z',
    name: 'silicona-verde-oliva',
    cost: 1800,
    price: 7000,
    coverImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
    coverImages: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
    ],
    colors: [
      { name: 'Verde Oliva', hex: '#5C5F37', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80', stock: 18 },
      { name: 'Rosa Durazno', hex: '#FFCBA4', image: 'https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=400&q=80', stock: 14 },
      { name: 'Azul Celeste', hex: '#AEC6CF', image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80', stock: 9 },
    ],
    category: 'case',
    model: 'iPhone 15',
    subCategory: 'silicona',
    featured: false,
    is_new: false,
  },
  {
    id: 'prod-005',
    created_at: '2026-02-10T10:00:00Z',
    name: 'magsafe-rosa-titan',
    cost: 2800,
    price: 9500,
    discount: 15,
    coverImage: 'https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=600&q=80',
    coverImages: [
      'https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=600&q=80',
    ],
    colors: [
      { name: 'Rosa Titan', hex: '#E8B4B8', image: 'https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=400&q=80', stock: 11 },
      { name: 'Blanco', hex: '#F5F5F7', image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80', stock: 8 },
    ],
    category: 'case',
    model: 'iPhone 14 Pro',
    subCategory: 'magsafe',
    featured: false,
    is_new: false,
  },
  {
    id: 'prod-006',
    created_at: '2026-02-15T10:00:00Z',
    name: 'transparente-antigolpes',
    cost: 1500,
    price: 6000,
    coverImage: 'https://images.unsplash.com/photo-1592899677977-9c10002761d5?w=600&q=80',
    coverImages: [
      'https://images.unsplash.com/photo-1592899677977-9c10002761d5?w=600&q=80',
    ],
    colors: [
      { name: 'Transparente', hex: '#FFFFFF', image: 'https://images.unsplash.com/photo-1592899677977-9c10002761d5?w=400&q=80', stock: 25 },
    ],
    category: 'case',
    model: 'iPhone 14',
    subCategory: 'transparente',
    featured: false,
    is_new: false,
  },
  {
    id: 'prod-007',
    created_at: '2026-03-01T10:00:00Z',
    name: 'silicona-azul-marino',
    cost: 1800,
    price: 7000,
    coverImage: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&q=80',
    coverImages: [
      'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&q=80',
    ],
    colors: [
      { name: 'Azul Marino', hex: '#1D3461', image: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400&q=80', stock: 13 },
      { name: 'Rojo Carmesí', hex: '#9B1D20', image: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&q=80', stock: 7 },
    ],
    category: 'case',
    model: 'iPhone 13 Pro',
    subCategory: 'silicona',
    featured: false,
    is_new: false,
  },
  {
    id: 'prod-008',
    created_at: '2026-03-05T10:00:00Z',
    name: 'cuero-negro-clasico',
    cost: 3200,
    price: 13000,
    coverImage: 'https://images.unsplash.com/photo-1512499617640-c2f999098c64?w=600&q=80',
    coverImages: [
      'https://images.unsplash.com/photo-1512499617640-c2f999098c64?w=600&q=80',
    ],
    colors: [
      { name: 'Negro', hex: '#1C1C1E', image: 'https://images.unsplash.com/photo-1512499617640-c2f999098c64?w=400&q=80', stock: 9 },
      { name: 'Cognac', hex: '#9B5E28', image: 'https://images.unsplash.com/photo-1549740425-5e9ed4d8cd34?w=400&q=80', stock: 6 },
    ],
    category: 'case',
    model: 'iPhone 13',
    subCategory: 'cuero',
    featured: false,
    is_new: false,
  },
  {
    id: 'prod-009',
    created_at: '2026-03-10T10:00:00Z',
    name: 'silicona-lila-suave',
    cost: 1600,
    price: 6500,
    coverImage: 'https://images.unsplash.com/photo-1600490036275-75a80ec07fe6?w=600&q=80',
    coverImages: [
      'https://images.unsplash.com/photo-1600490036275-75a80ec07fe6?w=600&q=80',
    ],
    colors: [
      { name: 'Lila', hex: '#C8A2C8', image: 'https://images.unsplash.com/photo-1600490036275-75a80ec07fe6?w=400&q=80', stock: 20 },
      { name: 'Menta', hex: '#98FF98', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80', stock: 16 },
    ],
    category: 'case',
    model: 'iPhone 12',
    subCategory: 'silicona',
    featured: false,
    is_new: false,
  },
  {
    id: 'prod-010',
    created_at: '2026-03-15T10:00:00Z',
    name: 'transparente-minimalista',
    cost: 1200,
    price: 5500,
    coverImage: 'https://images.unsplash.com/photo-1555774698-0d2d06c48f04?w=600&q=80',
    coverImages: [
      'https://images.unsplash.com/photo-1555774698-0d2d06c48f04?w=600&q=80',
    ],
    colors: [
      { name: 'Transparente', hex: '#FFFFFF', image: 'https://images.unsplash.com/photo-1555774698-0d2d06c48f04?w=400&q=80', stock: 30 },
    ],
    category: 'case',
    model: 'iPhone 11',
    subCategory: 'transparente',
    featured: false,
    is_new: false,
  },
  {
    id: 'prod-011',
    created_at: '2026-01-25T10:00:00Z',
    name: 'cable-usb-c-lightning-1m',
    cost: 1500,
    price: 5500,
    coverImage: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&q=80',
    coverImages: [
      'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&q=80',
    ],
    colors: [
      { name: 'Blanco', hex: '#F5F5F7', image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&q=80', stock: 40 },
      { name: 'Negro', hex: '#1C1C1E', image: 'https://images.unsplash.com/photo-1585386959604-600afd5d2e2e?w=400&q=80', stock: 35 },
    ],
    category: 'accessory',
    model: 'Universal',
    subCategory: 'cable',
    featured: false,
    is_new: false,
  },
  {
    id: 'prod-012',
    created_at: '2026-02-03T10:00:00Z',
    name: 'cargador-inalambrico-magsafe-15w',
    cost: 5000,
    price: 19500,
    coverImage: 'https://images.unsplash.com/photo-1610945264803-c22b62831e6b?w=600&q=80',
    coverImages: [
      'https://images.unsplash.com/photo-1610945264803-c22b62831e6b?w=600&q=80',
    ],
    colors: [
      { name: 'Blanco', hex: '#F5F5F7', image: 'https://images.unsplash.com/photo-1610945264803-c22b62831e6b?w=400&q=80', stock: 15 },
    ],
    category: 'accessory',
    model: 'iPhone',
    subCategory: 'cargador',
    featured: true,
    is_new: true,
  },
  {
    id: 'prod-013',
    created_at: '2026-02-20T10:00:00Z',
    name: 'soporte-auto-magsafe',
    cost: 3000,
    price: 12000,
    discount: 20,
    coverImage: 'https://images.unsplash.com/photo-1585386959604-600afd5d2e2e?w=600&q=80',
    coverImages: [
      'https://images.unsplash.com/photo-1585386959604-600afd5d2e2e?w=600&q=80',
    ],
    colors: [
      { name: 'Negro', hex: '#1C1C1E', image: 'https://images.unsplash.com/photo-1585386959604-600afd5d2e2e?w=400&q=80', stock: 20 },
    ],
    category: 'accessory',
    model: 'iPhone',
    subCategory: 'soporte',
    featured: false,
    is_new: false,
  },
  {
    id: 'prod-014',
    created_at: '2026-03-01T10:00:00Z',
    name: 'power-bank-10000mah',
    cost: 7000,
    price: 28000,
    coverImage: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80',
    coverImages: [
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80',
    ],
    colors: [
      { name: 'Negro', hex: '#1C1C1E', image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&q=80', stock: 12 },
      { name: 'Blanco', hex: '#F5F5F7', image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&q=80', stock: 8 },
    ],
    category: 'accessory',
    model: 'Universal',
    subCategory: 'powerbank',
    featured: false,
    is_new: false,
  },
  {
    id: 'prod-015',
    created_at: '2026-03-10T10:00:00Z',
    name: 'vidrio-templado-9h',
    cost: 800,
    price: 3500,
    coverImage: 'https://images.unsplash.com/photo-1590658268037-4b5c6f37ec5f?w=600&q=80',
    coverImages: [
      'https://images.unsplash.com/photo-1590658268037-4b5c6f37ec5f?w=600&q=80',
    ],
    colors: [
      { name: 'Transparente', hex: '#FFFFFF', image: 'https://images.unsplash.com/photo-1590658268037-4b5c6f37ec5f?w=400&q=80', stock: 60 },
    ],
    category: 'accessory',
    model: 'Universal',
    subCategory: 'vidrio-templado',
    featured: false,
    is_new: false,
  },
  {
    id: 'prod-016',
    created_at: '2026-01-10T10:00:00Z',
    name: 'airpods-pro-2-replica',
    cost: 8000,
    price: 32000,
    coverImage: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=80',
    coverImages: [
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=80',
      'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=600&q=80',
    ],
    colors: [
      { name: 'Blanco', hex: '#F5F5F7', image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&q=80', stock: 20 },
    ],
    category: 'auriculares',
    model: 'Universal',
    subCategory: 'tws',
    featured: true,
    is_new: false,
  },
  {
    id: 'prod-017',
    created_at: '2026-02-01T10:00:00Z',
    name: 'tws-premium-inear',
    cost: 5500,
    price: 22000,
    discount: 10,
    coverImage: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=600&q=80',
    coverImages: [
      'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=600&q=80',
    ],
    colors: [
      { name: 'Negro', hex: '#1C1C1E', image: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400&q=80', stock: 15 },
      { name: 'Blanco', hex: '#F5F5F7', image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&q=80', stock: 12 },
    ],
    category: 'auriculares',
    model: 'Universal',
    subCategory: 'tws',
    featured: false,
    is_new: false,
  },
  {
    id: 'prod-018',
    created_at: '2026-02-15T10:00:00Z',
    name: 'auriculares-deportivos-bt',
    cost: 4500,
    price: 18500,
    coverImage: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=80',
    coverImages: [
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=80',
    ],
    colors: [
      { name: 'Negro', hex: '#1C1C1E', image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&q=80', stock: 18 },
      { name: 'Rojo', hex: '#FF3B30', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80', stock: 10 },
    ],
    category: 'auriculares',
    model: 'Universal',
    subCategory: 'deportivos',
    featured: false,
    is_new: true,
  },
  {
    id: 'prod-019',
    created_at: '2026-03-01T10:00:00Z',
    name: 'silicona-blanca-16-pro',
    cost: 2200,
    price: 8500,
    coverImage: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80',
    coverImages: [
      'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80',
    ],
    colors: [
      { name: 'Blanco', hex: '#F5F5F7', image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80', stock: 14 },
      { name: 'Amarillo Pastel', hex: '#FFE066', image: 'https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=400&q=80', stock: 10 },
    ],
    category: 'case',
    model: 'iPhone 16 Pro',
    subCategory: 'silicona',
    featured: false,
    is_new: true,
  },
  {
    id: 'prod-020',
    created_at: '2026-03-15T10:00:00Z',
    name: 'cable-trenzado-usb-c-2m',
    cost: 2000,
    price: 7500,
    coverImage: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&q=80',
    coverImages: [
      'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&q=80',
    ],
    colors: [
      { name: 'Negro', hex: '#1C1C1E', image: 'https://images.unsplash.com/photo-1585386959604-600afd5d2e2e?w=400&q=80', stock: 30 },
      { name: 'Plata', hex: '#C0C0C0', image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&q=80', stock: 25 },
    ],
    category: 'accessory',
    model: 'Universal',
    subCategory: 'cable',
    featured: false,
    is_new: false,
  },
];

// ─── MODELS ──────────────────────────────────────────────────────────────────

export const MOCK_MODELS = {
  case: [
    'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16', 'iPhone 16 Plus',
    'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'iPhone 15 Plus',
    'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14', 'iPhone 14 Plus',
    'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 Mini',
    'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 Mini',
    'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
  ],
  accessory: ['Universal', 'iPhone'],
  auriculares: ['Universal'],
};

// ─── SUBCATEGORIES ────────────────────────────────────────────────────────────

export const MOCK_SUBCATEGORIES = {
  case: ['magsafe', 'silicona', 'cuero', 'transparente', 'antigolpes'],
  accessory: ['cable', 'cargador', 'soporte', 'powerbank', 'vidrio-templado'],
  auriculares: ['tws', 'deportivos', 'over-ear'],
};

// ─── CAROUSEL IMAGES ──────────────────────────────────────────────────────────

export const MOCK_CAROUSEL_IMAGES: CarouselImage[] = [
  {
    id: 'car-001',
    created_at: '2026-01-01T00:00:00Z',
    image_url: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=1200&q=80',
    alt_text: 'Fundas MagSafe para iPhone 16 - Colección Nueva',
    sort_order: 0,
  },
  {
    id: 'car-002',
    created_at: '2026-01-02T00:00:00Z',
    image_url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=1200&q=80',
    alt_text: 'AirPods Pro - La mejor experiencia de audio',
    sort_order: 1,
  },
  {
    id: 'car-003',
    created_at: '2026-01-03T00:00:00Z',
    image_url: 'https://images.unsplash.com/photo-1610945264803-c22b62831e6b?w=1200&q=80',
    alt_text: 'Cargadores inalámbricos MagSafe - Carga rápida 15W',
    sort_order: 2,
  },
  {
    id: 'car-004',
    created_at: '2026-01-04T00:00:00Z',
    image_url: 'https://images.unsplash.com/photo-1549740425-5e9ed4d8cd34?w=1200&q=80',
    alt_text: 'Fundas de cuero premium - Estilo y protección',
    sort_order: 3,
  },
  {
    id: 'car-005',
    created_at: '2026-01-05T00:00:00Z',
    image_url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=1200&q=80',
    alt_text: 'Auriculares Bluetooth deportivos',
    sort_order: 4,
  },
];

// ─── FAQs ─────────────────────────────────────────────────────────────────────

export const MOCK_FAQS: FAQ[] = [
  {
    id: 'faq-001',
    question: '¿Cuánto tarda en llegar mi pedido?',
    answer: 'Los pedidos en Freyre se entregan el mismo día o al día siguiente. Para San Francisco y alrededores, coordinamos entrega o envío en 24-48 hs. Para el resto del país enviamos por correo con un tiempo estimado de 3 a 7 días hábiles.',
  },
  {
    id: 'faq-002',
    question: '¿Las fundas son originales de Apple?',
    answer: 'Nuestras fundas son accesorios premium de alta calidad, compatibles con todos los modelos de iPhone mencionados. Ofrecemos opciones que incluyen materiales como silicona suave, cuero genuino y policarbonato resistente. Los precios son muy accesibles en comparación con los productos originales de Apple.',
  },
  {
    id: 'faq-003',
    question: '¿Cómo puedo pagar mi pedido?',
    answer: 'Aceptamos efectivo, transferencia bancaria, débito y crédito (en 3 cuotas sin interés). Los pagos en efectivo y transferencia tienen un descuento del 20%, y el débito tiene 10% OFF. Para transferencias, los datos bancarios se envían automáticamente al realizar el pedido.',
  },
  {
    id: 'faq-004',
    question: '¿Puedo cambiar o devolver un producto?',
    answer: 'Sí, aceptamos cambios y devoluciones dentro de los 7 días de recibido el producto, siempre que esté sin uso y en su empaque original. En caso de defecto de fábrica, hacemos el cambio sin costo. Contactanos por WhatsApp para coordinar.',
  },
  {
    id: 'faq-005',
    question: '¿Tienen stock de todos los modelos?',
    answer: 'Tenemos stock permanente de los modelos más recientes (iPhone 13 al 16 Pro Max). Para modelos más antiguos, consultanos por WhatsApp ya que puede variar. Actualizamos el stock semanalmente y podemos conseguir modelos específicos en pocos días.',
  },
  {
    id: 'faq-006',
    question: '¿Cómo funciona el descuento por primera compra?',
    answer: 'Al realizar tu primera compra, al finalizar el pedido por WhatsApp te aparecerá un popup con las instrucciones. Subí una foto etiquetando a @just.phones.fv con tu compra y te mandamos un código de 10% OFF para usar en tu próximo pedido.',
  },
];

// ─── DISCOUNT CODES ───────────────────────────────────────────────────────────

export const MOCK_DISCOUNT_CODES: DiscountCode[] = [
  {
    id: 'dc-001',
    created_at: '2026-01-01T00:00:00Z',
    code: 'DEMO10',
    name: 'Demo 10%',
    description: 'Código de prueba para demo',
    percentage: 10,
    usage_count: 5,
    usage_limit: 100,
    is_active: true,
  },
  {
    id: 'dc-002',
    created_at: '2026-01-01T00:00:00Z',
    code: 'PROMO20',
    name: 'Promo Verano',
    description: 'Descuento de verano',
    percentage: 20,
    usage_count: 12,
    usage_limit: 50,
    is_active: true,
  },
  {
    id: 'dc-003',
    created_at: '2026-01-01T00:00:00Z',
    code: 'PORTFOLIO',
    name: 'Portfolio Demo',
    description: 'Descuento para visitantes del portfolio',
    percentage: 15,
    usage_count: 2,
    usage_limit: 999,
    is_active: true,
  },
  {
    id: 'dc-004',
    created_at: '2026-01-01T00:00:00Z',
    code: 'BIENVENIDA',
    name: 'Primera Compra',
    description: 'Descuento primera compra',
    percentage: 10,
    usage_count: 28,
    is_active: true,
  },
];

// ─── CUSTOMER REQUESTS (ORDERS) ───────────────────────────────────────────────

export const MOCK_CUSTOMER_REQUESTS: CustomerRequest[] = [
  { id: 'req-001', created_at: '2026-06-24T14:30:00Z', product_id: 'prod-001', product_name: 'magsafe-transparente', product_model: 'iPhone 16', color_name: 'Transparente', color_hex: '#FFFFFF', quantity: 1 },
  { id: 'req-002', created_at: '2026-06-24T11:15:00Z', product_id: 'prod-016', product_name: 'airpods-pro-2-replica', product_model: 'Universal', color_name: 'Blanco', color_hex: '#F5F5F7', quantity: 1 },
  { id: 'req-003', created_at: '2026-06-23T16:45:00Z', product_id: 'prod-003', product_name: 'cuero-premium-marron', product_model: 'iPhone 15 Pro', color_name: 'Marrón Castaño', color_hex: '#8B5E3C', quantity: 1 },
  { id: 'req-004', created_at: '2026-06-23T10:20:00Z', product_id: 'prod-012', product_name: 'cargador-inalambrico-magsafe-15w', product_model: 'iPhone', color_name: 'Blanco', color_hex: '#F5F5F7', quantity: 1 },
  { id: 'req-005', created_at: '2026-06-22T18:05:00Z', product_id: 'prod-002', product_name: 'silicona-premium-negra', product_model: 'iPhone 16', color_name: 'Azul Medianoche', color_hex: '#1D3461', quantity: 2 },
  { id: 'req-006', created_at: '2026-06-22T09:30:00Z', product_id: 'prod-019', product_name: 'silicona-blanca-16-pro', product_model: 'iPhone 16 Pro', color_name: 'Blanco', color_hex: '#F5F5F7', quantity: 1 },
  { id: 'req-007', created_at: '2026-06-21T15:00:00Z', product_id: 'prod-005', product_name: 'magsafe-rosa-titan', product_model: 'iPhone 14 Pro', color_name: 'Rosa Titan', color_hex: '#E8B4B8', quantity: 1 },
  { id: 'req-008', created_at: '2026-06-21T12:40:00Z', product_id: 'prod-017', product_name: 'tws-premium-inear', product_model: 'Universal', color_name: 'Negro', color_hex: '#1C1C1E', quantity: 1 },
  { id: 'req-009', created_at: '2026-06-20T17:20:00Z', product_id: 'prod-014', product_name: 'power-bank-10000mah', product_model: 'Universal', color_name: 'Negro', color_hex: '#1C1C1E', quantity: 1 },
  { id: 'req-010', created_at: '2026-06-20T10:55:00Z', product_id: 'prod-004', product_name: 'silicona-verde-oliva', product_model: 'iPhone 15', color_name: 'Verde Oliva', color_hex: '#5C5F37', quantity: 1 },
  { id: 'req-011', created_at: '2026-06-19T14:10:00Z', product_id: 'prod-011', product_name: 'cable-usb-c-lightning-1m', product_model: 'Universal', color_name: 'Blanco', color_hex: '#F5F5F7', quantity: 3 },
  { id: 'req-012', created_at: '2026-06-19T08:45:00Z', product_id: 'prod-007', product_name: 'silicona-azul-marino', product_model: 'iPhone 13 Pro', color_name: 'Azul Marino', color_hex: '#1D3461', quantity: 1 },
  { id: 'req-013', created_at: '2026-06-18T16:30:00Z', product_id: 'prod-013', product_name: 'soporte-auto-magsafe', product_model: 'iPhone', color_name: 'Negro', color_hex: '#1C1C1E', quantity: 1 },
  { id: 'req-014', created_at: '2026-06-18T11:00:00Z', product_id: 'prod-009', product_name: 'silicona-lila-suave', product_model: 'iPhone 12', color_name: 'Lila', color_hex: '#C8A2C8', quantity: 2 },
  { id: 'req-015', created_at: '2026-06-17T13:25:00Z', product_id: 'prod-015', product_name: 'vidrio-templado-9h', product_model: 'Universal', color_name: 'Transparente', color_hex: '#FFFFFF', quantity: 4 },
];

// ─── SALES ────────────────────────────────────────────────────────────────────

export const MOCK_SALES: Sale[] = [
  { id: 'sale-001', created_at: '2026-06-24T14:35:00Z', product_id: 'prod-001', product_name: 'magsafe-transparente', product_model: 'iPhone 16', color_name: 'Transparente', color_hex: '#FFFFFF', quantity: 1, price_per_unit: 8500, total_price: 8500 },
  { id: 'sale-002', created_at: '2026-06-24T11:20:00Z', product_id: 'prod-016', product_name: 'airpods-pro-2-replica', product_model: 'Universal', color_name: 'Blanco', color_hex: '#F5F5F7', quantity: 1, price_per_unit: 32000, total_price: 32000 },
  { id: 'sale-003', created_at: '2026-06-22T09:45:00Z', product_id: 'prod-003', product_name: 'cuero-premium-marron', product_model: 'iPhone 15 Pro', color_name: 'Marrón Castaño', color_hex: '#8B5E3C', quantity: 1, price_per_unit: 14500, total_price: 14500, discount_code: 'PROMO20', discount_percentage: 20 },
  { id: 'sale-004', created_at: '2026-06-21T15:05:00Z', product_id: 'prod-012', product_name: 'cargador-inalambrico-magsafe-15w', product_model: 'iPhone', color_name: 'Blanco', color_hex: '#F5F5F7', quantity: 1, price_per_unit: 19500, total_price: 19500 },
  { id: 'sale-005', created_at: '2026-06-20T17:25:00Z', product_id: 'prod-002', product_name: 'silicona-premium-negra', product_model: 'iPhone 16', color_name: 'Azul Medianoche', color_hex: '#1D3461', quantity: 2, price_per_unit: 7500, total_price: 15000 },
  { id: 'sale-006', created_at: '2026-06-18T16:35:00Z', product_id: 'prod-017', product_name: 'tws-premium-inear', product_model: 'Universal', color_name: 'Negro', color_hex: '#1C1C1E', quantity: 1, price_per_unit: 22000, total_price: 22000, discount_code: 'DEMO10', discount_percentage: 10 },
  { id: 'sale-007', created_at: '2026-06-17T13:30:00Z', product_id: 'prod-014', product_name: 'power-bank-10000mah', product_model: 'Universal', color_name: 'Negro', color_hex: '#1C1C1E', quantity: 1, price_per_unit: 28000, total_price: 28000 },
  { id: 'sale-008', created_at: '2026-06-15T10:00:00Z', product_id: 'prod-004', product_name: 'silicona-verde-oliva', product_model: 'iPhone 15', color_name: 'Verde Oliva', color_hex: '#5C5F37', quantity: 3, price_per_unit: 7000, total_price: 21000 },
  { id: 'sale-009', created_at: '2026-06-12T14:15:00Z', product_id: 'prod-005', product_name: 'magsafe-rosa-titan', product_model: 'iPhone 14 Pro', color_name: 'Rosa Titan', color_hex: '#E8B4B8', quantity: 1, price_per_unit: 9500, total_price: 9500 },
  { id: 'sale-010', created_at: '2026-06-10T09:30:00Z', product_id: 'prod-011', product_name: 'cable-usb-c-lightning-1m', product_model: 'Universal', color_name: 'Blanco', color_hex: '#F5F5F7', quantity: 5, price_per_unit: 5500, total_price: 27500 },
  { id: 'sale-011', created_at: '2026-06-08T16:00:00Z', product_id: 'prod-013', product_name: 'soporte-auto-magsafe', product_model: 'iPhone', color_name: 'Negro', color_hex: '#1C1C1E', quantity: 2, price_per_unit: 12000, total_price: 24000 },
  { id: 'sale-012', created_at: '2026-06-05T11:45:00Z', product_id: 'prod-018', product_name: 'auriculares-deportivos-bt', product_model: 'Universal', color_name: 'Negro', color_hex: '#1C1C1E', quantity: 1, price_per_unit: 18500, total_price: 18500 },
  { id: 'sale-013', created_at: '2026-05-28T14:20:00Z', product_id: 'prod-008', product_name: 'cuero-negro-clasico', product_model: 'iPhone 13', color_name: 'Negro', color_hex: '#1C1C1E', quantity: 1, price_per_unit: 13000, total_price: 13000 },
  { id: 'sale-014', created_at: '2026-05-25T10:10:00Z', product_id: 'prod-019', product_name: 'silicona-blanca-16-pro', product_model: 'iPhone 16 Pro', color_name: 'Blanco', color_hex: '#F5F5F7', quantity: 2, price_per_unit: 8500, total_price: 17000 },
  { id: 'sale-015', created_at: '2026-05-22T15:50:00Z', product_id: 'prod-015', product_name: 'vidrio-templado-9h', product_model: 'Universal', color_name: 'Transparente', color_hex: '#FFFFFF', quantity: 10, price_per_unit: 3500, total_price: 35000 },
  { id: 'sale-016', created_at: '2026-05-20T09:00:00Z', product_id: 'prod-009', product_name: 'silicona-lila-suave', product_model: 'iPhone 12', color_name: 'Lila', color_hex: '#C8A2C8', quantity: 2, price_per_unit: 6500, total_price: 13000 },
  { id: 'sale-017', created_at: '2026-05-15T14:30:00Z', product_id: 'prod-016', product_name: 'airpods-pro-2-replica', product_model: 'Universal', color_name: 'Blanco', color_hex: '#F5F5F7', quantity: 2, price_per_unit: 32000, total_price: 64000, discount_code: 'PORTFOLIO', discount_percentage: 15 },
  { id: 'sale-018', created_at: '2026-05-10T11:20:00Z', product_id: 'prod-020', product_name: 'cable-trenzado-usb-c-2m', product_model: 'Universal', color_name: 'Negro', color_hex: '#1C1C1E', quantity: 3, price_per_unit: 7500, total_price: 22500 },
  { id: 'sale-019', created_at: '2026-04-28T16:00:00Z', product_id: 'prod-001', product_name: 'magsafe-transparente', product_model: 'iPhone 16', color_name: 'Negro Humo', color_hex: '#1C1C1E', quantity: 1, price_per_unit: 8500, total_price: 8500 },
  { id: 'sale-020', created_at: '2026-04-20T10:45:00Z', product_id: 'prod-007', product_name: 'silicona-azul-marino', product_model: 'iPhone 13 Pro', color_name: 'Azul Marino', color_hex: '#1D3461', quantity: 4, price_per_unit: 7000, total_price: 28000 },
];

// ─── FIXED COSTS ──────────────────────────────────────────────────────────────

export const MOCK_FIXED_COSTS: FixedCost[] = [
  { id: 'fc-001', created_at: '2026-06-01T00:00:00Z', name: 'Alquiler local', amount: 85000, month: '2026-06' },
  { id: 'fc-002', created_at: '2026-06-01T00:00:00Z', name: 'Servicio de internet', amount: 12500, month: '2026-06' },
  { id: 'fc-003', created_at: '2026-06-01T00:00:00Z', name: 'Packaging y bolsas', amount: 18000, month: '2026-06' },
  { id: 'fc-004', created_at: '2026-06-01T00:00:00Z', name: 'Luz y servicios', amount: 22000, month: '2026-06' },
  { id: 'fc-005', created_at: '2026-06-01T00:00:00Z', name: 'Publicidad Instagram', amount: 15000, month: '2026-06' },
  { id: 'fc-006', created_at: '2026-05-01T00:00:00Z', name: 'Alquiler local', amount: 80000, month: '2026-05' },
  { id: 'fc-007', created_at: '2026-05-01T00:00:00Z', name: 'Servicio de internet', amount: 12500, month: '2026-05' },
  { id: 'fc-008', created_at: '2026-05-01T00:00:00Z', name: 'Packaging y bolsas', amount: 16000, month: '2026-05' },
  { id: 'fc-009', created_at: '2026-05-01T00:00:00Z', name: 'Luz y servicios', amount: 20000, month: '2026-05' },
  { id: 'fc-010', created_at: '2026-05-01T00:00:00Z', name: 'Publicidad Instagram', amount: 15000, month: '2026-05' },
  { id: 'fc-011', created_at: '2026-04-01T00:00:00Z', name: 'Alquiler local', amount: 75000, month: '2026-04' },
  { id: 'fc-012', created_at: '2026-04-01T00:00:00Z', name: 'Servicio de internet', amount: 12500, month: '2026-04' },
  { id: 'fc-013', created_at: '2026-04-01T00:00:00Z', name: 'Packaging y bolsas', amount: 14000, month: '2026-04' },
  { id: 'fc-014', created_at: '2026-04-01T00:00:00Z', name: 'Luz y servicios', amount: 19000, month: '2026-04' },
  { id: 'fc-015', created_at: '2026-04-01T00:00:00Z', name: 'Publicidad Instagram', amount: 12000, month: '2026-04' },
];

// ─── MONETARY INCOME ──────────────────────────────────────────────────────────

export const MOCK_MONETARY_INCOME: MonetaryIncome[] = [
  { id: 'mi-001', created_at: '2026-06-15T10:00:00Z', name: 'Ingreso inversión inicial', amount: 150000, description: 'Capital inicial para restock de temporada' },
  { id: 'mi-002', created_at: '2026-05-10T10:00:00Z', name: 'Préstamo bancario', amount: 200000, description: 'Préstamo personal para ampliar stock' },
  { id: 'mi-003', created_at: '2026-04-20T10:00:00Z', name: '[EGRESO] Envío mayorista', amount: 35000, description: 'Pago envío a proveedor de Buenos Aires' },
  { id: 'mi-004', created_at: '2026-04-05T10:00:00Z', name: 'Ingreso socio', amount: 80000, description: 'Aporte de socio para ampliación' },
  { id: 'mi-005', created_at: '2026-03-20T10:00:00Z', name: '[EGRESO] Gastos imprevistos', amount: 25000, description: 'Reparación equipamiento' },
];

// ─── SALARY WITHDRAWALS ───────────────────────────────────────────────────────

export const MOCK_SALARY_WITHDRAWALS: SalaryWithdrawal[] = [
  { id: 'sw-001', created_at: '2026-06-01T00:00:00Z', amount: 180000, description: 'Sueldo Junio 2026' },
  { id: 'sw-002', created_at: '2026-05-01T00:00:00Z', amount: 175000, description: 'Sueldo Mayo 2026' },
  { id: 'sw-003', created_at: '2026-04-01T00:00:00Z', amount: 160000, description: 'Sueldo Abril 2026' },
  { id: 'sw-004', created_at: '2026-03-01T00:00:00Z', amount: 150000, description: 'Sueldo Marzo 2026' },
];

// ─── STOCK HISTORY ────────────────────────────────────────────────────────────

export const MOCK_STOCK_HISTORY: StockHistory[] = [
  { id: 'sh-001', created_at: '2026-06-10T10:00:00Z', product_id: 'prod-001', product_name: 'magsafe-transparente', product_model: 'iPhone 16', color_name: 'Transparente', quantity_added: 20, cost: 2500, price: 8500, pedido_id: 'ped-001' },
  { id: 'sh-002', created_at: '2026-06-10T10:00:00Z', product_id: 'prod-016', product_name: 'airpods-pro-2-replica', product_model: 'Universal', color_name: 'Blanco', quantity_added: 15, cost: 8000, price: 32000, pedido_id: 'ped-001' },
  { id: 'sh-003', created_at: '2026-06-10T10:00:00Z', product_id: 'prod-012', product_name: 'cargador-inalambrico-magsafe-15w', product_model: 'iPhone', color_name: 'Blanco', quantity_added: 10, cost: 5000, price: 19500, pedido_id: 'ped-001' },
  { id: 'sh-004', created_at: '2026-05-15T10:00:00Z', product_id: 'prod-002', product_name: 'silicona-premium-negra', product_model: 'iPhone 16', color_name: 'Negro Mate', quantity_added: 25, cost: 2000, price: 7500, pedido_id: 'ped-002' },
  { id: 'sh-005', created_at: '2026-05-15T10:00:00Z', product_id: 'prod-003', product_name: 'cuero-premium-marron', product_model: 'iPhone 15 Pro', color_name: 'Marrón Castaño', quantity_added: 12, cost: 3500, price: 14500, pedido_id: 'ped-002' },
  { id: 'sh-006', created_at: '2026-05-15T10:00:00Z', product_id: 'prod-014', product_name: 'power-bank-10000mah', product_model: 'Universal', color_name: 'Negro', quantity_added: 15, cost: 7000, price: 28000, pedido_id: 'ped-002' },
  { id: 'sh-007', created_at: '2026-04-20T10:00:00Z', product_id: 'prod-017', product_name: 'tws-premium-inear', product_model: 'Universal', color_name: 'Negro', quantity_added: 20, cost: 5500, price: 22000, pedido_id: 'ped-003' },
  { id: 'sh-008', created_at: '2026-04-20T10:00:00Z', product_id: 'prod-018', product_name: 'auriculares-deportivos-bt', product_model: 'Universal', color_name: 'Negro', quantity_added: 20, cost: 4500, price: 18500, pedido_id: 'ped-003' },
  { id: 'sh-009', created_at: '2026-04-20T10:00:00Z', product_id: 'prod-011', product_name: 'cable-usb-c-lightning-1m', product_model: 'Universal', color_name: 'Blanco', quantity_added: 50, cost: 1500, price: 5500, pedido_id: 'ped-003' },
  { id: 'sh-010', created_at: '2026-03-25T10:00:00Z', product_id: 'prod-004', product_name: 'silicona-verde-oliva', product_model: 'iPhone 15', color_name: 'Verde Oliva', quantity_added: 30, cost: 1800, price: 7000, pedido_id: 'ped-004' },
];

// ─── PRODUCT HISTORY ──────────────────────────────────────────────────────────

export const MOCK_PRODUCT_HISTORY: ProductHistory[] = [
  { id: 'ph-001', created_at: '2026-01-10T10:00:00Z', product_id: 'prod-016', product_name: 'airpods-pro-2-replica', product_model: 'Universal', product_category: 'auriculares', price: 32000, initial_stock: 20 },
  { id: 'ph-002', created_at: '2026-01-15T10:00:00Z', product_id: 'prod-001', product_name: 'magsafe-transparente', product_model: 'iPhone 16', product_category: 'case', price: 8500, initial_stock: 20 },
  { id: 'ph-003', created_at: '2026-01-20T10:00:00Z', product_id: 'prod-002', product_name: 'silicona-premium-negra', product_model: 'iPhone 16', product_category: 'case', price: 7500, initial_stock: 30 },
  { id: 'ph-004', created_at: '2026-01-25T10:00:00Z', product_id: 'prod-011', product_name: 'cable-usb-c-lightning-1m', product_model: 'Universal', product_category: 'accessory', price: 5500, initial_stock: 60 },
  { id: 'ph-005', created_at: '2026-02-01T10:00:00Z', product_id: 'prod-017', product_name: 'tws-premium-inear', product_model: 'Universal', product_category: 'auriculares', price: 22000, initial_stock: 15 },
  { id: 'ph-006', created_at: '2026-02-03T10:00:00Z', product_id: 'prod-012', product_name: 'cargador-inalambrico-magsafe-15w', product_model: 'iPhone', product_category: 'accessory', price: 19500, initial_stock: 15 },
  { id: 'ph-007', created_at: '2026-02-05T10:00:00Z', product_id: 'prod-003', product_name: 'cuero-premium-marron', product_model: 'iPhone 15 Pro', product_category: 'case', price: 14500, initial_stock: 12 },
  { id: 'ph-008', created_at: '2026-02-10T10:00:00Z', product_id: 'prod-005', product_name: 'magsafe-rosa-titan', product_model: 'iPhone 14 Pro', product_category: 'case', price: 9500, initial_stock: 15 },
  { id: 'ph-009', created_at: '2026-02-15T10:00:00Z', product_id: 'prod-006', product_name: 'transparente-antigolpes', product_model: 'iPhone 14', product_category: 'case', price: 6000, initial_stock: 25 },
  { id: 'ph-010', created_at: '2026-02-20T10:00:00Z', product_id: 'prod-013', product_name: 'soporte-auto-magsafe', product_model: 'iPhone', product_category: 'accessory', price: 12000, initial_stock: 20 },
];

// ─── FINANCE CLOSURES ─────────────────────────────────────────────────────────

export const MOCK_FINANCE_CLOSURES = [
  {
    id: 'fc-close-001',
    month: '2026-04',
    start_date: '2026-04-01T00:00:00Z',
    created_at: '2026-05-01T00:00:00Z',
    opening_capital: 500000,
    closing_capital: 638500,
    period_income: 484500,
    period_costs: 346000,
    period_net: 138500,
    period_end_date: '2026-04-30T23:59:59Z',
  },
  {
    id: 'fc-close-002',
    month: '2026-05',
    start_date: '2026-05-01T00:00:00Z',
    created_at: '2026-06-01T00:00:00Z',
    opening_capital: 638500,
    closing_capital: 795000,
    period_income: 526500,
    period_costs: 370000,
    period_net: 156500,
    period_end_date: '2026-05-31T23:59:59Z',
  },
  {
    id: 'fc-close-003',
    month: '2026-06',
    start_date: '2026-06-01T00:00:00Z',
    created_at: null,
    opening_capital: 795000,
    closing_capital: null,
    period_income: null,
    period_costs: null,
    period_net: null,
    period_end_date: null,
  },
];

// ─── DISCOUNT CODE VALIDATION ─────────────────────────────────────────────────

export function validateDiscountCode(code: string): { success: boolean; error?: string; percentage?: number; code?: string; name?: string } {
  const found = MOCK_DISCOUNT_CODES.find(
    dc => dc.code === code.toUpperCase() && dc.is_active
  );
  if (!found) {
    return { success: false, error: 'Código de descuento inválido o inactivo.' };
  }
  if (found.expires_at && new Date(found.expires_at) < new Date()) {
    return { success: false, error: 'Este código de descuento ha expirado.' };
  }
  if (found.usage_limit && found.usage_count >= found.usage_limit) {
    return { success: false, error: 'Este código ya alcanzó su límite de uso.' };
  }
  return {
    success: true,
    percentage: found.percentage,
    code: found.code,
    name: found.name,
  };
}

