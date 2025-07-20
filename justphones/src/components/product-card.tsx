
import Image from "next/image";
import Link from "next/link";
import {
  Card,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/products";
import { cn, unslugify } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const productName = unslugify(product.name);
  const isSoldOut = product.colors.every(c => c.stock === 0);
  const firstAvailableColor = product.colors.find(c => c.stock > 0);
  const displayImage = product.coverImage || firstAvailableColor?.image || '/Cover.png?v=3';
  const showMarquee = product.model.length > 17;
  const animationDuration = showMarquee ? `${product.model.length / 5}s` : undefined;

  const hasDiscount = product.discount && product.discount > 0;
  
  return (
    <Link href={`/product/${product.id}`} className="block group">
      <Card className="w-full overflow-hidden transition-all group-hover:shadow-lg group-hover:-translate-y-1 relative aspect-[3/5]">
        <Image
          src={displayImage}
          alt={product.name}
          fill
          className="object-cover"
          data-ai-hint="phone case"
          unoptimized={true}
        />

        {isSoldOut && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg z-10 pointer-events-none overflow-hidden">
                <div className="absolute w-[200%] h-8 bg-black transform -rotate-[55deg] flex items-center justify-center space-x-8 whitespace-nowrap">
                    <span className="text-white font-bold text-xl tracking-widest">AGOTADO</span>
                    <span className="text-white font-bold text-xl tracking-widest">AGOTADO</span>
                    <span className="text-white font-bold text-xl tracking-widest">AGOTADO</span>
                </div>
                <div className="absolute w-[200%] h-8 bg-black transform rotate-[55deg] flex items-center justify-center space-x-8 whitespace-nowrap">
                    <span className="text-white font-bold text-xl tracking-widest">AGOTADO</span>
                    <span className="text-white font-bold text-xl tracking-widest">AGOTADO</span>
                    <span className="text-white font-bold text-xl tracking-widest">AGOTADO</span>
                </div>
            </div>
        )}

        {hasDiscount && <Badge variant="destructive" className="absolute top-2 left-2 z-10">{product.discount}% OFF</Badge>}
        {product.is_new && <Badge className="absolute top-2 right-2 z-10">Nuevo</Badge>}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        
        <div className={cn(
          "relative h-full flex flex-col items-center justify-end px-4 pt-4",
           hasDiscount ? "pb-4" : "pb-11"
        )}>
          <h3 className="text-base font-medium leading-tight mb-1 text-balance">{productName}</h3>
          <div className="flex justify-center space-x-1.5">
              {product.colors.map((color, index) => (
              <span
                  key={index}
                  className="block h-5 w-5 rounded-full border border-border"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
              />
              ))}
          </div>
          <div className="flex flex-col items-center justify-center min-h-[40px]">
            {hasDiscount ? (
              <>
                <p className="text-lg font-bold text-primary">${(product.price * (1 - (product.discount ?? 0) / 100)).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground line-through">${product.price.toLocaleString()}</p>
              </>
            ) : (
                <p className="text-lg font-bold text-primary">${product.price.toLocaleString()}</p>
            )}
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
