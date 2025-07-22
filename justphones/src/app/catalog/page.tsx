
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
import { useCarouselImages } from '@/hooks/use-carousel-images';

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
      <MainLayout>
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
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="w-full aspect-[3/5]" />
            ))}
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
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
        <h2 className="text-3xl font-bold tracking-tight mb-6">Destacados</h2>
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
          <h2 className="text-3xl font-bold tracking-tight">Todos los Productos</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
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

export default function CatalogPage() {
  return (
    <Suspense fallback={
      <MainLayout>
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
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
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
