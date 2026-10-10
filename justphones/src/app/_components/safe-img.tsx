"use client";

import { useState, type ReactNode, type SyntheticEvent } from "react";

/**
 * Placeholder contractual de imágenes.
 * Otro agente crea `public/icons/*` en paralelo: se referencia igual
 * y cada <img> usa estos handlers como fallback (onError).
 */
export const PRODUCT_PLACEHOLDER = "/icons/product-placeholder.svg";

/** Fallback para fotos de producto → placeholder contractual (sin loops). */
export function imgToPlaceholder(e: SyntheticEvent<HTMLImageElement>) {
  const el = e.currentTarget;
  if (el.dataset.fallbackApplied) return;
  el.dataset.fallbackApplied = "1";
  el.src = PRODUCT_PLACEHOLDER;
}

/** Fallback para iconos SVG propios → oculta el <img> y revela el icono lucide. */
export function hideBrokenImg(e: SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = "none";
}

interface SvgIconProps {
  src: string;
  alt: string;
  fallback: ReactNode;
}

/**
 * Icono SVG propio vía `/icons/...` con fallback a lucide si el archivo
 * aún no existe (se crea en paralelo por otro agente).
 */
export function SvgIcon({ src, alt, fallback }: SvgIconProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <span className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary dark:bg-primary/15">
      {!loaded && (
        <span className="flex items-center justify-center [&_svg]:h-5 [&_svg]:w-5">
          {fallback}
        </span>
      )}
      {/* Al cargar, tapa al fallback. Si falla, se oculta y queda el fallback. */}
      {!failed && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={(e) => {
            hideBrokenImg(e);
            setFailed(true);
          }}
          className="absolute inset-0 h-full w-full object-contain p-2"
        />
      )}
    </span>
  );
}
