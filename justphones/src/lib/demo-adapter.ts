/**
 * JustPhones — adaptador demo → modelo real (client-safe).
 *
 * Puente entre `src/lib/demo.ts` (`DemoProduct`, campos en español) y
 * `src/lib/products.ts` (`Product`, campos en inglés). No importa Supabase,
 * ni Node, ni ningún módulo con efectos al importar: solo `demo.ts`
 * (autocontenido) y tipos. Seguro para usar en Server Components, Client
 * Components y páginas estáticas.
 *
 * Decisiones de mapeo (documentadas para que el storefront demo se comporte
 * como el real):
 * - `categoria` demo → `category` real: fundas→'case', auriculares→'auriculares',
 *   cargadores→'accessory', vidrios-templados→'accessory' (con
 *   subCategory 'vidrio-templado', igual que el mock real `prod-015`),
 *   soportes→'accessory' (subCategory 'soporte', como `prod-013` en
 *   `mock-data.ts`), parlantes→'accessory' (subCategory 'parlante',
 *   extensión demo: el enum real sigue siendo solo
 *   'case'|'accessory'|'auriculares' en `src/lib/products.ts`).
 * - `subCategory`: se deriva del slug con palabras clave y usa los mismos
 *   valores que `MOCK_SUBCATEGORIES` en `mock-data.ts`.
 * - `name`: se usa el `slug` demo (el modelo real guarda slugs y la UI los
 *   muestra con `unslugify()` de `src/lib/utils.ts`).
 * - `price`: precio base demo; `discount`: % entero derivado de `precioOferta`
 *   (misma convención que `mock-data.ts`: precio base + descuento). Nota: el
 *   precio efectivo `price * (1 - discount/100)` puede diferir en ±1% por
 *   redondeo respecto a `precioOferta` (ver `effectivePrice()`).
 * - `cost`: el modelo real lo exige pero la demo no tiene costos; se estima
 *   como 30% del precio base (margen similar al de `mock-data.ts`). Solo para
 *   visualización: las finanzas demo usan su propio módulo
 *   (`src/app/finanzas/_demo/`).
 * - `colores` (string[]) → `ProductColor[]`: hex desde tabla de nombres
 *   conocidos (valores tomados de `mock-data.ts`) con fallback a paleta de
 *   grises neutros determinista para nombres desconocidos.
 * - `stock` agregado: se reparte entre los colores (base + resto a los
 *   primeros) de modo que la suma siempre equals `stock` demo.
 * - `imagenes` → `coverImage` (primera) + `coverImages` (copia) + `image` por
 *   color (rotando la lista).
 * - `model`: primer modelo demo o 'Universal'. `featured` ← `destacado`.
 *   `is_new`: siempre false (la demo no tiene ese flag; no se inventa).
 * - `created_at`: determinista por id (base 2026-01-01 + offset por hash),
 *   estable entre renders/SSR.
 */

import {
  DEMO_PRODUCTS,
  isDemoMode,
  whatsappCheckoutUrl,
  type DemoCategorySlug,
  type DemoCheckoutItem,
  type DemoProduct,
} from './demo';
import type { Product, ProductColor } from './products';

/** fundas→'case', auriculares→'auriculares', resto→'accessory' (el enum real sigue case|accessory|auriculares). */
const DEMO_CATEGORY_TO_REAL: Record<DemoCategorySlug, Product['category']> = {
  fundas: 'case',
  auriculares: 'auriculares',
  cargadores: 'accessory',
  'vidrios-templados': 'accessory',
  soportes: 'accessory',
  parlantes: 'accessory',
};

/** Estimación de costo demo (30% del precio base, como en `mock-data.ts`). */
const DEMO_COST_RATIO = 0.3;

