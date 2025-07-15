
"use client"

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/main-layout';
import type { Product } from '@/lib/products';
import { ProductCard } from '@/components/product-card';
import { ProductFilters } from '@/components/product-filters';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useProducts } from '@/hooks/use-products';
import { Skeleton } from '@/components/ui/skeleton';
import { unslugify, expandModelString } from '@/lib/utils';
import { useSubcategories } from '@/hooks/use-subcategories';

const ITEMS_PER_PAGE = 9;

function AuricularesCatalogPageContent() {
  const { products, isLoading } = useProducts();
  const { subcategories, isLoading: isLoadingSubcategories } = useSubcategories();
  const searchParams = useSearchParams();
  const subCategoryParam = searchParams.get('subCategory');
  const searchQuery = searchParams.get('q');
  
  const [filters, setFilters] = useState({
    colors: [] as string[],
    models: [] as string[],
    priceRange: [0, 100000],
    sortBy: 'name-asc',
    subCategories: [] as string[],
  });
  const [currentPage, setCurrentPage] = useState(1);

  const auricularesProducts = useMemo(() => {
    return products.filter(p => p.category === 'auriculares');
  }, [products]);

  React.useEffect(() => {
    if (auricularesProducts.length > 0 && filters.priceRange[1] === 100000) {
      const prices = auricularesProducts.map(p => p.price);
      const minPrice = Math.floor(Math.min(...prices));
      const maxPrice = Math.ceil(Math.max(...prices));
      setFilters(f => ({ ...f, priceRange: [minPrice, maxPrice > minPrice ? maxPrice : minPrice + 1] }));
    }
  }, [auricularesProducts, filters.priceRange]);
  
  useEffect(() => {
    if (subCategoryParam) {
      setFilters(f => ({ ...f, subCategories: [subCategoryParam] }));
    } else {
      setFilters(f => ({ ...f, subCategories: [] }));
    }
  }, [subCategoryParam]);

  const filteredProducts = useMemo(() => {
    let filtered = auricularesProducts.filter(product => {
      const inSubCategory = filters.subCategories.length === 0 || filters.subCategories.includes(product.name);
      const inColor = filters.colors.length === 0 || product.colors.some(c => filters.colors.includes(c.hex));
      const inModel = filters.models.length === 0 || expandModelString(product.model).some(productModel => filters.models.includes(productModel));
      const inPrice = product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1];
      const inSearch = !searchQuery || unslugify(product.name).toLowerCase().includes(searchQuery.toLowerCase()) || product.model.toLowerCase().includes(searchQuery.toLowerCase());
      return inSubCategory && inColor && inModel && inPrice && inSearch;
    });

    switch (filters.sortBy) {
        case 'price-asc':
            filtered.sort((a, b) => a.price - a.price);
            break;
        case 'price-desc':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'name-asc':
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            filtered.sort((a, b) => b.name.localeCompare(a.name));
            break;
    }

    return filtered;
  }, [filters, auricularesProducts, searchQuery]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters, subCategoryParam, searchQuery]);

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

  const titleComponent = filters.subCategories.length === 1 ? (
    <>
      <span className='capitalize'>{unslugify(filters.subCategories[0])}</span>
    </>
  ) : (
    <>
      Todos los <span className="text-primary">Auriculares</span>
    </>
  );

  if (isLoading || isLoadingSubcategories) {
    return (
      <MainLayout>
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-9 w-1/3" />
          <Skeleton className="h-10 w-10 rounded-full lg:hidden" />
        </div>
        <div className="grid grid-cols-12 gap-8">
          <div className="hidden lg:block lg:col-span-3">
            <Skeleton className="h-[600px] w-full" />
          </div>
          <div className="col-span-12 lg:col-span-9">
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="w-full aspect-[3/5]" />
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div>
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight">{titleComponent}</h2>
           {searchQuery && (
              <p className="text-lg text-muted-foreground mt-1">
                  Resultados para: <span className="text-primary font-semibold">"{searchQuery}"</span>
              </p>
          )}
        </div>
        <div className="flex justify-end mb-4 lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full animate-pulse">
                <Filter className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader className="sr-only">
                <SheetTitle>Filtros</SheetTitle>
                <SheetDescription>Filtra los productos para encontrar lo que buscas.</SheetDescription>
              </SheetHeader>
              <ProductFilters filters={filters} setFilters={setFilters} products={auricularesProducts} showSubCategoryFilter={true} subCategoryList={subcategories.auriculares} />
            </SheetContent>
          </Sheet>
        </div>
        <div className="grid grid-cols-12 gap-8">
          <ProductFilters filters={filters} setFilters={setFilters} products={auricularesProducts} showSubCategoryFilter={true} subCategoryList={subcategories.auriculares} className="hidden lg:block lg:col-span-3" />
          <div className="col-span-12 lg:col-span-9">
             {paginatedProducts.length > 0 ? (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedProducts.map((product: Product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
                </div>
            ) : (
                <div className="text-center py-20 col-span-full">
                    <p className="text-lg text-muted-foreground">No hay productos que coincidan con los filtros seleccionados.</p>
                </div>
            )}
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
        </div>
      </div>
    </MainLayout>
  );
}

export default function AuricularesCatalogPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full" />
            ))}
          </div>
        </div>
      </MainLayout>
    }>
      <AuricularesCatalogPageContent />
    </Suspense>
  );
}
