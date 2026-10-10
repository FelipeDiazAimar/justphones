import Link from "next/link";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DEMO_CATEGORIES,
  formatPriceARS,
  type DemoProduct,
} from "@/lib/demo";

/** Placeholder local ante fallo de carga de imagen remota. */
export const DEMO_IMAGE_PLACEHOLDER = "/icons/product-placeholder.svg";

/** % de descuento derivado de precio / precioOferta (0 si no hay oferta). */
export function discountPercent(product: DemoProduct): number {
  if (!product.precioOferta || product.precioOferta >= product.precio) {
    return 0;
  }
  return Math.round((1 - product.precioOferta / product.precio) * 100);
}

export function categoryLabel(slug: DemoProduct["categoria"]): string {
  return DEMO_CATEGORIES.find((c) => c.slug === slug)?.nombre ?? slug;
}

/**
 * Card solo-demo: renderiza DemoProduct (modelo en español) sin depender
 * de componentes que esperan el modelo real (name/price/discount/...).
 * Los campos se mapean al renderizar: nombre, precio/precioOferta en ARS,
 * stock, rating, modelos y colores.
 */
export function DemoProductCard({ product }: { product: DemoProduct }) {
  const off = discountPercent(product);
  const finalPrice = product.precioOferta ?? product.precio;
  const image = product.imagenes[0];
  const outOfStock = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 5;
  const visibleModels = product.modelos.slice(0, 2);
  const extraModels = product.modelos.length - visibleModels.length;
  const visibleColors = product.colores.slice(0, 3);
  const extraColors = product.colores.length - visibleColors.length;

  const stockTextClass = outOfStock
    ? "text-destructive"
    : lowStock
      ? "text-amber-600 dark:text-amber-400"
      : "text-emerald-600 dark:text-emerald-400";
  const stockDotClass = outOfStock
    ? "bg-destructive"
    : lowStock
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <Link
      href={`/product/${product.id}`}
      aria-label={`Ver ${product.nombre}`}
      className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {image ? (
          <img
            src={image}
            alt={product.nombre}
            loading="lazy"
            onError={(e) => {
              const el = e.currentTarget;
              if (el.src.endsWith(DEMO_IMAGE_PLACEHOLDER)) return;
              el.src = DEMO_IMAGE_PLACEHOLDER;
            }}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <img
            src={DEMO_IMAGE_PLACEHOLDER}
            alt={product.nombre}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {off > 0 && <Badge variant="destructive">-{off}% OFF</Badge>}
          {product.destacado && <Badge variant="secondary">Destacado</Badge>}
        </div>
        <div className="absolute right-2 top-2">
          <Badge variant="secondary" className="gap-1">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {product.rating.toFixed(1)}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3 md:p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {categoryLabel(product.categoria)}
        </p>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug md:text-base">
          {product.nombre}
        </h3>

        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-base font-bold text-primary md:text-lg">
            {formatPriceARS(finalPrice)}
          </span>
          {off > 0 && (
            <span className="text-xs text-muted-foreground line-through md:text-sm">
              {formatPriceARS(product.precio)}
            </span>
          )}
        </div>

        <p
          className={`flex items-center gap-1.5 text-xs font-medium ${stockTextClass}`}
        >
          <span className={`h-2 w-2 rounded-full ${stockDotClass}`} />
          {outOfStock
            ? "Sin stock"
            : lowStock
              ? `¡Solo quedan ${product.stock}!`
              : `En stock · ${product.stock} u.`}
        </p>

        <p className="line-clamp-1 text-xs text-muted-foreground">
          {visibleModels.join(" · ")}
          {extraModels > 0 ? ` · +${extraModels}` : ""}
        </p>

        <div className="mt-auto flex flex-wrap gap-1 pt-1">
          {visibleColors.map((color) => (
            <span
              key={color}
              className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
            >
              {color}
            </span>
          ))}
          {extraColors > 0 && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
              +{extraColors}
            </span>
          )}
        </div>
      </div>
    </article>
    </Link>
  );
}
