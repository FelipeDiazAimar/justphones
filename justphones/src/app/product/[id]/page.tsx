
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
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { CartIcon } from '@/components/icons/cart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Store, Truck, MessageSquare, Landmark, CreditCard } from 'lucide-react';
import Aurora from '@/components/aurora';
import { createClient } from '@/lib/supabase/client';
import { MessageBanner } from '@/components/message-banner';
import {
  DEMO_PRODUCTS,
  formatPriceARS,
  isDemoMode,
  whatsappCheckoutUrl,
} from '@/lib/demo';
import type { DemoCheckoutItem } from '@/lib/demo';

type DemoCartItem = {
  key: string;
  id: string;
  slug: string;
  nombre: string;
  precio: number;
  modelo: string;
  color: string;
  cantidad: number;
  imagen: string;
};

const DEMO_CART_KEY = 'justphones-demo-cart-v1';

function readDemoCart(): DemoCartItem[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(DEMO_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is DemoCartItem =>
        !!item &&
        typeof item.key === 'string' &&
        typeof item.nombre === 'string' &&
        typeof item.precio === 'number' &&
        typeof item.cantidad === 'number',
    );
  } catch {
    return [];
  }
}

function writeDemoCart(items: DemoCartItem[]) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(DEMO_CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('demo-cart-updated'));
  } catch {
    // localStorage no disponible: el carrito demo solo vive en memoria de la sesión
  }
}


