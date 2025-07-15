
'use client';

import { useState, useMemo } from 'react';
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
import { Trash, Plus, Minus } from 'lucide-react';
import { CartIcon } from './icons/cart';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const paymentOptions = {
  cash: { label: 'Efectivo (20% OFF)', discount: 0.2, type: 'discount' },
  transfer: { label: 'Transferencia (20% OFF)', discount: 0.2, type: 'discount' },
  debit: { label: 'Débito (10% OFF)', discount: 0.1, type: 'discount' },
  credit: { label: 'Crédito (3 cuotas sin interés)', installments: 3, type: 'installments' },
};


export function CartSheet() {
  const { cartItems, removeFromCart, updateItemQuantity, cartCount, totalPrice, clearCart } = useCart();
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<keyof typeof paymentOptions | ''>('');
  const phoneNumber = '5493564338599'; // User's number without '+'
  
  const finalPriceDetails = useMemo(() => {
    if (!paymentMethod || !totalPrice) {
      return {
        hasDiscount: false,
        isInstallments: false,
        finalTotal: totalPrice,
        originalTotal: totalPrice,
        details: ``,
        whatsappDetails: `\n\n*Total: $${totalPrice.toLocaleString('es-AR')}*`
      };
    }

    const selectedOption = paymentOptions[paymentMethod];
    
    if (selectedOption.type === 'discount') {
      const discountedPrice = totalPrice * (1 - selectedOption.discount);
      return {
        hasDiscount: true,
        isInstallments: false,
        finalTotal: discountedPrice,
        originalTotal: totalPrice,
        details: ``,
        whatsappDetails: `\n\nPrecio Original: $${totalPrice.toLocaleString('es-AR')}\n*Total con descuento: $${discountedPrice.toLocaleString('es-AR')}*`
      };
    }

    if (selectedOption.type === 'installments') {
      const installmentPrice = totalPrice / selectedOption.installments;
      return {
        hasDiscount: false,
        isInstallments: true,
        finalTotal: totalPrice,
        originalTotal: totalPrice,
        details: `${selectedOption.installments} cuotas de $${installmentPrice.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
        whatsappDetails: `\n\n*Total: $${totalPrice.toLocaleString('es-AR')}* (${selectedOption.installments} cuotas sin interés de $${installmentPrice.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})})`
      };
    }

    return {
        hasDiscount: false,
        isInstallments: false,
        finalTotal: totalPrice,
        originalTotal: totalPrice,
        details: ``,
        whatsappDetails: `\n\n*Total: $${totalPrice.toLocaleString('es-AR')}*`
    };

  }, [totalPrice, paymentMethod]);


  const handleCheckout = () => {
    if (cartItems.length === 0 || !deliveryMethod || !paymentMethod) return;

    const message = cartItems.map(item =>
      `- ${item.quantity}x ${item.product.name} (${item.product.model}) - Color: ${item.color.name}`
    ).join('\n');

    const deliveryInfo = `\n\nMétodo de entrega: *${deliveryMethod}*`;
    const paymentInfo = `\nMétodo de pago: *${paymentOptions[paymentMethod].label}*`;
    
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
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
        <SheetHeader className="px-6">
          <SheetTitle>Mi Carrito ({cartCount})</SheetTitle>
          <SheetDescription>
            Revisa los productos en tu carrito. Cuando estés listo, finaliza el pedido.
          </SheetDescription>
        </SheetHeader>
        
        {cartItems.length > 0 ? (
          <>
            <ScrollArea className="flex-1 my-4">
                <div className="flex flex-col gap-6 px-6">
                  {cartItems.map((item) => (
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
                        <p className="font-semibold mt-1">${(item.product.price * item.quantity).toLocaleString('es-AR')}</p>
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
                  ))}
                </div>
            </ScrollArea>
            <SheetFooter className="mt-auto border-t bg-background px-6 py-2">
              <div className="w-full flex flex-col items-center gap-2">
                 <div className="w-full max-w-xs flex flex-col font-semibold">
                    {finalPriceDetails.hasDiscount && (
                        <div className="flex w-full justify-between text-sm text-muted-foreground">
                            <span>Subtotal:</span>
                            <span className="line-through">${finalPriceDetails.originalTotal.toLocaleString('es-AR')}</span>
                        </div>
                    )}
                    <div className="flex w-full justify-between text-lg">
                        <span>{finalPriceDetails.hasDiscount ? 'Total c/dto:' : 'Total:'}</span>
                        <span>${finalPriceDetails.finalTotal.toLocaleString('es-AR')}</span>
                    </div>
                    {finalPriceDetails.isInstallments && (
                        <div className="flex w-full justify-end text-sm font-normal text-primary">
                            <span>{finalPriceDetails.details}</span>
                        </div>
                    )}
                </div>
                <div className="w-full max-w-xs">
                  <Select onValueChange={setDeliveryMethod} value={deliveryMethod}>
                    <SelectTrigger id="delivery-method" className="w-full">
                      <SelectValue placeholder="Método de entrega" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Retiro (Freyre)">Retiro (Freyre)</SelectItem>
                      <SelectItem value="Coordinamos!">¡Coordinamos!</SelectItem>
                      <SelectItem value="Envío a domicilio (Sin cargo en Freyre)">Envío a domicilio (Sin cargo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full max-w-xs">
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
                <Button variant="outline" className="w-full max-w-xs" onClick={clearCart}>
                  Vaciar Carrito
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
