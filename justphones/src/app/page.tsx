"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  Banknote,
  CreditCard,
  Grip,
  Headphones,
  Landmark,
  MessageCircle,
  Package,
  Plug,
  ShieldCheck,
  Smartphone,
  Speaker,
  Sparkles,
  Star,
  Tag,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/main-layout";
import {
  DEMO_CATEGORIES,
  DEMO_PRODUCTS,
  formatPriceARS,
  isDemoMode,
  type DemoCategorySlug,
  type DemoProduct,
} from "@/lib/demo";
import {
  DemoProductCard,
  discountPercent,
} from "@/app/catalog/_components/demo-product-card";
import { PromoCarousel } from "./_components/promo-carousel";
import { SvgIcon, imgToPlaceholder } from "./_components/safe-img";

const CATEGORY_ICONS: Record<DemoCategorySlug, LucideIcon> = {
  fundas: Smartphone,
  auriculares: Headphones,
  cargadores: Plug,
  "vidrios-templados": ShieldCheck,
  soportes: Grip,
  parlantes: Speaker,
};

const BENEFITS: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Truck,
    title: "Envíos en el día",
    description: "San Francisco y Freyre; resto del país por correo.",
  },
  {
    icon: CreditCard,
    title: "Pagá como quieras",
    description: "3 cuotas sin interés, 20% OFF con transferencia.",
  },
  {
    icon: ShieldCheck,
    title: "Garantía de 30 días",
    description: "En todas tus compras, sin letra chica.",
  },
];

/** Medios de pago con iconos SVG propios (/icons/pay/*) + fallback lucide. */
const PAY_METHODS: { src: string; label: string; detail: string; fallback: ReactNode }[] = [
  {
    src: "/icons/pay/card.svg",
    label: "Tarjeta",
    detail: "3 cuotas sin interés",
    fallback: <CreditCard className="h-5 w-5" />,
  },
  {
    src: "/icons/pay/transfer.svg",
    label: "Transferencia",
    detail: "20% OFF acreditado",
    fallback: <Landmark className="h-5 w-5" />,
  },
  {
    src: "/icons/pay/cash.svg",
    label: "Efectivo",
    detail: "20% OFF en el local",
    fallback: <Banknote className="h-5 w-5" />,
  },
];

/** Mini-card propia por categoría: <img> + onError → placeholder contractual. */
function CategoryProductMini({ product }: { product: DemoProduct }) {
  const off = discountPercent(product);
  const finalPrice = product.precioOferta ?? product.precio;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="relative block h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
        <img
          src={product.imagenes[0]}
          alt={product.nombre}
          loading="lazy"
          onError={imgToPlaceholder}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {off > 0 && (
          <span className="absolute left-1 top-1 rounded-md bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
            -{off}%
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary">
          {product.nombre}
        </span>
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-bold text-primary">
            {formatPriceARS(finalPrice)}
          </span>
          {off > 0 && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPriceARS(product.precio)}
            </span>
          )}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          {product.rating.toFixed(1)}
          <span aria-hidden>·</span>
          {product.stock > 0 ? "En stock" : "Sin stock"}
        </span>
      </span>
    </Link>
  );
}