export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const supabase = createClient();

  const { products, getProductById, isLoading: isLoadingProducts } = useProducts();
  const product = useMemo(() => (id ? getProductById(id) : undefined), [id, getProductById]);
  const { addToCart } = useCart();
  const { toast } = useToast();

  // ---- Rama demo (contrato solo lectura: src/lib/demo.ts) ----
  // En modo demo la fuente de datos es DEMO_PRODUCTS (campos en español) y el
  // carrito demo persiste en localStorage con DEMO_CART_KEY (misma clave que
  // lee src/components/cart-sheet.tsx). No se toca src/lib.
  const demoMode = isDemoMode();
  const demoProduct = useMemo(
    () => (id ? DEMO_PRODUCTS.find((p) => p.id === id || p.slug === id) : undefined),
    [id],
  );
  const [demoModelo, setDemoModelo] = useState<string>('');
  const [demoColor, setDemoColor] = useState<string>('');
  const [demoQuantity, setDemoQuantity] = useState<number>(1);
  const [demoImageIndex, setDemoImageIndex] = useState<number>(0);

  useEffect(() => {
    if (demoProduct) {
      setDemoModelo(demoProduct.modelos[0] ?? '');
      setDemoColor(demoProduct.colores[0] ?? '');
      setDemoQuantity(1);
      setDemoImageIndex(0);
    }
  }, [demoProduct]);

  const demoPrecioEfectivo = demoProduct
    ? (demoProduct.precioOferta ?? demoProduct.precio)
    : 0;
  const demoTieneOferta = !!demoProduct && !!demoProduct.precioOferta && demoProduct.precioOferta < demoProduct.precio;
  const demoDescuentoPct = demoTieneOferta && demoProduct
    ? Math.round((1 - (demoProduct.precioOferta ?? demoProduct.precio) / demoProduct.precio) * 100)
    : 0;
  const demoAgotado = (demoProduct?.stock ?? 0) <= 0;
  const demoRelacionados = useMemo(() => {
    if (!demoProduct) return [];
    return DEMO_PRODUCTS.filter(
      (p) => p.id !== demoProduct.id && p.categoria === demoProduct.categoria,
    ).slice(0, 4);
  }, [demoProduct]);

  const handleDemoAddToCart = () => {
    if (!demoProduct || demoAgotado) return;
    const cantidad = Math.max(1, Math.min(Math.floor(demoQuantity) || 1, demoProduct.stock));
    const key = `${demoProduct.id}|${demoModelo}|${demoColor}`;
    const items = readDemoCart();
    const existente = items.find((item) => item.key === key);
    if (existente) {
      const nuevaCantidad = Math.min(existente.cantidad + cantidad, demoProduct.stock);
      writeDemoCart(
        items.map((item) => (item.key === key ? { ...item, cantidad: nuevaCantidad } : item)),
      );
    } else {
      writeDemoCart([
        ...items,
        {
          key,
          id: demoProduct.id,
          slug: demoProduct.slug,
          nombre: demoProduct.nombre,
          precio: demoPrecioEfectivo,
          modelo: demoModelo,
          color: demoColor,
          cantidad,
          imagen: demoProduct.imagenes[0] ?? '/Cover.png?v=3',
        },
      ]);
    }
    toast({
      variant: 'success',
      title: '¡Producto agregado!',
      description: `${demoProduct.nombre} (${demoColor}) se agregó al carrito.`,
    });
  };

  const demoCheckoutUrl = demoProduct
    ? whatsappCheckoutUrl(
        [
          {
            nombre: demoProduct.nombre,
            cantidad: Math.max(1, Math.min(Math.floor(demoQuantity) || 1, demoProduct.stock)),
            precio: demoPrecioEfectivo,
            modelo: demoModelo || undefined,
            color: demoColor || undefined,
          } satisfies DemoCheckoutItem,
        ],
      )
    : '';

  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [api, setApi] = useState<CarouselApi>()
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isViewingCoverImages, setIsViewingCoverImages] = useState(true);
  const [hasUserSelectedColor, setHasUserSelectedColor] = useState(false);
  
  // Combinar imágenes de portada y de colores
  const allImages = useMemo(() => {
    if (!product) return [];
    
    // Incluir imagen principal y las extras
    const coverImages = [];
    
    // Agregar imagen principal
    if (product.coverImage) {
      coverImages.push({ type: 'cover' as const, image: product.coverImage, name: 'Portada' });
    }
    
    // Agregar imágenes extras
    if (product.coverImages && product.coverImages.length > 0) {
      product.coverImages.forEach(img => {
        coverImages.push({ type: 'cover' as const, image: img, name: 'Portada' });
      });
    }
    
    // Si no hay imagen principal ni extras, usar imagen por defecto
    if (coverImages.length === 0) {
      coverImages.push({ type: 'cover' as const, image: '/Cover.png?v=3', name: 'Portada' });
    }
    
    const colorImages = product.colors.map(color => ({ 
      type: 'color' as const, 
      image: color.image || '/Cover.png?v=3', 
      name: color.name,
      hex: color.hex,
      stock: color.stock
    }));
    
    return [...coverImages, ...colorImages];
  }, [product]);

  // Calcular el número de imágenes de portada para usar en varios lugares
  const coverImagesCount = useMemo(() => {
    if (!product) return 0;
    let count = 0;
    if (product.coverImage) count++;
    if (product.coverImages?.length) count += product.coverImages.length;
    return count || 1; // Al menos 1 para la imagen por defecto
  }, [product]);
  
  useEffect(() => {
    // En modo demo no hay Supabase: se omite el tracking de vistas.
    if (isDemoMode()) return;
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
    if (!api || !product || hasUserSelectedColor) return;
    
    let interval: NodeJS.Timeout;
    
    // Auto-play para todas las imágenes (cover + color)
    const totalImages = allImages.length;
    if (totalImages > 1) {
      interval = setInterval(() => {
        const currentSnap = api.selectedScrollSnap();
        const nextIndex = (currentSnap + 1) % totalImages;
        api.scrollTo(nextIndex);
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [api, isViewingCoverImages, product, allImages, hasUserSelectedColor, coverImagesCount]);

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
  }, [api, product, selectedColor, coverImagesCount]);

  // ---- Render demo: detalle sobre DEMO_PRODUCTS (campos en español) ----
  if (demoMode) {
    if (!demoProduct) {
      notFound();
    }
    const demo = demoProduct;
    const demoImagenActual = demo.imagenes[Math.min(demoImageIndex, demo.imagenes.length - 1)] ?? '/Cover.png?v=3';
    return (
      <MainLayout noPaddingTop>
        <MessageBanner />
        <div className="w-full max-w-6xl mx-auto px-4 lg:grid lg:grid-cols-2 lg:gap-12">
          <div>
            <div className="w-full relative mb-4 rounded-lg overflow-hidden">
              {demoTieneOferta && (
                <Badge variant="destructive" className="absolute top-2 left-2 z-10">
                  {demoDescuentoPct}% OFF
                </Badge>
              )}
              <Badge variant="secondary" className="absolute top-2 right-2 z-10">
                Demo
              </Badge>
              <div className="aspect-[4/5] sm:aspect-[3/5] relative">
                <Image
                  src={demoImagenActual}
                  alt={`${demo.nombre} - imagen ${demoImageIndex + 1}`}
                  fill
                  className="object-cover"
                  data-ai-hint="phone accessory"
                  unoptimized={true}
                  onError={(e) => {
                    const t = e.currentTarget as HTMLImageElement;
                    if (!t.src.includes('Cover.png')) t.src = '/Cover.png?v=3';
                  }}
                />
              </div>
              {demoAgotado && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg z-10 pointer-events-none">
                  <span className="text-white font-bold text-xl tracking-widest">AGOTADO</span>
                </div>
              )}
            </div>
            {demo.imagenes.length > 1 && (
              <div className="flex justify-center gap-3 mb-8 lg:mb-0">
                {demo.imagenes.map((img, index) => (
                  <button
                    key={`${img}-${index}`}
                    onClick={() => setDemoImageIndex(index)}
                    className={cn(
                      'relative h-16 w-16 overflow-hidden rounded-md border-2 transition-all',
                      index === demoImageIndex ? 'border-primary' : 'border-border opacity-70 hover:opacity-100',
                    )}
                    aria-label={`Ver imagen ${index + 1}`}
                  >
                    <Image src={img} alt="" fill className="object-cover" unoptimized={true} onError={(e) => {
                      const t = e.currentTarget as HTMLImageElement;
                      if (!t.src.includes('Cover.png')) t.src = '/Cover.png?v=3';
                    }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm text-muted-foreground">{demo.categoria} · Demo portfolio</p>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mt-1">{demo.nombre}</h1>
            <p className="text-muted-foreground mt-3">{demo.descripcion}</p>
            <p className="text-sm text-muted-foreground mt-2">★ {demo.rating.toFixed(1)} / 5</p>

            <div className="mt-4 flex flex-col items-start">
              {demoTieneOferta ? (
                <>
                  <div className="flex items-baseline gap-3">
                    <p className="text-2xl sm:text-3xl font-light text-primary tabular-nums">{formatPriceARS(demoPrecioEfectivo)}</p>
                    <span className="text-xs font-semibold text-orange-500">OFERTA {demoDescuentoPct}% OFF</span>
                  </div>
                  <p className="text-lg text-muted-foreground line-through">{formatPriceARS(demo.precio)}</p>
                </>
              ) : (
                <p className="text-2xl sm:text-3xl font-light text-primary tabular-nums">{formatPriceARS(demo.precio)}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Precio en ARS · Pedido demo – sin cargo</p>
            </div>

            {demo.modelos.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">
                  Modelo: <span className="font-normal">{demoModelo}</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {demo.modelos.map((modelo) => (
                    <button
                      key={modelo}
                      onClick={() => setDemoModelo(modelo)}
                      className={cn(
                        'rounded-full border px-4 py-2 text-sm transition-all',
                        demoModelo === modelo
                          ? 'border-primary bg-primary/10 font-semibold'
                          : 'border-border hover:border-primary/60',
                      )}
                      aria-pressed={demoModelo === modelo}
                    >
                      {modelo}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {demo.colores.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">
                  Color: <span className="font-normal">{demoColor}</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {demo.colores.map((color) => (
                    <button
                      key={color}
                      onClick={() => setDemoColor(color)}
                      className={cn(
                        'rounded-full border px-4 py-2 text-sm transition-all',
                        demoColor === color
                          ? 'border-primary bg-primary/10 font-semibold'
                          : 'border-border hover:border-primary/60',
                      )}
                      aria-pressed={demoColor === color}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Disponibilidad</h3>
              <Badge variant={demoAgotado ? 'destructive' : 'secondary'}>
                {demoAgotado ? 'Agotado' : 'En Stock'}
              </Badge>
              {!demoAgotado && (
                <p className="text-sm text-muted-foreground mt-2">{demo.stock} unidades disponibles.</p>
              )}
            </div>

            {!demoAgotado && (
              <div className="mt-6 flex items-center gap-4">
                <h3 className="text-lg font-medium">Cantidad</h3>
                <Input
                  type="number"
                  min={1}
                  max={demo.stock}
                  value={demoQuantity}
                  onChange={(e) => {
                    const numValue = parseInt(e.target.value, 10);
                    if (isNaN(numValue)) {
                      setDemoQuantity(1);
                    } else {
                      setDemoQuantity(Math.max(1, Math.min(numValue, demo.stock)));
                    }
                  }}
                  className="w-20"
                />
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3">
              <Button
                size="lg"
                className="w-full text-lg py-6 relative overflow-hidden group"
                disabled={demoAgotado}
                onClick={handleDemoAddToCart}
              >
                <span className="relative z-10 flex items-center">
                  {demoAgotado ? 'Agotado' : 'Agregar al Carrito'}
                  {!demoAgotado && <CartIcon className="ml-2 h-5 w-5" />}
                </span>
              </Button>
              {!demoAgotado && (
                <Button size="lg" variant="outline" className="w-full" asChild>
                  <a href={demoCheckoutUrl} target="_blank" rel="noopener noreferrer">
                    Comprar ahora por WhatsApp
                  </a>
                </Button>
              )}
              <p className="text-xs text-muted-foreground text-center">
                El checkout se finaliza por WhatsApp (Pedido demo – sin cargo).
              </p>
            </div>

          </div>
        </div>

        {demoRelacionados.length > 0 && (
          <section className="mt-12 w-full max-w-6xl mx-auto px-4">
            <h3 className="text-xl sm:text-2xl font-semibold mb-4">También te puede interesar</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
              {demoRelacionados.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/product/${rel.id}`}
                  className="min-w-[200px] sm:min-w-[240px] snap-start rounded-lg border p-3 hover:border-primary/60 transition-colors bg-card"
                >
                  <div className="relative aspect-square overflow-hidden rounded-md mb-2">
                    <Image
                      src={rel.imagenes[0] ?? '/Cover.png?v=3'}
                      alt={rel.nombre}
                      fill
                      className="object-cover"
                      unoptimized={true}
                      onError={(e) => {
                        const t = e.currentTarget as HTMLImageElement;
                        if (!t.src.includes('Cover.png')) t.src = '/Cover.png?v=3';
                      }}
                    />
                  </div>
                  <p className="text-sm font-medium leading-tight">{rel.nombre}</p>
                  <p className="text-sm text-primary font-semibold mt-1">
                    {formatPriceARS(rel.precioOferta ?? rel.precio)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </MainLayout>
    );
  }

  const isLoading = isLoadingProducts || !id || !product;

  if (isLoading) {
    return (
        <MainLayout noPaddingTop>
            <MessageBanner />
            <div className="max-w-full sm:max-w-lg lg:max-w-6xl mx-auto px-4 sm:px-6 lg:grid lg:grid-cols-2 lg:gap-12">
                <div>
                    <Skeleton className="w-full relative aspect-[4/5] sm:aspect-[3/5] rounded-lg mb-8" />
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
      <MainLayout noPaddingTop>
        <MessageBanner />
        <div className="text-center py-20">
          <h1 className="text-2xl">Cargando detalles del producto...</h1>
        </div>
      </MainLayout>
    )
  }
  
  const handleAddToCart = () => {
    if (product && selectedColor) {
      addToCart(product, selectedColor, Number(quantity) || 1);
      toast({
        variant: "success",
        title: "¡Producto agregado!",
        description: `${productName} (${selectedColor.name}) se agregó al carrito.`,
      });
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

  // Lógica de precios (detalle): aplicar descuento propio y luego 20% EF/TRANSF
  const productDiscountPercent = product.discount ? product.discount : 0;
  const cashDiscountPercent = 20;
  const basePrice = product.price;
  const priceAfterProductDiscount = basePrice * (1 - productDiscountPercent / 100); // para tachado
  const finalCashPrice = priceAfterProductDiscount * (1 - cashDiscountPercent / 100); // precio principal

  return (
    <>
      <MainLayout noPaddingTop>
        <MessageBanner />
        <div className="max-w-full sm:max-w-lg lg:max-w-6xl mx-auto px-4 sm:px-6 lg:grid lg:grid-cols-2 lg:gap-12">
             <div className="block lg:hidden text-center mb-4">
                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">{productName}</h1>
                <p className="text-xl text-muted-foreground mt-1">{product.model}</p>
                <div className="mt-2 flex flex-col items-center">
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl sm:text-3xl font-light text-primary tabular-nums">${finalCashPrice.toLocaleString()}</p>
                    <span className="text-[11px] font-semibold text-orange-500">EF/TRANSF 20% OFF</span>
                  </div>
                  <p className="text-lg text-muted-foreground line-through">${priceAfterProductDiscount.toLocaleString()}</p>
                </div>
            </div>
            <div>
                <div className="w-full relative mb-4">
                    {hasDiscount && <Badge variant="destructive" className="absolute top-2 left-2 z-10">{product.discount}% OFF</Badge>}
                    <Carousel setApi={setApi} className="rounded-lg overflow-hidden">
                        <CarouselContent>
                            {allImages.map((imageData, index) => (
                                <CarouselItem key={index}>
                                    <div className="aspect-[4/5] sm:aspect-[3/5] relative">
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
                                <span className="text-white font-bold text-lg md:text-xl tracking-widest">SOLD OUT</span>
                                <span className="text-white font-bold text-lg md:text-xl tracking-widest">SOLD OUT</span>
                                <span className="text-white font-bold text-lg md:text-xl tracking-widest">SOLD OUT</span>
                            </div>
                            <div className="absolute w-[200%] h-8 bg-black transform rotate-[55deg] flex items-center justify-center space-x-8 whitespace-nowrap">
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
                    <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">{productName}</h1>
                    <p className="text-xl text-muted-foreground mt-1">{product.model}</p>
                    <div className="mt-2 flex flex-col items-start">
                      <div className="flex items-baseline gap-3">
                        <p className="text-2xl sm:text-3xl font-light text-primary tabular-nums">${finalCashPrice.toLocaleString()}</p>
                        <span className="text-xs md:text-sm font-semibold text-orange-500">EF/TRANSF 20% OFF</span>
                      </div>
                      <p className="text-lg text-muted-foreground line-through">${priceAfterProductDiscount.toLocaleString()}</p>
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
                        <div className="flex items-center gap-2">
                          {/* Flecha izquierda */}
                          {product.colors.length > 5 && (
                            <button
                              className="bg-card/80 rounded-full p-1 shadow"
                              style={{ marginRight: 4 }}
                              onClick={() => {
                                const container = document.getElementById('color-scroll');
                                if (container) container.scrollBy({ left: -60, behavior: 'smooth' });
                              }}
                              aria-label="Deslizar colores a la izquierda"
                            >
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                          )}
                          <div
                            id="color-scroll"
                            className="flex overflow-x-auto scrollbar-hide gap-2 px-1 items-center"
                            style={{ WebkitOverflowScrolling: 'touch', maxWidth: '260px', minHeight: '56px' }}
                            tabIndex={0}
                            role="listbox"
                          >
                            {product.colors.map((color, index) => {
                              const colorImageIndex = coverImagesCount + index;
                              return (
                                <button
                                  key={index}
                                  onClick={() => {
                                    setSelectedColor(color);
                                    setIsViewingCoverImages(false);
                                    setHasUserSelectedColor(true);
                                    api?.scrollTo(colorImageIndex);
                                    // Centrar el scroll en el color seleccionado
                                    setTimeout(() => {
                                      const container = document.getElementById('color-scroll');
                                      const btn = container?.children[index] as HTMLElement;
                                      if (container && btn) {
                                        const containerRect = container.getBoundingClientRect();
                                        const btnRect = btn.getBoundingClientRect();
                                        const scrollLeft = btn.offsetLeft - container.offsetLeft - (containerRect.width / 2) + (btnRect.width / 2);
                                        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                                      }
                                    }, 0);
                                  }}
                                  className={cn(
                                    "h-10 w-10 min-w-[2.5rem] rounded-full border-2 transition-all flex-shrink-0 my-2",
                                    selectedColor?.hex === color.hex && !isViewingCoverImages
                                      ? 'border-primary ring-2 ring-primary ring-offset-2'
                                      : 'border-border',
                                    color.stock === 0 && 'opacity-50'
                                  )}
                                  style={{ backgroundColor: color.hex }}
                                  title={color.name}
                                  aria-label={`Select color ${color.name}`}
                                  role="option"
                                  aria-selected={selectedColor?.hex === color.hex}
                                />
                              );
                            })}
                          </div>
                          {/* Flecha derecha */}
                          {product.colors.length > 5 && (
                            <button
                              className="bg-card/80 rounded-full p-1 shadow"
                              style={{ marginLeft: 4 }}
                              onClick={() => {
                                const container = document.getElementById('color-scroll');
                                if (container) container.scrollBy({ left: 60, behavior: 'smooth' });
                              }}
                              aria-label="Deslizar colores a la derecha"
                            >
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                          )}
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
                  <p>Retiro en San Francisco</p>
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
    </>
  );
}
