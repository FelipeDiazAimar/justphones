"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Tag, Truck, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DEMO_PRODUCTS,
  formatPriceARS,
  type DemoProduct,
} from "@/lib/demo";
import { discountPercent } from "@/app/catalog/_components/demo-product-card";
import { PRODUCT_PLACEHOLDER, imgToPlaceholder } from "./safe-img";

interface PromoSlide {
  id: string;
  badge: string;
  title: string;
  highlight: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  product: DemoProduct;
  priceNote: string;
}

function pickImage(product: DemoProduct | undefined, fallback: DemoProduct): string {
  return product?.imagenes[0] ?? fallback.imagenes[0] ?? PRODUCT_PLACEHOLDER;
}

/**
 * Carrusel de banners promocionales (ofertas / envíos / pagos).
 * - Autoplay cada 6s, pausa en hover/foco.
 * - Responsive: texto + imagen apilados en mobile, 2 columnas en md+.
 * - Imágenes SOLO de DEMO_PRODUCTS + onError → placeholder contractual.
 * - Sin dependencias nuevas (solo React + UI existente).
 */
export function PromoCarousel() {
  const slides: PromoSlide[] = useMemo(() => {
    const fallback = DEMO_PRODUCTS[0];
    const topOffer =
      [...DEMO_PRODUCTS].sort(
        (a, b) => discountPercent(b) - discountPercent(a),
      )[0] ?? fallback;
    const shipProduct =
      DEMO_PRODUCTS.find((p) => p.slug === "funda-silicona-premium-iphone") ??
      DEMO_PRODUCTS[1] ??
      fallback;
    const payProduct =
      DEMO_PRODUCTS.find((p) => p.slug === "auriculares-tws-pro") ??
      DEMO_PRODUCTS[4] ??
      fallback;
    const topOff = discountPercent(topOffer);

    return [
      {
        id: "ofertas",
        badge: topOff > 0 ? `Hasta -${topOff}% OFF` : "Ofertas",
        title: "Ofertas con",
        highlight: topOff > 0 ? `hasta -${topOff}% OFF` : "precios bajos",
        description: `${topOffer.nombre} y más seleccionados con descuento por tiempo limitado.`,
        ctaLabel: "Ver ofertas",
        ctaHref: "/catalog?oferta=1",
        product: topOffer,
        priceNote: formatPriceARS(topOffer.precioOferta ?? topOffer.precio),
      },
      {
        id: "envios",
        badge: "Envíos en el día",
        title: "Envíos en el día en",
        highlight: "San Francisco y Freyre",
        description:
          "Coordinamos por WhatsApp y al resto del país despachamos por correo.",
        ctaLabel: "Ver catálogo",
        ctaHref: "/catalog",
        product: shipProduct,
        priceNote: formatPriceARS(shipProduct.precioOferta ?? shipProduct.precio),
      },
      {
        id: "pagos",
        badge: "Pagá como quieras",
        title: "3 cuotas sin interés y",
        highlight: "20% OFF con transferencia",
        description:
          "Crédito, débito, transferencia o efectivo. Precios siempre en pesos.",
        ctaLabel: "Preguntas frecuentes",
        ctaHref: "/faq",
        product: payProduct,
        priceNote: formatPriceARS(payProduct.precioOferta ?? payProduct.precio),
      },
    ];
  }, []);

  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (i: number) => setIndex(((i % count) + count) % count),
    [count],
  );
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + count) % count),
    [count],
  );

  useEffect(() => {
    if (paused || count <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => clearInterval(t);
  }, [paused, count]);

  const icons = [Tag, Truck, Wallet];

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Promociones destacadas"
      className="relative overflow-hidden rounded-2xl border border-border bg-card"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, i) => {
          const Icon = icons[i % icons.length];
          return (
            <article
              key={slide.id}
              aria-label={`Promoción ${i + 1} de ${count}`}
              className="grid min-w-full grid-cols-1 md:grid-cols-2"
            >
              <div className="flex flex-col justify-center gap-4 p-6 sm:p-8 md:p-10">
                <Badge className="w-fit gap-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  {slide.badge}
                </Badge>
                <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
                  {slide.title}{" "}
                  <span className="text-primary">{slide.highlight}</span>
                </h2>
                <p className="text-sm text-muted-foreground sm:text-base">
                  {slide.description}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button asChild size="lg">
                    <Link href={slide.ctaHref}>{slide.ctaLabel}</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/catalog">Ver todo</Link>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Precios en ARS · Stock local · Garantía de 30 días
                </p>
              </div>
              <div className="relative h-52 bg-muted sm:h-64 md:h-auto md:min-h-[320px]">
                <img
                  src={pickImage(slide.product, DEMO_PRODUCTS[0])}
                  alt={slide.product.nombre}
                  loading={i === 0 ? "eager" : "lazy"}
                  onError={imgToPlaceholder}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent md:bg-gradient-to-r md:from-card md:via-transparent md:to-transparent"
                />
                <div className="absolute bottom-3 right-3 rounded-lg border border-border bg-card/95 px-3 py-1.5 text-sm font-bold text-primary shadow backdrop-blur dark:bg-card/90">
                  {slide.priceNote}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Controles anterior / siguiente */}
      <div className="absolute inset-y-0 left-2 flex items-center sm:left-3">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label="Promoción anterior"
          onClick={prev}
          className="rounded-full opacity-90 shadow hover:opacity-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>
      <div className="absolute inset-y-0 right-2 flex items-center sm:right-3">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label="Promoción siguiente"
          onClick={next}
          className="rounded-full opacity-90 shadow hover:opacity-100"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Indicadores */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 md:left-10 md:translate-x-0">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Ir a la promoción ${i + 1}: ${slide.badge}`}
            aria-current={i === index}
            className={`h-2 rounded-full transition-all ${
              i === index
                ? "w-6 bg-primary"
                : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
