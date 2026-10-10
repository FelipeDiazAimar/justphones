"use client"

import React, { useRef, useState, useMemo, Suspense } from 'react';
import { Analytics } from "@vercel/analytics/next";
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import Autoplay from "embla-carousel-autoplay"
import { MainLayout } from '@/components/main-layout';
import type { Product } from '@/lib/products';
import { ProductCard } from '@/components/product-card';
import { WelcomeBanner } from '@/components/welcome-banner';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useProducts } from '@/hooks/use-products';
import { Skeleton } from '@/components/ui/skeleton';
import { useCarouselImagesR2 as useCarouselImages } from '@/hooks/use-carousel-images-r2';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Search, SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DEMO_CATEGORIES,
  DEMO_PRODUCTS,
  formatPriceARS,
  isDemoMode,
  type DemoCategorySlug,
} from '@/lib/demo';
import { DemoProductCard, discountPercent } from './_components/demo-product-card';
import {
  DemoFilters,
  type DemoFiltersValue,
  type DemoSort,
} from './_components/demo-filters';

// ---------------------------------------------------------------------------
// Rama DEMO (solo lectura de src/lib/demo.ts + componentes locales del scope)
// ---------------------------------------------------------------------------

/** Precio efectivo de un producto demo (oferta si existe, si no precio base). */
function demoEffectivePrice(p: (typeof DEMO_PRODUCTS)[number]): number {
  return p.precioOferta ?? p.precio;
}

