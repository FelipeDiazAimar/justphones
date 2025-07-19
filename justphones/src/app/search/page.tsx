
"use client"

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { Analytics } from "@vercel/analytics/next";
import { useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/main-layout';
import type { Product } from '@/lib/products';
import { ProductCard } from '@/components/product-card';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useProducts } from '@/hooks/use-products';
import { Skeleton } from '@/components/ui/skeleton';
import { unslugify } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Search } from 'lucide-react';

const ITEMS_PER_PAGE = 12;

function SearchResultsPageContent() {
  const { products, isLoading } = useProducts();
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  
  const [currentPage, setCurrentPage] = useState(1);

  const filteredProducts = useMemo(() => {
    if (!query) return [];
    
    const lowercasedQuery = query.toLowerCase();
    
    return products.filter(product => 
      unslugify(product.name).toLowerCase().includes(lowercasedQuery) ||
      product.model.toLowerCase().includes(lowercasedQuery)
    );
  }, [query, products]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredProducts, currentPage]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-9 w-1/3" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
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
            <h1 className="text-4xl font-bold tracking-tight mb-4">Realiza una búsqueda</h1>
            <p className="text-xl text-muted-foreground mb-8">Utiliza la barra de búsqueda en el encabezado para encontrar productos.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div>
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Resultados de Búsqueda</h2>
          <p className="text-lg text-muted-foreground mt-1">
            Resultados para: <span className="text-primary font-semibold">"{query}"</span>
          </p>
        </div>
        
        {paginatedProducts.length > 0 ? (
          <>
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
          </>
        ) : (
          <div className="text-center py-20 col-span-full">
              <h1 className="text-4xl font-bold tracking-tight mb-4">Sin resultados</h1>
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
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
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
