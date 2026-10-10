'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEMO_PRODUCTS, type DemoCategorySlug, type DemoProduct } from '@/lib/demo';

export const DEMO_ADMIN_PRODUCTS_KEY = 'justphones.demo.products.v1';

export type { DemoProduct, DemoCategorySlug };

export const DEMO_ADMIN_CATEGORIES: { slug: DemoCategorySlug; nombre: string }[] = [
  { slug: 'fundas', nombre: 'Fundas' },
  { slug: 'auriculares', nombre: 'Auriculares' },
  { slug: 'cargadores', nombre: 'Cargadores' },
  { slug: 'vidrios-templados', nombre: 'Vidrios templados' },
  { slug: 'soportes', nombre: 'Soportes' },
  { slug: 'parlantes', nombre: 'Parlantes' },
];

export function formatAdminPrice(value: number): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '$ 0';
  return `$ ${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
}

export function categoryLabel(slug: string): string {
  const found = DEMO_ADMIN_CATEGORIES.find((c) => c.slug === slug);
  return found ? found.nombre : slug;
}

export function effectivePrice(p: DemoProduct): number {
  return typeof p.precioOferta === 'number' && p.precioOferta > 0 ? p.precioOferta : p.precio;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function isValidStoredProduct(p: unknown): p is DemoProduct {
  if (!isRecord(p)) return false;
  return (
    typeof p.id === 'string' &&
    typeof p.nombre === 'string' &&
    typeof p.precio === 'number' &&
    typeof p.stock === 'number' &&
    typeof p.categoria === 'string'
  );
}

function normalizeStored(list: DemoProduct[]): DemoProduct[] {
  return list.map((p) => ({
    ...p,
    modelos: Array.isArray(p.modelos) ? p.modelos : [],
    colores: Array.isArray(p.colores) ? p.colores : [],
    imagenes: Array.isArray(p.imagenes) ? p.imagenes : [],
    destacado: Boolean(p.destacado),
    rating: typeof p.rating === 'number' ? p.rating : 0,
    descripcion: typeof p.descripcion === 'string' ? p.descripcion : '',
    slug: typeof p.slug === 'string' && p.slug ? p.slug : p.id,
  }));
}

function readStoredProducts(): DemoProduct[] | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(DEMO_ADMIN_PRODUCTS_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return normalizeStored(parsed.filter(isValidStoredProduct));
  } catch {
    return null;
  }
}

const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');

function slugifyAdminName(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
  return slug || 'producto';
}

export interface DemoProductInput {
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
}

export function useDemoProducts() {
  const [products, setProducts] = useState<DemoProduct[]>(DEMO_PRODUCTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredProducts();
    if (stored) setProducts(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(DEMO_ADMIN_PRODUCTS_KEY, JSON.stringify(products));
    } catch {
      // Sin almacenamiento disponible: se sigue trabajando en memoria.
    }
  }, [products, hydrated]);

  const createProduct = useCallback((input: DemoProductInput) => {
    const base = slugifyAdminName(input.nombre);
    const suffix = Date.now().toString(36);
    const product: DemoProduct = {
      ...input,
      id: `demo-${suffix}`,
      slug: `${base}-${suffix}`,
      rating: 0,
    };
    setProducts((prev) => [product, ...prev]);
    return product;
  }, []);

  const updateProduct = useCallback((id: string, patch: Partial<DemoProductInput>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const removeProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const setStock = useCallback((id: string, stock: number) => {
    const qty = Math.max(0, Math.floor(Number(stock) || 0));
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock: qty } : p)));
  }, []);

  const adjustStock = useCallback((id: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p)),
    );
  }, []);

  const resetProducts = useCallback(() => {
    setProducts(DEMO_PRODUCTS);
  }, []);

  return {
    products,
    hydrated,
    createProduct,
    updateProduct,
    removeProduct,
    setStock,
    adjustStock,
    resetProducts,
  };
}