function DemoCatalogContent() {
  const searchParams = useSearchParams();
  const rawCategoria = searchParams.get('categoria');
  const [query, setQuery] = useState('');
  const [orden, setOrden] = useState<DemoSort>('relevancia');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  // Rango de precio absoluto derivado de los datos (precio efectivo).
  const priceBounds = useMemo(() => {
    const precios = DEMO_PRODUCTS.map(demoEffectivePrice);
    return { min: Math.min(...precios), max: Math.max(...precios) };
  }, []);

  // Modelos y colores únicos derivados de los datos (nada hardcodeado).
  const allModelos = useMemo(() => {
    const set = new Set<string>();
    DEMO_PRODUCTS.forEach((p) => p.modelos.forEach((m) => set.add(m)));
    return [...set].sort((a, b) => a.localeCompare(b, 'es-AR'));
  }, []);

  const allColores = useMemo(() => {
    const set = new Set<string>();
    DEMO_PRODUCTS.forEach((p) => p.colores.forEach((c) => set.add(c)));
    return [...set].sort((a, b) => a.localeCompare(b, 'es-AR'));
  }, []);

  const [filtros, setFiltros] = useState<DemoFiltersValue>(() => ({
    categoria: DEMO_CATEGORIES.some((c) => c.slug === rawCategoria)
      ? (rawCategoria as DemoCategorySlug)
      : 'todas',
    precioMin: priceBounds.min,
    precioMax: priceBounds.max,
    modelos: [],
    ratingMin: 0,
    soloEnStock: false,
    colores: [],
    soloOfertas: searchParams.get('oferta') === '1',
  }));

  const ofertasCount = useMemo(
    () => DEMO_PRODUCTS.filter((p) => discountPercent(p) > 0).length,
    [],
  );

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = DEMO_PRODUCTS.filter((p) => {
      if (filtros.categoria !== 'todas' && p.categoria !== filtros.categoria) return false;
      const precio = demoEffectivePrice(p);
      if (precio < filtros.precioMin || precio > filtros.precioMax) return false;
      if (filtros.modelos.length > 0 && !filtros.modelos.some((m) => p.modelos.includes(m))) return false;
      if (p.rating < filtros.ratingMin) return false;
      if (filtros.soloEnStock && p.stock <= 0) return false;
      if (filtros.colores.length > 0 && !filtros.colores.some((c) => p.colores.includes(c))) return false;
      if (filtros.soloOfertas && discountPercent(p) === 0) return false;
      if (q) {
        const haystack = `${p.nombre} ${p.descripcion} ${p.modelos.join(' ')}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    switch (orden) {
      case 'precio-asc':
        return [...list].sort((a, b) => demoEffectivePrice(a) - demoEffectivePrice(b));
      case 'precio-desc':
        return [...list].sort((a, b) => demoEffectivePrice(b) - demoEffectivePrice(a));
      case 'rating':
        return [...list].sort((a, b) => b.rating - a.rating);
      case 'novedad':
        // DemoProduct no trae fecha de alta: se aproxima con destacado,
        // luego rating y finalmente id descendente (ids crecientes).
        return [...list].sort((a, b) => {
          if (a.destacado !== b.destacado) return a.destacado ? -1 : 1;
          if (b.rating !== a.rating) return b.rating - a.rating;
          return b.id.localeCompare(a.id);
        });
      default:
        return list;
    }
  }, [query, filtros, orden]);

  // Conteo de filtros activos (para el botón mobile y "Limpiar").
  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (query.trim() !== '') n += 1;
    if (filtros.categoria !== 'todas') n += 1;
    if (filtros.precioMin > priceBounds.min || filtros.precioMax < priceBounds.max) n += 1;
    if (filtros.modelos.length > 0) n += 1;
    if (filtros.ratingMin > 0) n += 1;
    if (filtros.soloEnStock) n += 1;
    if (filtros.colores.length > 0) n += 1;
    if (filtros.soloOfertas) n += 1;
    return n;
  }, [query, filtros, priceBounds]);

  const limpiarFiltros = () => {
    setQuery('');
    setFiltros({
      categoria: 'todas',
      precioMin: priceBounds.min,
      precioMax: priceBounds.max,
      modelos: [],
      ratingMin: 0,
      soloEnStock: false,
      colores: [],
      soloOfertas: false,
    });
    setOrden('relevancia');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <Badge variant="outline" className="mb-3">Catálogo demo</Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Catálogo</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            {filtrados.length} de {DEMO_PRODUCTS.length} productos · Precios en ARS · Desde {formatPriceARS(priceBounds.min)}
            {activeFilterCount > 0 && ` · ${activeFilterCount} filtro${activeFilterCount === 1 ? '' : 's'} activo${activeFilterCount === 1 ? '' : 's'}`}
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, descripción o modelo…"
            className="pl-9"
            aria-label="Buscar productos"
          />
        </div>

        {/* Botón colapsable solo en mobile */}
        <Button
          variant="outline"
          className="w-full lg:hidden"
          onClick={() => setFiltrosAbiertos((v) => !v)}
          aria-expanded={filtrosAbiertos}
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          {filtrosAbiertos ? 'Ocultar filtros' : 'Mostrar filtros'}
          {activeFilterCount > 0 && ` (${activeFilterCount})`}
          <ChevronDown className={cn('ml-2 h-4 w-4 transition-transform', filtrosAbiertos && 'rotate-180')} />
        </Button>

        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:items-start lg:gap-6">
          <aside
            className={cn(
              'rounded-xl border border-border bg-card p-4 md:p-5',
              filtrosAbiertos ? 'block' : 'hidden',
              'lg:block lg:sticky lg:top-24',
            )}
            aria-label="Filtros del catálogo"
          >
            <div className="mb-4 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <h2 className="font-bold">Filtros</h2>
            </div>
            <DemoFilters
              value={filtros}
              bounds={priceBounds}
              allModelos={allModelos}
              allColores={allColores}
              ofertasCount={ofertasCount}
              activeCount={activeFilterCount}
              onChange={setFiltros}
              onClear={limpiarFiltros}
            />
          </aside>

          <div className="mt-6 space-y-4 lg:mt-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground" role="status">
                Mostrando {filtrados.length} de {DEMO_PRODUCTS.length} productos
              </p>
              <div className="flex items-center gap-2">
                <Label htmlFor="orden" className="text-sm text-muted-foreground">Ordenar</Label>
                <Select value={orden} onValueChange={(v) => setOrden(v as DemoSort)}>
                  <SelectTrigger id="orden" className="w-[200px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevancia">Relevancia</SelectItem>
                    <SelectItem value="precio-asc">Precio: menor a mayor</SelectItem>
                    <SelectItem value="precio-desc">Precio: mayor a menor</SelectItem>
                    <SelectItem value="rating">Mejor valorados</SelectItem>
                    <SelectItem value="novedad">Novedades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div>
                <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
                  <X className="mr-1.5 h-4 w-4" />
                  Limpiar filtros ({activeFilterCount})
                </Button>
              </div>
            )}

            {filtrados.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6 xl:grid-cols-3 2xl:grid-cols-4">
                {filtrados.map((product) => (
                  <DemoProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-16 text-center">
                <Package className="mb-4 h-10 w-10 text-muted-foreground" />
                <p className="mb-1 text-lg font-bold">Sin resultados</p>
                <p className="mb-5 max-w-sm text-sm text-muted-foreground">
                  No encontramos productos con esos filtros. Probá con otra búsqueda o limpiá los filtros.
                </p>
                <Button variant="outline" onClick={limpiarFiltros}>
                  <X className="mr-1.5 h-4 w-4" />
                  Limpiar filtros
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function DemoCatalogSkeleton() {
  return (
    <MainLayout>
      <Skeleton className="h-9 w-1/3 mb-6" />
      <Skeleton className="h-[220px] w-full mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="w-full aspect-square" />
        ))}
      </div>
    </MainLayout>
  );
}

// ---------------------------------------------------------------------------
// Rama REAL (código existente, sin cambios: se usa cuando NO es demo)
// ---------------------------------------------------------------------------

const ITEMS_PER_PAGE = 8;

function CatalogPageContent() {
  const { products, isLoading: isLoadingProducts } = useProducts();
  const { carouselImages, isLoading: isLoadingCarousel } = useCarouselImages();

  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = Number(searchParams.get('page')) || 1;

  const plugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  const featuredProducts = useMemo(() => products.filter(p => p.featured), [products]);

  const allOtherProducts = useMemo(() => {
    return products
      .filter(p => !p.featured)
      .sort((a, b) => {
        if (a.is_new && !b.is_new) return -1;
        if (!a.is_new && b.is_new) return 1;
        return 0; // or any other secondary sort criteria
      });
  }, [products]);

  const totalPages = Math.ceil(allOtherProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    return allOtherProducts.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [allOtherProducts, currentPage]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    router.push(`?${params.toString()}`);
    const allProductsSection = document.getElementById('all-products-section');
    if (allProductsSection) {
      allProductsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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

  const isLoading = isLoadingProducts || isLoadingCarousel;

  if (isLoading) {
    return (
      <MainLayout noPaddingTop>
        <Skeleton className="h-48 w-full mb-8" />
        <Skeleton className="w-full aspect-[16/9] lg:aspect-[3/1] rounded-lg mb-12" />
        <div className="mb-12">
          <Skeleton className="h-9 w-1/4 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="w-full aspect-[3/5]" />
            ))}
          </div>
        </div>
        <div>
          <Skeleton className="h-9 w-1/3 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="w-full aspect-[3/5]" />
            ))}
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout noPaddingTop>
      {/* Message Banner */}
      <div className="relative mb-6">
        <div className="message-banner py-2 overflow-hidden absolute inset-x-0 w-full max-w-full">
          <div className="relative h-6 flex items-center justify-center">
            <div className="message-item absolute inset-0 flex items-center justify-center w-full">
              <span className="text-bright-white font-sf-pro font-medium text-xs md:text-sm text-center px-4 max-w-full truncate">
                GARANTIA DE 30 DIAS EN TODAS TUS COMPRAS
              </span>
            </div>
            <div className="message-item absolute inset-0 flex items-center justify-center w-full">
              <span className="text-bright-white font-sf-pro font-medium text-xs md:text-sm text-center px-4 max-w-full truncate">
                ENVIOS GRATIS EN FREYRE + 3 CUOTAS SIN INTERES + 20% OFF CON TRANSFERENCIA
              </span>
            </div>
            <div className="message-item absolute inset-0 flex items-center justify-center w-full">
              <span className="text-bright-white font-sf-pro font-medium text-xs md:text-sm text-center px-4 max-w-full truncate">
                ENVIOS EN EL DIA A SAN FRANCISCO Y FREYRE
              </span>
            </div>
          </div>
        </div>
        <div className="h-8"></div>
      </div>

      <WelcomeBanner />

      <div className="mb-12">
        <Carousel
            plugins={[plugin.current]}
            className="w-full"
        >
            <CarouselContent>
                {carouselImages.length > 0 ? carouselImages.map((image) => (
                  <CarouselItem key={image.id}>
                      <div className="relative aspect-[16/9] lg:aspect-[3/1] w-full overflow-hidden rounded-lg">
                      <Image
                          src={image.image_url}
                          alt={image.alt_text || 'Carousel image'}
                          fill
                          className="object-cover"
                          unoptimized={true}
                      />
                      {image.alt_text && (
                        <div className="absolute bottom-4 right-4 font-anton text-lg md:text-xl lg:text-2xl drop-shadow-lg text-shine">
                          {image.alt_text}
                        </div>
                      )}
                      </div>
                  </CarouselItem>
                  )) : (
                    <CarouselItem>
                      <div className="relative aspect-video lg:aspect-[3/1] w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                        <p className="text-muted-foreground">No hay imágenes en el carrusel.</p>
                      </div>
                    </CarouselItem>
                  )}
            </CarouselContent>
            <CarouselPrevious className="left-4 hidden sm:flex" />
            <CarouselNext className="right-4 hidden sm:flex" />
        </Carousel>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Destacados</h2>
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {featuredProducts.map((product) => (
              <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <ProductCard product={product} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4 hidden sm:flex" />
          <CarouselNext className="right-4 hidden sm:flex" />
        </Carousel>
      </div>

      <div id="all-products-section" className="scroll-mt-24">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Todos los Productos</h2>
        </div>
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
      </div>
    </MainLayout>
  );
}

function RealCatalogPage() {
  return (
    <Suspense fallback={
      <MainLayout noPaddingTop>
        <Skeleton className="h-48 w-full mb-8" />
        <Skeleton className="w-full aspect-[16/9] lg:aspect-[3/1] rounded-lg mb-12" />
        <div className="mb-12">
          <Skeleton className="h-9 w-1/4 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="w-full aspect-[3/5]" />
            ))}
          </div>
        </div>
        <div>
          <Skeleton className="h-9 w-1/3 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="w-full aspect-[3/5]" />
            ))}
          </div>
        </div>
      </MainLayout>
    }>
      <CatalogPageContent />
    </Suspense>
  );
}

export default function CatalogRoutePage() {
  if (!isDemoMode()) {
    return <RealCatalogPage />;
  }
  return (
    <Suspense fallback={<DemoCatalogSkeleton />}>
      <DemoCatalogContent />
    </Suspense>
  );
}
