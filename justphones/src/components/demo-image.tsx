"use client";

import { useEffect, useState } from "react";

const FALLBACK_SRC = "/icons/product-placeholder.svg";

interface DemoImageProps {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}

export function DemoImage({ src, alt, className, eager = false }: DemoImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setFailed(false);
  }, [src]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => {
        if (!failed) {
          setFailed(true);
          setCurrentSrc(FALLBACK_SRC);
        }
      }}
    />
  );
}

export default DemoImage;