/** Nombres de color conocidos (sin acentos, minúsculas) → hex real. */
const DEMO_COLOR_HEX: Record<string, string> = {
  transparente: '#FFFFFF',
  'negro humo': '#1C1C1E',
  'negro mate': '#1C1C1E',
  negro: '#1C1C1E',
  'azul medianoche': '#1D3461',
  'azul marino': '#1D3461',
  'verde oliva': '#5C5F37',
  'marron castano': '#8B5E3C',
  blanco: '#F5F5F7',
  rojo: '#FF3B30',
  plata: '#C0C0C0',
  lila: '#C8A2C8',
  menta: '#98FF98',
  'verde menta': '#98FF98',
};

/** Paleta neutra de respaldo para nombres de color desconocidos. */
const NEUTRAL_HEX_FALLBACK = ['#6B7280', '#9CA3AF', '#4B5563', '#D1D5DB', '#374151'];

function normalizeColorName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Hex para un nombre de color demo; fallback neutro determinista. */
export function demoColorHex(name: string): string {
  const hit = DEMO_COLOR_HEX[normalizeColorName(name.trim())];
  if (hit) return hit;
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return NEUTRAL_HEX_FALLBACK[hash % NEUTRAL_HEX_FALLBACK.length] as string;
}

/** Subcategoría real derivada del slug (valores de `MOCK_SUBCATEGORIES`, salvo 'parlante' que es extensión demo). */
function demoSubCategory(p: DemoProduct): string {
  const slug = p.slug.toLowerCase();
  if (p.categoria === 'fundas') {
    if (slug.includes('magsafe')) return 'magsafe';
    if (slug.includes('silicona')) return 'silicona';
    if (slug.includes('cuero') || slug.includes('billetera')) return 'cuero';
    if (slug.includes('antigolpes') || slug.includes('deportiv')) return 'antigolpes';
    if (slug.includes('transparente')) return 'transparente';
    return 'silicona';
  }
  if (p.categoria === 'auriculares') {
    if (slug.includes('over') || slug.includes('ear')) return 'over-ear';
    if (slug.includes('deportiv') || slug.includes('sport') || slug.includes('gancho'))
      return 'deportivos';
    return 'tws';
  }
  if (p.categoria === 'cargadores') {
    if (slug.includes('cable') || slug.includes('lightning')) return 'cable';
    if (slug.includes('power') || slug.includes('bank')) return 'powerbank';
    return 'cargador';
  }
  if (p.categoria === 'soportes') return 'soporte';
  if (p.categoria === 'parlantes') return 'parlante';
  return 'vidrio-templado';
}

/** `created_at` determinista por id (estable en SSR). */
function demoCreatedAt(id: string): string {
  const base = Date.parse('2026-01-01T00:00:00Z');
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return new Date(base + (hash % 180) * 86_400_000).toISOString();
}

/** % de descuento entero desde precio base y oferta (undefined si no hay oferta). */
function demoDiscount(precio: number, precioOferta?: number): number | undefined {
  if (precioOferta == null || precio <= 0 || precioOferta >= precio) return undefined;
  return Math.round((1 - precioOferta / precio) * 100);
}

/** Convierte un `DemoProduct` (español) al modelo real `Product` (inglés). */
export function fromDemoProduct(p: DemoProduct): Product {
  const coverImage = p.imagenes[0] ?? '';
  const coverImages = [...p.imagenes];
  const discount = demoDiscount(p.precio, p.precioOferta);

  const colorNames = p.colores.length > 0 ? p.colores : ['Estándar'];
  const total = Math.max(0, Math.floor(p.stock));
  const base = Math.floor(total / colorNames.length);
  const rest = total % colorNames.length;
  const colors: ProductColor[] = colorNames.map((name, i) => ({
    name,
    hex: demoColorHex(name),
    image: p.imagenes.length > 0 ? (p.imagenes[i % p.imagenes.length] as string) : coverImage,
    stock: base + (i < rest ? 1 : 0),
  }));

  return {
    id: p.id,
    created_at: demoCreatedAt(p.id),
    name: p.slug,
    cost: Math.max(0, Math.round(p.precio * DEMO_COST_RATIO)),
    price: p.precio,
    discount,
    coverImage,
    coverImages,
    colors,
    category: DEMO_CATEGORY_TO_REAL[p.categoria],
    model: p.modelos[0] ?? 'Universal',
    featured: p.destacado,
    is_new: false,
    subCategory: demoSubCategory(p),
  };
}

