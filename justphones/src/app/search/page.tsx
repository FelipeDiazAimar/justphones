
"use client"

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { Analytics } from "@vercel/analytics/next";
import { useSearchParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/main-layout';
import type { Product } from '@/lib/products';
import { ProductCard } from '@/components/product-card';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useProducts } from '@/hooks/use-products';
import { Skeleton } from '@/components/ui/skeleton';
import { unslugify } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import {
  DEMO_CATEGORIES,
  DEMO_PRODUCTS,
  formatPriceARS,
  isDemoMode,
  type DemoProduct,
} from '@/lib/demo';

const ITEMS_PER_PAGE = 12;
const DEMO_PLACEHOLDER = '/Cover.png?v=3';

type DemoOrden = 'relevancia' | 'precio-asc' | 'precio-desc' | 'rating';
type DemoCategoriaFiltro = 'todas' | DemoProduct['categoria'];

function precioEfectivoDemo(p: DemoProduct): number {
  return p.precioOferta ?? p.precio;
}

function tieneOfertaDemo(p: DemoProduct): boolean {
  return p.precioOferta != null && p.precioOferta < p.precio;
}

/** Card demo con onError→placeholder y link a detalle. Sin dependencias nuevas. */
function DemoSearchCard({ producto }: { producto: DemoProduct }) {
  const [src, setSrc] = useState(producto.imagenes[0] ?? DEMO_PLACEHOLDER);

  useEffect(() => {
    setSrc(producto.imagenes[0] ?? DEMO_PLACEHOLDER);
  }, [producto]);

  const efectivo = precioEfectivoDemo(producto);
  const oferta = tieneOfertaDemo(producto);
  const agotado = producto.stock <= 0;

  return (
    <Link
      key={producto.id}
      href={`/product/${producto.id}`}
      prefetch={true}
      className="block group rounded-lg border overflow-hidden hover:border-primary/60 transition-colors"
    >
      <div className="relative aspect-[3/4] bg-muted">
        <Image
          src={src}
          alt={producto.nombre}
          fill
          className="object-cover"
          unoptimized={true}
          onError={() => {
            if (src !== DEMO_PLACEHOLDER) setSrc(DEMO_PLACEHOLDER);
          }}
        />
        {oferta && (
          <Badge variant="destructive" className="absolute top-2 left-2 z-10">OFERTA</Badge>
        )}
        <Badge variant="secondary" className="absolute top-2 right-2 z-10">Demo</Badge>
      </div>
      <div className="p-3">
        <p className="text-xs text-muted-foreground">{producto.categoria}</p>
        <h3 className="text-sm md:text-base font-medium leading-tight mt-1">{producto.nombre}</h3>
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {(producto.modelos ?? []).join(' · ')}
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-base md:text-lg font-bold text-primary">{formatPriceARS(efectivo)}</p>
          {oferta && (
            <p className="text-xs md:text-sm text-muted-foreground line-through">
              {formatPriceARS(producto.precio)}
            </p>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {agotado ? 'Agotado' : `${producto.stock} en stock`} · ★ {producto.rating.toFixed(1)}
        </p>
      </div>
    </Link>
  );
}

function SearchResultsPageContent() {
  const { products, isLoading } = useProducts();
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = searchParams.get('q');
  const currentPage = Number(searchParams.get('page')) || 1;

  // ---- Rama demo: buscador funcional sobre DEMO_PRODUCTS (campos en español) ----
  // Filtros combinables con q. Categoría derivada de DEMO_CATEGORIES (sin hardcodear).
  const demoMode = isDemoMode();
  const [demoCategoria, setDemoCategoria] = useState<DemoCategoriaFiltro>('todas');
  const [demoMin, setDemoMin] = useState('');
  const [demoMax, setDemoMax] = useState('');
  const [demoSoloOfertas, setDemoSoloOfertas] = useState(false);
  const [demoSoloStock, setDemoSoloStock] = useState(false);
  const [demoOrden, setDemoOrden] = useState<DemoOrden>('relevancia');

  const demoFiltered = useMemo(() => {
    const q = (query ?? '').trim().toLowerCase();
    const min = demoMin.trim() === '' ? NaN : Number(demoMin);
    const max = demoMax.trim() === '' ? NaN : Number(demoMax);
    const minValido = Number.isFinite(min) ? min : NaN;
    const maxValido = Number.isFinite(max) ? max : NaN;

    const list = DEMO_PRODUCTS.filter((p) => {
      if (q) {
        const coincide =
          p.nombre.toLowerCase().includes(q) ||
          p.descripcion.toLowerCase().includes(q) ||
          p.categoria.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.modelos.some((m) => m.toLowerCase().includes(q)) ||
          p.colores.some((c) => c.toLowerCase().includes(q));
        if (!coincide) return false;
      }
      if (demoCategoria !== 'todas' && p.categoria !== demoCategoria) return false;
      const efectivo = precioEfectivoDemo(p);
      if (Number.isFinite(minValido) && efectivo < minValido) return false;
      if (Number.isFinite(maxValido) && efectivo > maxValido) return false;
      if (demoSoloOfertas && !tieneOfertaDemo(p)) return false;
      if (demoSoloStock && p.stock <= 0) return false;
      return true;
    });

    switch (demoOrden) {
      case 'precio-asc':
        return [...list].sort((a, b) => precioEfectivoDemo(a) - precioEfectivoDemo(b));
      case 'precio-desc':
        return [...list].sort((a, b) => precioEfectivoDemo(b) - precioEfectivoDemo(a));
      case 'rating':
        return [...list].sort((a, b) => b.rating - a.rating);
      default:
        return list;
    }
  }, [query, demoCategoria, demoMin, demoMax, demoSoloOfertas, demoSoloStock, demoOrden]);

  const demoTieneFiltros =
    demoCategoria !== 'todas' ||
    demoMin.trim() !== '' ||
    demoMax.trim() !== '' ||
    demoSoloOfertas ||
    demoSoloStock ||
    demoOrden !== 'relevancia';

  const limpiarFiltrosDemo = () => {
    setDemoCategoria('todas');
    setDemoMin('');
    setDemoMax('');
    setDemoSoloOfertas(false);
    setDemoSoloStock(false);
    setDemoOrden('relevancia');
  };

  const demoMinMaxInvertido =
    demoMin.trim() !== '' &&
    demoMax.trim() !== '' &&
    Number.isFinite(Number(demoMin)) &&
    Number.isFinite(Number(demoMax)) &&
    Number(demoMin) > Number(demoMax);

  const demoTotalPages = Math.ceil(demoFiltered.length / ITEMS_PER_PAGE);
  const demoSafePage = demoTotalPages > 0 ? Math.min(Math.max(currentPage, 1), demoTotalPages) : 1;
  const demoPaginated = useMemo(() => {
    return demoFiltered.slice(
      (demoSafePage - 1) * ITEMS_PER_PAGE,
      demoSafePage * ITEMS_PER_PAGE,
    );
  }, [demoFiltered, demoSafePage]);

  const getDemoPageNumbers = () => {
    if (demoTotalPages <= 5) {
      return Array.from({ length: demoTotalPages }, (_, i) => i + 1);
    }
    if (demoSafePage <= 3) {
      return [1, 2, 3, 4, '...', demoTotalPages];
    }
    if (demoSafePage >= demoTotalPages - 2) {
      return [1, '...', demoTotalPages - 3, demoTotalPages - 2, demoTotalPages - 1, demoTotalPages];
    }
    return [1, '...', demoSafePage - 1, demoSafePage, demoSafePage + 1, '...', demoTotalPages];
  };

  const handleDemoPageChange = (page: number) => {
    if (page < 1 || page > demoTotalPages) return;
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    router.push(`?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const filteredProducts = useMemo(() => {
    if (!query) return [];
    
    const lowercasedQuery = query.toLowerCase();
    
    return products.filter(product => 
      unslugify(product.name).toLowerCase().includes(lowercasedQuery) ||
      product.model.toLowerCase().includes(lowercasedQuery)
    );
  }, [query, products]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    router.replace(`?${params.toString()}`, {scroll: false});
  }, [query, router]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredProducts, currentPage]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    router.push(`?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  // ---- Render demo (no toca la rama real de abajo) ----
  if (demoMode) {
    if (!query) {
      return (
        <MainLayout>
          <div className="text-center py-20">
              <Search className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mb-4">Realiza una búsqueda</h1>
              <p className="text-xl text-muted-foreground mb-8">Utiliza la barra de búsqueda en el encabezado para encontrar productos.</p>
          </div>
        </MainLayout>
      );
    }

    return (
      <MainLayout>
        <div>
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Resultados de Búsqueda</h2>
            <p className="text-lg text-muted-foreground mt-1">
              Resultados para: <span className="text-primary font-semibold">"{query}"</span>
              <span className="ml-2 text-sm">({demoFiltered.length} demo)</span>
            </p>
          </div>

          <section aria-label="Filtros de búsqueda" className="mb-6 rounded-xl border border-border bg-card p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <h3 className="font-bold">Filtros</h3>
              </div>
              {demoTieneFiltros && (
                <Button variant="ghost" size="sm" onClick={limpiarFiltrosDemo}>
                  <X className="mr-1.5 h-4 w-4" />
                  Limpiar filtros
                </Button>
              )}
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={demoCategoria === 'todas' ? 'default' : 'outline'}
                onClick={() => setDemoCategoria('todas')}
              >
                Todas ({DEMO_PRODUCTS.length})
              </Button>
              {DEMO_CATEGORIES.map((cat) => {
                const count = DEMO_PRODUCTS.filter((p) => p.categoria === cat.slug).length;
                return (
                  <Button
                    key={cat.slug}
                    size="sm"
                    variant={demoCategoria === cat.slug ? 'default' : 'outline'}
                    onClick={() => setDemoCategoria(cat.slug)}
                  >
                    {cat.nombre} ({count})
                  </Button>
                );
              })}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="demo-min">Precio mín.</Label>
                  <Input
                    id="demo-min"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="0"
                    value={demoMin}
                    onChange={(e) => setDemoMin(e.target.value)}
                  />
                </div>
                <span className="pb-2.5 text-muted-foreground">—</span>
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="demo-max">Precio máx.</Label>
                  <Input
                    id="demo-max"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="50000"
                    value={demoMax}
                    onChange={(e) => setDemoMax(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col justify-end gap-2.5 pb-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="demo-ofertas"
                    checked={demoSoloOfertas}
                    onCheckedChange={(v) => setDemoSoloOfertas(v === true)}
                  />
                  <Label htmlFor="demo-ofertas" className="cursor-pointer font-normal">
                    Solo ofertas
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="demo-stock"
                    checked={demoSoloStock}
                    onCheckedChange={(v) => setDemoSoloStock(v === true)}
                  />
                  <Label htmlFor="demo-stock" className="cursor-pointer font-normal">
                    Solo en stock
                  </Label>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                <Label htmlFor="demo-orden">Ordenar</Label>
                <Select value={demoOrden} onValueChange={(v) => setDemoOrden(v as DemoOrden)}>
                  <SelectTrigger id="demo-orden">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevancia">Relevancia</SelectItem>
                    <SelectItem value="precio-asc">Precio: menor a mayor</SelectItem>
                    <SelectItem value="precio-desc">Precio: mayor a menor</SelectItem>
                    <SelectItem value="rating">Mejor valorados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {demoMinMaxInvertido && (
              <p className="mt-3 text-sm text-destructive">
                El precio mínimo es mayor que el máximo: no hay resultados con ese rango.
              </p>
            )}
          </section>

          {demoPaginated.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {demoPaginated.map((p) => (
                  <DemoSearchCard key={p.id} producto={p} />
                ))}
              </div>

              {demoTotalPages > 1 && (
                <div className="mt-12">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious onClick={() => handleDemoPageChange(demoSafePage - 1)}
                          disabled={demoSafePage === 1} />
                      </PaginationItem>

                      <div className="hidden sm:flex items-center gap-1">
                        {getDemoPageNumbers().map((page, index) => (
                          <PaginationItem key={index}>
                            {typeof page === 'number' ? (
                              <PaginationLink
                                onClick={() => handleDemoPageChange(page)}
                                isActive={demoSafePage === page}
                              >
                                {page}
                              </PaginationLink>
                            ) : (
                              <PaginationEllipsis />
                            )}
                          </PaginationItem>
                        ))}
                      </div>

                      <PaginationItem className="sm:hidden flex items-center gap-2">
                        <span className="font-medium text-sm">
                            {demoSafePage} de {demoTotalPages}
                        </span>
                      </PaginationItem>

                      <PaginationItem>
                        <PaginationNext onClick={() => handleDemoPageChange(demoSafePage + 1)} disabled={demoSafePage === demoTotalPages} />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 col-span-full">
                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mb-4">Sin resultados</h1>
                <p className="text-xl text-muted-foreground mb-8">No se encontraron productos demo para tu búsqueda. Probá ajustar los filtros.</p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {demoTieneFiltros && (
                    <Button variant="outline" onClick={limpiarFiltrosDemo}>
                      <X className="mr-1.5 h-4 w-4" />
                      Limpiar filtros
                    </Button>
                  )}
                  <Button asChild>
                    <Link href="/catalog">Ver todos los productos</Link>
                  </Button>
                </div>
            </div>
          )}
        </div>
        <Analytics />
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-9 w-1/3" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="w-full aspect-[3/5]" />
          ))}
        </div>
      </MainLayout>
    );
  }
  
  if (!query) {
    return (
      <MainLayout>
        <div className="text-center py-20">
            <Search className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mb-4">Realiza una búsqueda</h1>
            <p className="text-xl text-muted-foreground mb-8">Utiliza la barra de búsqueda en el encabezado para encontrar productos.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div>
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Resultados de Búsqueda</h2>
          <p className="text-lg text-muted-foreground mt-1">
            Resultados para: <span className="text-primary font-semibold">"{query}"</span>
          </p>
        </div>
        
        {paginatedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedProducts.map((product: Product) => (
                  <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-12">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1} />
                    </PaginationItem>
                    
                    <div className="hidden sm:flex items-center gap-1">
                      {getPageNumbers().map((page, index) => (
                        <PaginationItem key={index}>
                          {typeof page === 'number' ? (
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          ) : (
                            <PaginationEllipsis />
                          )}
                        </PaginationItem>
                      ))}
                    </div>

                    <PaginationItem className="sm:hidden flex items-center gap-2">
                      <span className="font-medium text-sm">
                          {currentPage} de {totalPages}
                      </span>
                    </PaginationItem>

                    <PaginationItem>
                      <PaginationNext onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 col-span-full">
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mb-4">Sin resultados</h1>
              <p className="text-xl text-muted-foreground mb-8">No se encontraron productos para tu búsqueda.</p>
              <Button asChild>
                <Link href="/catalog">Ver todos los productos</Link>
              </Button>
          </div>
        )}
      </div>
      <Analytics />
    </MainLayout>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-9 w-1/3" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="w-full aspect-[3/5]" />
          ))}
        </div>
      </MainLayout>
    }>
      <SearchResultsPageContent />
    </Suspense>
  );
}
