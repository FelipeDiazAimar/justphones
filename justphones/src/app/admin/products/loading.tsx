import { Skeleton } from '@/components/ui/skeleton';

export default function AdminProductsLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header + acciones */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-40" />
      </div>
      {/* Barra de búsqueda / filtros */}
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-36" />
      </div>
      {/* Tabla de productos */}
      <div className="space-y-2 rounded-xl border p-4">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 shrink-0 rounded-lg" />
            <Skeleton className="h-10 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