/** Precio efectivo de un `Product` (aplica `discount` si existe). */
export function effectivePrice(product: Product): number {
  const discount = product.discount ?? 0;
  if (!discount) return product.price;
  return Math.round(product.price * (1 - discount / 100));
}

/** Fuente mínima para construir un `DemoCheckoutItem` desde el modelo real. */
export interface AdaptedCheckoutSource {
  product: Product;
  color?: { name?: string } | string | null;
  quantity: number;
  /** Modelo elegido; por defecto el del producto. */
  model?: string;
}

function unslugifyLite(slug: string): string {
  if (!slug) return '';
  return slug
    .split('-')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ')
    .replace(/^Iphone/, 'iPhone');
}

/**
 * Convierte un ítem del carrito real (`Product` + color + cantidad) al
 * `DemoCheckoutItem` que `whatsappCheckoutUrl()` sabe serializar.
 * Si el id coincide con `DEMO_PRODUCTS`, recupera nombre y precio exactos
 * de la demo (incluida `precioOferta`); si no, deriva desde el `Product`.
 */
export function toDemoCheckoutItem(source: AdaptedCheckoutSource): DemoCheckoutItem {
  const cantidad = Math.max(1, Math.floor(source.quantity));
  const color =
    typeof source.color === 'string' ? source.color : (source.color?.name ?? undefined);

  const demo = DEMO_PRODUCTS.find((d) => d.id === source.product.id);
  if (demo) {
    return {
      nombre: demo.nombre,
      cantidad,
      precio: demo.precioOferta ?? demo.precio,
      modelo: source.model ?? source.product.model ?? demo.modelos[0],
      color,
    };
  }

  return {
    nombre: unslugifyLite(source.product.name),
    cantidad,
    precio: effectivePrice(source.product),
    modelo: source.model ?? source.product.model,
    color,
  };
}

/** Versión en lote de `toDemoCheckoutItem`. */
export function toDemoCheckoutItems(sources: AdaptedCheckoutSource[]): DemoCheckoutItem[] {
  return sources.map(toDemoCheckoutItem);
}

/**
 * URL de checkout por WhatsApp desde ítems del modelo real (usa el mismo
 * formato que el checkout real vía `whatsappCheckoutUrl` de `demo.ts`).
 */
export function adaptedCheckoutUrl(
  sources: AdaptedCheckoutSource[],
  telefono?: string,
): string {
  return whatsappCheckoutUrl(toDemoCheckoutItems(sources), telefono);
}

/** Todos los `DEMO_PRODUCTS` adaptados al modelo real (síncrono, client-safe). */
export function getDemoProducts(): Product[] {
  return DEMO_PRODUCTS.map(fromDemoProduct);
}

/** Un producto demo adaptado, buscado por id o slug. */
export function getDemoProductById(idOrSlug: string): Product | undefined {
  const found = DEMO_PRODUCTS.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
  return found ? fromDemoProduct(found) : undefined;
}

/**
 * Wrapper de productos con fallback demo.
 * - En demo (`isDemoMode()`): devuelve `DEMO_PRODUCTS` adaptados. Nunca toca
 *   red ni requiere env.
 * - Fuera de demo: devuelve el path real actual (mock local vía import
 *   dinámico para no agrandar el bundle demo). Si el día de mañana los
 *   productos se leen de Supabase directo, reemplazar solo esta rama.
 * `products.ts`/`sales.ts` hoy son solo tipos (no leen Supabase), por eso el
 * wrapper vive aquí y esos archivos no se tocan.
 */
export async function getProducts(): Promise<Product[]> {
  if (isDemoMode()) return getDemoProducts();
  try {
    const { MOCK_PRODUCTS } = await import('./mock-data');
    return MOCK_PRODUCTS;
  } catch {
    return [];
  }
}
