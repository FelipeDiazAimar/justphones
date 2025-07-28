
'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash, Plus, Minus, Tag, Check, Loader2 } from 'lucide-react';
import { CartIcon } from './icons/cart';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { DiscountCode } from '@/lib/discount-codes';
import { Label } from './ui/label';

const paymentOptions = {
  cash: { label: 'Efectivo (20% OFF)', discount: 0.2, type: 'discount' },
  transfer: { label: 'Transferencia (20% OFF)', discount: 0.2, type: 'discount' },
  debit: { label: 'Débito (10% OFF)', discount: 0.1, type: 'discount' },
  credit: { label: 'Crédito (3 cuotas sin interés)', installments: 3, type: 'installments' },
};


export function CartSheet() {
  const { cartItems, removeFromCart, updateItemQuantity, cartCount, clearCart, confirmCustomerRequests } = useCart();
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<keyof typeof paymentOptions | ''>('');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percentage: number, name: string; } | null>(null);
  const [isApplyingCode, setIsApplyingCode] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();
  const phoneNumber = '5493564338599'; 
  
  const handleApplyDiscountCode = async () => {
    if (!discountCode.trim()) return;
    setIsApplyingCode(true);

    const { data: rpcResponse, error: rpcError } = await supabase.rpc('apply_and_increment_discount', { p_code: discountCode.trim().toUpperCase() });

    const discountData = rpcResponse?.[0];

    if (rpcError || !discountData || !discountData.success) {
        const errorMessage = discountData?.error || rpcError?.message || 'Código de descuento inválido.';
        toast({ variant: "destructive", title: "Error", description: errorMessage });
        setAppliedDiscount(null);
    } else if (discountData.success) {
        setAppliedDiscount({ code: discountData.code, percentage: discountData.percentage, name: discountData.name });
        toast({ title: "¡Éxito!", description: `Se aplicó un ${discountData.percentage}% de descuento.` });
    }
    setIsApplyingCode(false);
  };
  
  const removeDiscount = () => {
      setAppliedDiscount(null);
      setDiscountCode('');
      toast({ description: "Descuento eliminado."});
  }

  const finalPriceDetails = useMemo(() => {
    let originalPrice = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    let subtotal = originalPrice;
    let totalDiscountAmount = 0;
    let details = '';
    let whatsappDetails = `\n\nPrecio Original: $${originalPrice.toLocaleString('es-AR')}`;
    let discountDetailsBreakdown: { label: string, amount: number }[] = [];
    
    // 1. Calcular descuentos por producto (promociones)
    const productDiscounts = cartItems.reduce((acc, item) => {
        if (item.product.discount && item.product.discount > 0) {
            const discountAmount = item.product.price * (item.product.discount / 100) * item.quantity;
            const promoLabel = `DESCUENTO POR PROMO (${item.product.discount}%):`;
            whatsappDetails += `\n${promoLabel} -$${discountAmount.toLocaleString('es-AR')}`;
            discountDetailsBreakdown.push({ label: promoLabel, amount: discountAmount });
            return acc + discountAmount;
        }
        return acc;
    }, 0);
    
    subtotal -= productDiscounts;

    // 2. Aplicar descuento del código si existe
    let couponDiscountAmount = 0;
    if (appliedDiscount) {
        couponDiscountAmount = subtotal * (appliedDiscount.percentage / 100);
        const discountName = appliedDiscount.name || appliedDiscount.code;
        const couponLabel = `DESCUENTO (${discountName}):`;
        whatsappDetails += `\n${couponLabel} -$${couponDiscountAmount.toLocaleString('es-AR')}`;
        discountDetailsBreakdown.push({ label: couponLabel, amount: couponDiscountAmount });
    }

    subtotal -= couponDiscountAmount;
    
    // 3. Aplicar descuento por método de pago
    let paymentDiscountAmount = 0;
    if (paymentMethod && paymentOptions[paymentMethod].type === 'discount') {
        paymentDiscountAmount = subtotal * paymentOptions[paymentMethod].discount;
        const paymentLabel = `DESCUENTO (${paymentOptions[paymentMethod].label}):`;
        whatsappDetails += `\n${paymentLabel} -$${paymentDiscountAmount.toLocaleString('es-AR')}`;
        discountDetailsBreakdown.push({ label: paymentLabel, amount: paymentDiscountAmount });
    }
    
    subtotal -= paymentDiscountAmount;
    totalDiscountAmount = productDiscounts + couponDiscountAmount + paymentDiscountAmount;

    whatsappDetails += `\n*Total: $${subtotal.toLocaleString('es-AR')}*`;
    
    if (paymentMethod && paymentOptions[paymentMethod].type === 'installments') {
        const installmentPrice = subtotal / paymentOptions[paymentMethod].installments;
        details = `${paymentOptions[paymentMethod].installments} cuotas de $${installmentPrice.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        whatsappDetails += ` (${details})`;
    }

    return {
      finalTotal: subtotal,
      originalTotal: originalPrice,
      hasDiscount: totalDiscountAmount > 0,
      isInstallments: paymentMethod ? paymentOptions[paymentMethod].type === 'installments' : false,
      details,
      whatsappDetails,
      discountAmount: totalDiscountAmount,
      discountDetailsBreakdown
    };

  }, [cartItems, paymentMethod, appliedDiscount]);


  const handleCheckout = async () => {
    if (cartItems.length === 0 || !deliveryMethod || !paymentMethod) return;

    // Registrar el pedido del cliente en la base de datos
    await confirmCustomerRequests(cartItems);

    const message = cartItems.map(item =>
      `- ${item.quantity}x ${item.product.name} (${item.product.model}) - Color: ${item.color.name}`
    ).join('\n');

    const deliveryInfo = `\n\nMétodo de entrega: *${deliveryMethod}*`;
    let paymentInfo = `\nMétodo de pago: *${paymentOptions[paymentMethod].label}*`;

    if (appliedDiscount) {
      paymentInfo += `\nCódigo Utilizado: *${appliedDiscount.code}*`;
    }
    
    const total = finalPriceDetails.whatsappDetails;
    
    const finalMessage = `¡Hola! Quisiera hacer el siguiente pedido:\n\n${message}${deliveryInfo}${paymentInfo}${total}`;
    
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(finalMessage)}`;

    window.open(whatsappUrl, '_blank');
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <CartIcon className="h-5 w-5" />
          {cartCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0 text-xs">
              {cartCount}
            </Badge>
          )}
          <span className="sr-only">Abrir carrito</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-lg p-0">
        <SheetHeader className="px-6 pt-6 pb-4">
          <div className="flex justify-between items-center pr-4">
            <SheetTitle>Mi Carrito ({cartCount})</SheetTitle>
            {cartItems.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearCart}>
                <Trash className="h-3 w-3 mr-1" />
                Vaciar
              </Button>
            )}
          </div>
          <SheetDescription>
            Revisa los productos en tu carrito. Cuando estés listo, finaliza el pedido.
          </SheetDescription>
        </SheetHeader>
        
        {cartItems.length > 0 ? (
          <>
            <ScrollArea className="flex-1 my-4 px-6">
                <div className="flex flex-col gap-6">
                  {cartItems.map((item) => {
                    const hasDiscount = item.product.discount && item.product.discount > 0;
                    const itemTotalPrice = item.product.price * item.quantity;
                    const itemDiscountedPrice = hasDiscount ? itemTotalPrice * (1 - (item.product.discount ?? 0) / 100) : itemTotalPrice;

                    return (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="relative h-20 w-20 overflow-hidden rounded-md">
                          <Image
                            src={item.color.image || item.product.coverImage}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 text-sm">
                          <h4 className="font-medium">{item.product.name}</h4>
                          <p className="text-muted-foreground">Color: {item.color.name}</p>
                          <div className="flex items-baseline gap-2 mt-1">
                            {hasDiscount ? (
                                <>
                                    <p className="font-semibold text-primary">${itemDiscountedPrice.toLocaleString('es-AR')}</p>
                                    <p className="text-sm text-muted-foreground line-through">${itemTotalPrice.toLocaleString('es-AR')}</p>
                                </>
                            ) : (
                                <p className="font-semibold">${itemTotalPrice.toLocaleString('es-AR')}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateItemQuantity(item.id, item.quantity - 1)}>
                                  <Minus className="h-3 w-3" />
                              </Button>
                              <span>{item.quantity}</span>
                              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateItemQuantity(item.id, item.quantity + 1)}>
                                  <Plus className="h-3 w-3" />
                              </Button>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive rounded-full" onClick={() => removeFromCart(item.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
            </ScrollArea>
            
            <SheetFooter className="mt-auto border-t bg-background px-6 py-4">
              <div className="w-full flex flex-col items-center gap-4">
                 <div className="w-full max-w-xs flex flex-col font-semibold">
                    {finalPriceDetails.hasDiscount && (
                      <>
                        <div className="flex w-full justify-between text-sm text-muted-foreground">
                            <span>Precio Original:</span>
                            <span className="line-through">${finalPriceDetails.originalTotal.toLocaleString('es-AR')}</span>
                        </div>
                        {finalPriceDetails.discountDetailsBreakdown.map((discount, index) => (
                           <div key={index} className="flex w-full justify-between text-sm text-green-600">
                               <span className="truncate pr-2">{discount.label}</span>
                               <span className="whitespace-nowrap flex-shrink-0">-${discount.amount.toLocaleString('es-AR')}</span>
                           </div>
                        ))}
                      </>
                    )}
                    <div className="flex w-full justify-between text-lg mt-1 pt-1 border-t">
                        <span>Total:</span>
                        <span>${finalPriceDetails.finalTotal.toLocaleString('es-AR')}</span>
                    </div>
                    {finalPriceDetails.isInstallments && (
                        <div className="flex w-full justify-end text-sm font-normal text-primary">
                            <span>{finalPriceDetails.details}</span>
                        </div>
                    )}
                </div>
                <div className="w-full max-w-xs space-y-2">
                  <div className="space-y-1">
                    {appliedDiscount ? (
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="border-green-500 text-green-700">
                               <Tag className="mr-1 h-3 w-3" /> {appliedDiscount.code} (-{appliedDiscount.percentage}%)
                            </Badge>
                            <Button variant="outline" size="sm" onClick={removeDiscount}>Quitar</Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Input
                                id="discount-code"
                                value={discountCode}
                                onChange={(e) => setDiscountCode(e.target.value)}
                                placeholder="Código de Descuento"
                                className="h-9"
                            />
                            <Button onClick={handleApplyDiscountCode} disabled={isApplyingCode} size="sm" className="h-9">
                                {isApplyingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
                            </Button>
                        </div>
                    )}
                  </div>
                  <Select onValueChange={setDeliveryMethod} value={deliveryMethod}>
                    <SelectTrigger id="delivery-method" className="w-full">
                      <SelectValue placeholder="Método de entrega" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Retiro (Freyre)">Retiro (Freyre)</SelectItem>
                      <SelectItem value="Retiro (San Francisco)">Retiro (San Francisco)</SelectItem>
                      <SelectItem value="Coordinamos!">¡Coordinamos!</SelectItem>
                      <SelectItem value="Envío a domicilio (Sin cargo en Freyre)">Envío a domicilio (Sin cargo en Freyre)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select onValueChange={(value) => setPaymentMethod(value as keyof typeof paymentOptions)} value={paymentMethod}>
                      <SelectTrigger id="payment-method" className="w-full">
                         <SelectValue placeholder="Método de pago" />
                      </SelectTrigger>
                      <SelectContent>
                         {Object.entries(paymentOptions).map(([key, { label }]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                         ))}
                      </SelectContent>
                  </Select>
                </div>
                <Button className="w-full max-w-xs" onClick={handleCheckout} disabled={!deliveryMethod || !paymentMethod}>
                  Finalizar Pedido por WhatsApp
                </Button>
              </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-6">
            <CartIcon className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-xl font-semibold">Tu carrito está vacío</h3>
            <p className="text-muted-foreground">Parece que aún no has añadido productos. ¡Empieza a explorar!</p>
            <SheetTrigger asChild>
                <Button asChild>
                    <Link href="/catalog">Ver Catálogo</Link>
                </Button>
            </SheetTrigger>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
