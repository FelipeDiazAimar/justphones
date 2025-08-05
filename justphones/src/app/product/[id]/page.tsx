
"use client"

import React, { useState, useMemo, useEffect } from 'react';
import { Analytics } from "@vercel/analytics/next";
import { notFound, useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MainLayout } from '@/components/main-layout';
import type { Product, ProductColor } from '@/lib/products';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { cn, unslugify, expandModelString } from '@/lib/utils';
import { useProducts } from '@/hooks/use-products';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/hooks/use-cart';
import { Input } from '@/components/ui/input';
import { CartIcon } from '@/components/icons/cart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Store, Truck, MessageSquare, Landmark, CreditCard } from 'lucide-react';
import Aurora from '@/components/aurora';
import { createClient } from '@/lib/supabase/client';


export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const supabase = createClient();

  const { products, getProductById, isLoading: isLoadingProducts } = useProducts();
  const product = useMemo(() => (id ? getProductById(id) : undefined), [id, getProductById]);
  const { addToCart } = useCart();

  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [api, setApi] = useState<CarouselApi>()
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isViewingCoverImages, setIsViewingCoverImages] = useState(true);
  
  // Combinar imágenes de portada y de colores
  const allImages = useMemo(() => {
    if (!product) return [];
    
    const coverImages = product.coverImages && product.coverImages.length > 0 
      ? product.coverImages.map(img => ({ type: 'cover' as const, image: img, name: 'Portada' }))
      : [{ type: 'cover' as const, image: product.coverImage, name: 'Portada' }];
    
    const colorImages = product.colors.map(color => ({ 
      type: 'color' as const, 
      image: color.image || '/Cover.png?v=3', 
      name: color.name,
      hex: color.hex,
      stock: color.stock
    }));
    
    return [...coverImages, ...colorImages];
  }, [product]);
  
  useEffect(() => {
    const trackView = async () => {
        if (id) {
            const { error } = await supabase.rpc('increment_view', { p_product_id: id });
            if (error) {
                console.error('Error tracking product view:', error);
            }
        }
    };
    trackView();
  }, [id, supabase]);

  const compatibleProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p.name === product.name)
      .sort((a, b) => b.model.localeCompare(a.model, undefined, { numeric: true }));
  }, [product, products]);

  const handleModelChange = (selectedProductId: string) => {
    if (selectedProductId && selectedProductId !== product?.id) {
        router.push(`/product/${selectedProductId}`);
    }
  };

  useEffect(() => {
    if (product && product.colors.length > 0) {
      const initialColor = product.colors.find(c => c.stock > 0) || product.colors[0];
      setSelectedColor(initialColor);
      // Solo cambiar a vista de color si el usuario selecciona manualmente
      // Inicialmente mantenemos isViewingCoverImages = true para el auto-play
    }
  }, [product]);

  useEffect(() => {
    setQuantity(1);
  }, [selectedColor]);

  // Auto-play para el carousel
  useEffect(() => {
    if (!api || !product) return;
    
    let interval: NodeJS.Timeout;
    
    if (isViewingCoverImages) {
      // Auto-play para las cover images
      const coverImagesCount = product.coverImages?.length || 1;
      if (coverImagesCount > 1) {
        interval = setInterval(() => {
          const currentSnap = api.selectedScrollSnap();
          const nextIndex = (currentSnap + 1) % coverImagesCount;
          api.scrollTo(nextIndex);
        }, 3000);
      }
    } else {
      // Auto-play para todas las imágenes (cover + color)
      const totalImages = allImages.length;
      if (totalImages > 1) {
        interval = setInterval(() => {
          const currentSnap = api.selectedScrollSnap();
          const nextIndex = (currentSnap + 1) % totalImages;
          api.scrollTo(nextIndex);
        }, 3000);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [api, isViewingCoverImages, product, allImages]);

  // Manejar navegación manual a imagen de color
  useEffect(() => {
    if (!api || !selectedColor || !product) return;
    
    // Solo cambiar automáticamente si el usuario seleccionó un color manualmente
    // (no en la inicialización)
  }, [api, selectedColor, product]);

  useEffect(() => {
    if (!api || !product) return;

    const onSelect = () => {
      const newSelectedIndex = api.selectedScrollSnap();
      setSelectedIndex(newSelectedIndex);
      
      const coverImagesCount = product.coverImages?.length || 1;
      
      if (newSelectedIndex < coverImagesCount) {
        // Está viendo imágenes de portada
        setIsViewingCoverImages(true);
      } else {
        // Está viendo imágenes de colores
        setIsViewingCoverImages(false);
        const colorIndex = newSelectedIndex - coverImagesCount;
        if (product.colors[colorIndex]) {
          const newSelectedColor = product.colors[colorIndex];
          if (newSelectedColor && newSelectedColor.hex !== selectedColor?.hex) {
            setSelectedColor(newSelectedColor);
          }
        }
      }
    };

    api.on("select", onSelect);
    onSelect();
    
    return () => {
      api.off("select", onSelect);
    };
  }, [api, product, selectedColor]);

  const isLoading = isLoadingProducts || !id || !product;

  if (isLoading) {
    return (
        <MainLayout>
            <div className="max-w-xs sm:max-w-lg lg:max-w-6xl mx-auto px-4 lg:grid lg:grid-cols-2 lg:gap-12">
                <div>
                    <Skeleton className="w-full relative aspect-[3/5] rounded-lg mb-8" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-8 w-2/5" />
                    <Skeleton className="h-8 w-1/4 mt-2" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        </MainLayout>
    );
  }

  if (!product) {
    notFound();
  }

  if (!selectedColor) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          <h1 className="text-2xl">Cargando detalles del producto...</h1>
        </div>
      </MainLayout>
    )
  }
  
  const handleAddToCart = () => {
    if (product && selectedColor) {
      addToCart(product, selectedColor, Number(quantity) || 1);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
        setQuantity('');
        return;
    }
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
        return;
      <Analytics />
    }
    if (numValue > selectedColor.stock) {
        setQuantity(selectedColor.stock);
    } else {
        setQuantity(numValue);
    }
  }

  const handleQuantityBlur = () => {
      if (quantity === '' || quantity < 1) {
          setQuantity(1);
      }
  };
  
  const isSoldOut = selectedColor.stock === 0;
  
  const productName = unslugify(product.name);
  const hasDiscount = Boolean(product.discount && product.discount > 0);

  return (
    <MainLayout>
        <div className="max-w-xs sm:max-w-lg lg:max-w-6xl mx-auto px-4 lg:grid lg:grid-cols-2 lg:gap-12">
             <div className="block lg:hidden text-center mb-4">
                <h1 className="text-4xl font-bold tracking-tight">{productName}</h1>
                <p className="text-xl text-muted-foreground mt-1">{product.model}</p>
                <div className="mt-2 flex flex-col items-center">
                    {hasDiscount ? (
                        <div className="flex flex-col items-center">
                            <p className="text-3xl font-light text-primary">${(product.price * (1 - (product.discount ?? 0) / 100)).toLocaleString()}</p>
                            <p className="text-lg text-muted-foreground line-through">${product.price.toLocaleString()}</p>
                        </div>
                    ) : (
                        <p className="text-3xl font-light text-primary">${product.price.toLocaleString()}</p>
                    )}
                </div>
            </div>
            <div>
                <div className="w-full relative mb-4">
                    {hasDiscount && <Badge variant="destructive" className="absolute top-2 left-2 z-10">{product.discount}% OFF</Badge>}
                    <Carousel setApi={setApi} className="rounded-lg overflow-hidden">
                        <CarouselContent>
                            {allImages.map((imageData, index) => (
                                <CarouselItem key={index}>
                                    <div className="aspect-[3/5] relative">
                                        <Image
                                            src={imageData.image || '/Cover.png?v=3'}
                                            alt={`${product.name} - ${imageData.name}`}
                                            fill
                                            className="object-cover"
                                            data-ai-hint="phone case"
                                            unoptimized={true}
                                            />
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-4 hidden sm:flex" />
                        <CarouselNext className="right-4 hidden sm:flex" />
                    </Carousel>
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
                </div>

                <div className="flex justify-center gap-3 mb-8 lg:mb-0">
                    {allImages.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => api?.scrollTo(index)}
                            className={cn(
                                "h-2 w-2 rounded-full transition-all duration-300",
                                index === selectedIndex ? "bg-primary scale-125" : "bg-muted-foreground/50 hover:bg-muted-foreground"
                            )}
                            aria-label={`Ir a la imagen ${index + 1}`}
                        />
                    ))}
                </div>
            </div>

            <div>
                <div className="hidden lg:block text-left mb-4">
                    <h1 className="text-4xl font-bold tracking-tight">{productName}</h1>
                    <p className="text-xl text-muted-foreground mt-1">{product.model}</p>
                     <div className="mt-2 flex flex-col items-start">
                        {hasDiscount ? (
                            <div className="flex flex-col items-start">
                                <p className="text-3xl font-light text-primary">${(product.price * (1 - (product.discount ?? 0) / 100)).toLocaleString()}</p>
                                <p className="text-lg text-muted-foreground line-through">${product.price.toLocaleString()}</p>
                            </div>
                        ) : (
                            <p className="text-3xl font-light text-primary">${product.price.toLocaleString()}</p>
                        )}
                    </div>
                </div>

                <div className="w-full">
                    {compatibleProducts.length > 1 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-medium mb-2">Ver para otros modelos:</h3>
                            <Select onValueChange={handleModelChange} value={product.id}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecciona un modelo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {compatibleProducts.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.model}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="mb-6">
                        <h3 className="text-lg font-medium mb-2">Color: <span className="font-normal text-foreground">{selectedColor?.name}</span></h3>
                        <div className="flex items-center space-x-2">
                            {product.colors.map((color, index) => {
                                const coverImagesCount = product.coverImages?.length || 1;
                                const colorImageIndex = coverImagesCount + index;
                                
                                return (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setSelectedColor(color);
                                            setIsViewingCoverImages(false);
                                            api?.scrollTo(colorImageIndex);
                                        }}
                                        className={cn(
                                            "h-8 w-8 rounded-full border-2 transition-all",
                                            selectedColor?.hex === color.hex && !isViewingCoverImages 
                                                ? 'border-primary ring-2 ring-primary ring-offset-2' 
                                                : 'border-border',
                                            color.stock === 0 && 'opacity-50'
                                        )}
                                        style={{ backgroundColor: color.hex }}
                                        title={color.name}
                                        aria-label={`Select color ${color.name}`}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-2">Disponibilidad</h3>
                      <Badge variant={isSoldOut ? 'destructive' : 'secondary'}>
                        {isSoldOut ? 'Agotado' : 'En Stock'}
                      </Badge>
                      {!isSoldOut && (
                        <p className="text-sm text-muted-foreground mt-2">{selectedColor.stock} unidades disponibles.</p>
                      )}
                    </div>

                    {!isSoldOut && (
                        <div className="mb-6 flex items-center gap-4">
                            <h3 className="text-lg font-medium">Cantidad</h3>
                             <Input
                                type="number"
                                min="1"
                                max={selectedColor.stock}
                                value={quantity}
                                onChange={handleQuantityChange}
                                onBlur={handleQuantityBlur}
                                className="w-20"
                            />
                        </div>
                    )}

                    <div className="mt-8">
                        <Button size="lg" className="w-full text-lg py-6 relative overflow-hidden group" disabled={isSoldOut} onClick={handleAddToCart}>
                            <div className="absolute inset-0 z-0 opacity-40 transition-opacity duration-500 group-hover:opacity-70">
                                <Aurora />
                            </div>
                            <span className="relative z-10 flex items-center">
                                {isSoldOut ? 'Agotado' : 'Agregar al Carrito'}
                                {!isSoldOut && <CartIcon className="ml-2 h-5 w-5" />}
                            </span>
                        </Button>
                         <div className="mt-6 text-center">
                            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider">Medios de pago</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                                <div className="p-3 rounded-lg bg-card border">
                                    <Landmark className="mx-auto h-6 w-6 mb-1 text-primary" />
                                    <p>Efectivo o Transferencia</p>
                                    <p className="font-bold text-primary">20% OFF</p>
                                </div>
                                <div className="p-3 rounded-lg bg-card border">
                                    <CreditCard className="mx-auto h-6 w-6 mb-1 text-primary" />
                                    <p>Tarjeta de Débito</p>
                                    <p className="font-bold text-primary">10% OFF</p>
                                </div>
                                <div className="p-3 rounded-lg bg-card border">
                                    <CreditCard className="mx-auto h-6 w-6 mb-1 text-primary" />
                                    <p>Tarjeta de Crédito</p>
                                    <p className="font-bold text-primary">3 Cuotas sin interés</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 text-center">
                            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider">Métodos de envío</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                                <div className="p-3 rounded-lg bg-card border">
                                    <Store className="mx-auto h-6 w-6 mb-1 text-primary" />
                                    <p>Retiro en Freyre</p>
                                    <p className="font-bold text-primary">Gratis</p>
                                </div>
                                <div className="p-3 rounded-lg bg-card border">
                                    <Truck className="mx-auto h-6 w-6 mb-1 text-primary" />
                                    <p>Envío a domicilio</p>
                                    <p className="font-bold text-primary">Sin cargo (en Freyre)</p>
                                </div>
                                <div className="p-3 rounded-lg bg-card border">
                                    <MessageSquare className="mx-auto h-6 w-6 mb-1 text-primary" />
                                    <p>Coordinamos</p>
                                    <p className="font-bold text-primary">¡Contáctanos!</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 text-center text-sm text-muted-foreground">
                            <div className="flex items-center justify-center gap-2">
                                <MessageSquare className="h-4 w-4 text-primary" />
                                <span>¿Necesitas ayuda? <Link href="/contact" className="text-primary font-semibold hover:underline">Contáctanos</Link></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
      </div>
    </MainLayout>
  );
}
