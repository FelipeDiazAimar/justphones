import { Skeleton } from '@/components/ui/skeleton';

export default function CatalogLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Carrusel / banner */}
      <Skeleton className="h-64 w-full rounded-xl md:h-80" />
      {/* Filtros */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 shrink-0 rounded-full" />
        ))}
      </div>
      {/* Grid de productos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
