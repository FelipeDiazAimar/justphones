"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/main-layout';
import { MessageBanner } from '@/components/message-banner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DEMO_PRODUCTS, formatPriceARS } from '@/lib/demo';
import { PackageSearch, Search } from 'lucide-react';

const FALLBACK_IMG = '/Cover.png?v=3';

export default function ProductNotFound() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const sugeridos = (
    DEMO_PRODUCTS.filter((p) => p.destacado).length > 0
      ? DEMO_PRODUCTS.filter((p) => p.destacado)
      : DEMO_PRODUCTS
  ).slice(0, 4);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <MainLayout noPaddingTop>
      <MessageBanner />
      <div className="w-full max-w-6xl mx-auto px-4 py-10">
        <div className="text-center max-w-xl mx-auto">
          <PackageSearch className="mx-auto h-14 w-14 text-muted-foreground mb-4" />
          <Badge variant="secondary" className="mb-3">
            Demo
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">
            Producto no encontrado
          </h1>
          <p className="text-muted-foreground mt-3">
            El enlace puede estar roto o el producto ya no está disponible en la
            demo. Probá buscarlo o explorá estos destacados.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-6 flex gap-2"
            role="search"
          >
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar fundas, auriculares, cargadores…"
              aria-label="Buscar productos"
              className="flex-1"
            />
            <Button type="submit" className="shrink-0">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/catalog">Ver catálogo</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/">Volver al inicio</Link>
            </Button>
          </div>
        </div>

        {sugeridos.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-center">
              Productos destacados
            </h2>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Sugeridos de la demo
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sugeridos.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/product/${rel.id}`}
                  className="rounded-lg border p-3 hover:border-primary/60 transition-colors text-left"
                >
                  <div className="relative aspect-square overflow-hidden rounded-md mb-2 bg-muted">
                    <Image
                      src={rel.imagenes[0] ?? FALLBACK_IMG}
                      alt={rel.nombre}
                      fill
                      className="object-cover"
                      unoptimized={true}
                      onError={(e) => {
                        const t = e.currentTarget as HTMLImageElement;
                        if (!t.src.includes('Cover.png')) t.src = FALLBACK_IMG;
                      }}
                    />
                    {rel.precioOferta && rel.precioOferta < rel.precio && (
                      <Badge
                        variant="destructive"
                        className="absolute top-2 left-2 z-10"
                      >
                        OFERTA
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{rel.categoria}</p>
                  <p className="text-sm font-medium leading-tight mt-0.5">
                    {rel.nombre}
                  </p>
                  <p className="text-sm text-primary font-semibold mt-1">
                    {formatPriceARS(rel.precioOferta ?? rel.precio)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
