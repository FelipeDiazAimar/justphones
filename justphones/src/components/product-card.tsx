
import Image from "next/image";
import Link from "next/link";
import {
  Card,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import type { Product } from "@/lib/products";
import { cn, unslugify } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Loader } from "@/components/loader";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const productName = unslugify(product.name);
  const isSoldOut = product.colors.every(c => c.stock === 0);
  const firstAvailableColor = product.colors.find(c => c.stock > 0);
  const displayImage = product.coverImage || firstAvailableColor?.image || '/Cover.png?v=3';
  
  // Preparar las imágenes del carousel: imagen principal + imágenes extras
  const carouselImages = [
    displayImage, // Imagen principal (coverImage o primera disponible)
    ...(product.coverImages && product.coverImages.length > 0 ? product.coverImages : [])
  ].filter((img, index, arr) => arr.indexOf(img) === index); // Eliminar duplicados
    
  const showMarquee = product.model.length > 17;
  const animationDuration = showMarquee ? `${product.model.length / 5}s` : undefined;

  const hasDiscount = product.discount && product.discount > 0;
  const [api, setApi] = useState<CarouselApi>();
  const [loaded, setLoaded] = useState<boolean[]>(() => Array(carouselImages.length).fill(false));
  const [singleLoaded, setSingleLoaded] = useState<boolean>(false);

  // Reset loaded states if the image list changes
  useEffect(() => {
    setLoaded(Array(carouselImages.length).fill(false));
    setSingleLoaded(false);
  }, [carouselImages.length]);

  // Lógica de precios:
  // 1. Aplicar primero el descuento propio del producto (si existe)
  // 2. Aplicar luego el 20% de descuento por EFECTIVO/TRANSFERENCIA
  const productDiscountPercent = product.discount ? product.discount : 0;
  const cashDiscountPercent = 20;
  const basePrice = product.price;
  const priceAfterProductDiscount = basePrice * (1 - productDiscountPercent / 100);
  const finalCashPrice = priceAfterProductDiscount * (1 - cashDiscountPercent / 100);

  // Auto-play solo para cover images
  useEffect(() => {
    if (!api || carouselImages.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      const current = api.selectedScrollSnap();
      const next = (current + 1) % carouselImages.length;
      api.scrollTo(next);
    }, 3000);

    return () => clearInterval(interval);
  }, [api, carouselImages.length]);
  
  return (
    <Link href={`/product/${product.id}`} className="block group">
      <Card className="w-full overflow-hidden transition-all group-hover:shadow-lg group-hover:-translate-y-1 relative aspect-[3/5]">
        {carouselImages.length > 1 ? (
          <Carousel setApi={setApi} className="w-full h-full">
            <CarouselContent>
              {carouselImages.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="relative w-full h-full aspect-[3/5]">
                    <Image
                      src={image}
                      alt={product.name}
                      fill
                      className="object-cover"
                      data-ai-hint="phone case"
                      unoptimized={true}
                      onLoad={() =>
                        setLoaded((prev) => {
                          const next = [...prev];
                          next[index] = true;
                          return next;
                        })
                      }
                    />
                    {!loaded[index] && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                        <Loader />
                      </div>
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
          <div className="relative w-full h-full">
            <Image
              src={displayImage}
              alt={product.name}
              fill
              className="object-cover"
              data-ai-hint="phone case"
              unoptimized={true}
              onLoad={() => setSingleLoaded(true)}
            />
            {!singleLoaded && (
              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                <Loader />
              </div>
            )}
          </div>
        )}

        {isSoldOut && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg z-10 pointer-events-none overflow-hidden">
                <div className="absolute w-[300%] h-6 md:h-8 bg-black transform -rotate-[55deg] flex items-center justify-center space-x-8 whitespace-nowrap">
                    <span className="text-white font-bold text-lg md:text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-lg md:text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-lg md:text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-lg md:text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-lg md:text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-lg md:text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-lg md:text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-lg md:text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-lg md:text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-lg md:text-xl tracking-widest">SOLD OUT</span>
                </div>
                <div className="absolute w-[300%] h-6 md:h-8 bg-black transform rotate-[55deg] flex items-center justify-center space-x-8 whitespace-nowrap">
                    <span className="text-white font-bold text-lg md:text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-lg md:text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-lg md:text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-lg md:text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-lg md:text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-lg md:text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-lg md:text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-lg md:text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-lg md:text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-lg md:text-xl tracking-widest">SOLD OUT</span>
                </div>
            </div>
        )}

                {product.discount && product.discount > 0 && (
          <div className="absolute top-[50px] md:top-16 left-[16px] z-20 transform -rotate-90 origin-left">
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 whitespace-nowrap">
              {product.discount}% OFF
            </Badge>
          </div>
        )}
        {product.is_new && <Badge className="absolute top-2 right-2 z-10">Nuevo</Badge>}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        
        <div className={cn(
          "absolute h-full flex flex-col items-center justify-end px-4 pt-4 z-20 inset-0",
           !hasDiscount ? "pb-3" : "pb-2"
        )}>
          <h3 className="text-sm md:text-base font-medium leading-tight mb-1 text-balance text-center text-white">{productName}</h3>
          <div className="flex justify-center space-x-1.5 mb-2">
              {product.colors.map((color, index) => (
              <span
                  key={index}
                  className="block h-4 w-4 md:h-5 md:w-5 rounded-full border border-white/70"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
              />
              ))}
          </div>
          <div className="flex flex-col items-center justify-center min-h-[40px]">
            <div className="flex flex-col items-center">
              <p className="text-base md:text-lg font-bold text-primary">
                ${finalCashPrice.toLocaleString()}
              </p>
              <span className="mt-0.5 text-[8px] md:text-[10px] font-semibold text-orange-500 tracking-tight">EF/TRANSF 20% OFF</span>
            </div>
            <p className="mt-1 text-xs md:text-sm text-white/60 line-through">
              ${priceAfterProductDiscount.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 bg-black/70 text-white font-semibold px-1 py-1 md:py-1 rounded-b-lg w-[90px] md:w-[130px] overflow-hidden">
          {showMarquee ? (
              <div className="w-max flex animate-marquee hover:pause" style={{ animationDuration }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <span key={i} className="mx-4 whitespace-nowrap text-[9px] md:text-xs">{product.model}</span>
                  ))}
              </div>
          ) : (
              <div className="text-center whitespace-nowrap text-[9px] md:text-xs">{product.model}</div>
          )}
        </div>
      </Card>
    </Link>
  );
}