export default function HomePage() {
  const demo = isDemoMode();
  const destacados = DEMO_PRODUCTS.filter((p) => p.destacado);
  const ofertas = DEMO_PRODUCTS.filter((p) => discountPercent(p) > 0);
  const maxOff = Math.max(...DEMO_PRODUCTS.map((p) => discountPercent(p)));
  const minPrice = Math.min(
    ...DEMO_PRODUCTS.map((p) => p.precioOferta ?? p.precio),
  );

  const kpis: { src: string; alt: string; fallback: ReactNode; value: string; label: string }[] = [
    {
      src: "/icons/stats/products.svg",
      alt: "Icono de productos",
      fallback: <Package className="h-5 w-5" />,
      value: `${DEMO_PRODUCTS.length} productos`,
      label: "Stock local en San Francisco",
    },
    {
      src: "/icons/pay/discount.svg",
      alt: "Icono de descuentos",
      fallback: <BadgePercent className="h-5 w-5" />,
      value: maxOff > 0 ? `Hasta -${maxOff}% OFF` : "Ofertas",
      label: `${ofertas.length} productos en oferta`,
    },
    {
      src: "/icons/stats/price.svg",
      alt: "Icono de precios",
      fallback: <Tag className="h-5 w-5" />,
      value: `Desde ${formatPriceARS(minPrice)}`,
      label: "Precios en pesos argentinos",
    },
    {
      src: "/icons/shipping.svg",
      alt: "Icono de envíos",
      fallback: <Truck className="h-5 w-5" />,
      value: "Envío en el día",
      label: "San Francisco y Freyre",
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-10 md:space-y-14">
        {/* Encabezado */}
        <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/15 via-card to-background p-6 md:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
          />
          <div className="relative max-w-2xl">
            <Badge className="mb-4 gap-1">
              <Sparkles className="h-3 w-3" />
              Tienda demo · Portfolio
            </Badge>
            <h1 className="mb-4 text-3xl font-extrabold tracking-tight md:text-5xl">
              Todo para tu teléfono,{" "}
              <span className="text-primary">en un solo lugar</span>
            </h1>
            <p className="mb-6 text-base text-muted-foreground md:text-lg">
              Fundas, auriculares, cargadores y vidrios templados con stock
              local, garantía de 30 días y pago flexible.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/catalog">
                  Ver catálogo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/catalog?oferta=1">
                  <Tag className="mr-2 h-4 w-4" />
                  Ver ofertas
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Carrusel promocional: ofertas / envíos / pagos */}
        <PromoCarousel />

        {/* KPIs con iconos SVG propios */}
        <section aria-label="La tienda en números">
          <div className="mb-5">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              La tienda en números
            </h2>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">
              Stock real, precios en ARS y ofertas vigentes.
            </p>
          </div>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <div
                key={kpi.value}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
              >
                <SvgIcon src={kpi.src} alt={kpi.alt} fallback={kpi.fallback} />
                <div className="min-w-0">
                  <dt className="sr-only">{kpi.label}</dt>
                  <dd className="truncate text-base font-bold">{kpi.value}</dd>
                  <dd className="text-xs text-muted-foreground">{kpi.label}</dd>
                </div>
              </div>
            ))}
          </dl>
        </section>

        {demo ? (
          <>
            {/* Destacados (usa DemoProductCard del scope de catálogo) */}
            <section aria-label="Productos destacados">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Destacados
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground md:text-base">
                    Los favoritos de nuestros clientes.
                  </p>
                </div>
                <Button asChild variant="ghost" className="hidden sm:inline-flex">
                  <Link href="/catalog">
                    Ver todo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              {destacados.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
                  {destacados.map((product) => (
                    <DemoProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay productos destacados por el momento.
                </p>
              )}
              <div className="mt-6 text-center sm:hidden">
                <Button asChild variant="outline">
                  <Link href="/catalog">
                    Ver catálogo completo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </section>

            {/* Explorá por categoría */}
            <section aria-label="Explorar por categoría">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Explorá por categoría
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground md:text-base">
                    Encontrá justo lo que tu equipo necesita.
                  </p>
                </div>
                <Button asChild variant="ghost" className="hidden sm:inline-flex">
                  <Link href="/catalog">
                    Ver todo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {DEMO_CATEGORIES.map((cat) => {
                  const count = DEMO_PRODUCTS.filter(
                    (p) => p.categoria === cat.slug,
                  ).length;
                  const Icon = CATEGORY_ICONS[cat.slug];
                  return (
                    <Link
                      key={cat.slug}
                      href={`/catalog?categoria=${cat.slug}`}
                      className="group rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/15">
                          <Icon className="h-5 w-5" />
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                      </div>
                      <h3 className="mb-1 text-lg font-bold">{cat.nombre}</h3>
                      <p className="mb-3 text-sm text-muted-foreground">
                        {cat.descripcion}
                      </p>
                      <Badge variant="secondary">
                        {count} producto{count === 1 ? "" : "s"}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* Una sección con productos por cada categoría */}
            {DEMO_CATEGORIES.map((cat) => {
              const items = DEMO_PRODUCTS.filter(
                (p) => p.categoria === cat.slug,
              ).slice(0, 4);
              if (items.length === 0) return null;
              const Icon = CATEGORY_ICONS[cat.slug];
              return (
                <section
                  key={cat.slug}
                  aria-label={`Productos de ${cat.nombre}`}
                >
                  <div className="mb-5 flex items-end justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/15">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <h2 className="text-xl font-bold tracking-tight md:text-2xl">
                          {cat.nombre}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Selección para vos.
                        </p>
                      </div>
                    </div>
                    <Button
                      asChild
                      variant="ghost"
                      className="hidden sm:inline-flex"
                    >
                      <Link href={`/catalog?categoria=${cat.slug}`}>
                        Ver más
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {items.map((product) => (
                      <CategoryProductMini key={product.id} product={product} />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        ) : (
          <section className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              El catálogo completo está disponible con datos en vivo.
            </p>
            <Button asChild>
              <Link href="/catalog">
                Ver catálogo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </section>
        )}

        {/* Beneficios */}
        <section aria-label="Beneficios">
          <div className="mb-5">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Comprá tranquilo
            </h2>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">
              Beneficios en todas tus compras.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-xl border border-border bg-card p-5"
              >
                <benefit.icon className="mb-3 h-7 w-7 text-primary" />
                <h3 className="mb-1 font-bold">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
          {/* Medios de pago con SVG propios */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {PAY_METHODS.map((pay) => (
              <div
                key={pay.label}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
              >
                <SvgIcon
                  src={pay.src}
                  alt={`Icono de pago: ${pay.label}`}
                  fallback={pay.fallback}
                />
                <div>
                  <p className="text-sm font-bold">{pay.label}</p>
                  <p className="text-xs text-muted-foreground">{pay.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cierre / contacto */}
        <section className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
          <div>
            <h2 className="text-xl font-bold tracking-tight md:text-2xl">
              ¿No encontrás funda para tu modelo?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">
              Escribinos y la conseguimos en pocos días.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/contact">
                <MessageCircle className="mr-2 h-4 w-4" />
                Contactanos
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/faq">Preguntas frecuentes</Link>
            </Button>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
