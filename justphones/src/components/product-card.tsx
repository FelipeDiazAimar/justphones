
import Image from "next/image";
import Link from "next/link";
import {
  Card,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/products";
import { unslugify } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const productName = unslugify(product.name);
  const isSoldOut = product.colors.every(c => c.stock === 0);
  const firstAvailableColor = product.colors.find(c => c.stock > 0);
  const displayImage = product.coverImage || firstAvailableColor?.image || '/Cover.png?v=3';

  return (
    <Link href={`/product/${product.id}`} className="block group">
      <Card className="w-full overflow-hidden transition-all group-hover:shadow-lg group-hover:-translate-y-1 relative aspect-[3/5]">
        <Image
          src={displayImage}
          alt={product.name}
          fill
          className="object-cover"
          data-ai-hint="phone case"
        />

        {isSoldOut && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg z-10 pointer-events-none overflow-hidden">
                <div className="absolute w-[200%] h-8 bg-black transform -rotate-[55deg] flex items-center justify-center space-x-8 whitespace-nowrap">
                    <span className="text-white font-bold text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-xl tracking-widest">SOLD OUT</span>
                </div>
                <div className="absolute w-[200%] h-8 bg-black transform rotate-[55deg] flex items-center justify-center space-x-8 whitespace-nowrap">
                    <span className="text-white font-bold text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-xl tracking-widest">SOLD OUT</span>
                    <span className="text-white font-bold text-xl tracking-widest">SOLD OUT</span>
                </div>
            </div>
        )}

        {product.is_new && <Badge className="absolute top-2 left-2 z-10">Nuevo</Badge>}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        
        <div className="relative h-full flex flex-col justify-end items-center p-4 text-center text-primary-foreground">
          <h3 className="text-base font-medium leading-tight mb-2 text-balance">{productName}</h3>
          <div className="flex justify-center space-x-1.5 mb-2">
              {product.colors.map((color, index) => (
              <span
                  key={index}
                  className="block h-5 w-5 rounded-full border border-border"
                  style={{ backgroundColor: color.hex }}
                  title={color.hex}
              />
              ))}
          </div>
          <p className="text-xl font-bold text-primary">${product.price}</p>
        </div>
      </Card>
    </Link>
  );
}

    

