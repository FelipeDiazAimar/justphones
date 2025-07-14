
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { X, Percent, Landmark, CreditCard } from 'lucide-react';

const BANNER_STORAGE_KEY = 'justphones-welcome-banner-dismissed';

export function WelcomeBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(BANNER_STORAGE_KEY);
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(BANNER_STORAGE_KEY, 'true');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="mb-8 relative bg-gradient-to-br from-primary/10 via-background to-background border-primary/20 shadow-lg overflow-hidden">
        <div className="absolute -top-12 -right-12 text-primary/5">
            <Percent className="h-48 w-48" />
        </div>
        <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="absolute top-4 right-4 h-8 w-8 rounded-full"
        >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
        </Button>
      <CardHeader className="flex flex-row items-center gap-4">
        <Logo className="h-16 w-auto flex-shrink-0" />
        <div>
            <CardTitle className="text-2xl font-bold">¡Bienvenido a JustPhones!</CardTitle>
            <CardDescription className="text-base">Aprovecha nuestros métodos de pago exclusivos.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="p-4 rounded-lg bg-background/50">
            <Landmark className="mx-auto h-8 w-8 mb-2 text-primary" />
            <p className="font-semibold">Efectivo o Transferencia</p>
            <p className="text-lg font-bold text-primary">20% OFF</p>
        </div>
        <div className="p-4 rounded-lg bg-background/50">
            <CreditCard className="mx-auto h-8 w-8 mb-2 text-primary" />
            <p className="font-semibold">Tarjeta de Débito</p>
            <p className="text-lg font-bold text-primary">10% OFF</p>
        </div>
        <div className="p-4 rounded-lg bg-background/50">
            <CreditCard className="mx-auto h-8 w-8 mb-2 text-primary" />
            <p className="font-semibold">Tarjeta de Crédito</p>
            <p className="text-lg font-bold text-primary">3 Cuotas sin interés</p>
        </div>
      </CardContent>
    </Card>
  );
}
