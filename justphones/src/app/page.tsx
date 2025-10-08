
"use client";

import { useState, useRef, useEffect } from 'react';
import { Analytics } from "@vercel/analytics/next";
import { useRouter } from 'next/navigation';
import { Logo } from "@/components/icons/logo";
import { Loader } from '@/components/loader';
import Aurora from '@/components/aurora';
import '@/components/aurora.css';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitchOn, setIsSwitchOn] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [thumbPosition, setThumbPosition] = useState(0);
  const switchRef = useRef<HTMLDivElement>(null);

  const handleInteractionStart = (clientX: number) => {
    if (isLoading) return;
    setIsDragging(true);
    const switchElement = switchRef.current;
    if (!switchElement) return;
    const buttonElement = switchElement.querySelector('button');
    if (!buttonElement) return;
    const buttonRect = buttonElement.getBoundingClientRect();
    
    setStartX(clientX - thumbPosition - buttonRect.left + switchElement.getBoundingClientRect().left);
  };

  const handleInteractionMove = (clientX: number) => {
    if (!isDragging || isLoading) return;
    const switchElement = switchRef.current;
    const buttonElement = switchElement?.querySelector('button');
    const thumbElement = switchElement?.querySelector('span');

    if (!switchElement || !buttonElement || !thumbElement) return;
    
    const buttonRect = buttonElement.getBoundingClientRect();
    const thumbWidth = thumbElement.getBoundingClientRect().width;
    const maxTranslate = buttonRect.width - thumbWidth * 1.25;

    let newThumbPosition = clientX - startX;
    newThumbPosition = Math.max(0, Math.min(newThumbPosition, maxTranslate));
    setThumbPosition(newThumbPosition);
  };

  const handleInteractionEnd = () => {
    if (!isDragging || isLoading) return;
    setIsDragging(false);

    const switchElement = switchRef.current;
    const buttonElement = switchElement?.querySelector('button');
    const thumbElement = switchElement?.querySelector('span');

    if (!switchElement || !buttonElement || !thumbElement) return;

    const buttonRect = buttonElement.getBoundingClientRect();
    const thumbWidth = thumbElement.getBoundingClientRect().width;
    const threshold = (buttonRect.width - thumbWidth) / 2;

    if (thumbPosition > threshold) {
      activateSwitch();
    } else {
      resetSwitch();
    }
  };

  const activateSwitch = () => {
    const switchElement = switchRef.current;
    if (!switchElement) return;

    const buttonElement = switchElement.querySelector('button');
    const thumbElement = switchElement.querySelector('span');
    if (!buttonElement || !thumbElement) return;

    const buttonRect = buttonElement.getBoundingClientRect();
    const thumbWidth = thumbElement.getBoundingClientRect().width;
    const maxTranslate = buttonRect.width - thumbWidth * 1.25;
    
    setThumbPosition(maxTranslate);
    setIsSwitchOn(true);
    
    setTimeout(() => {
        setIsLoading(true);
        setTimeout(() => {
          router.push('/catalog');
        }, 1500);
      }, 300);
  }

  const resetSwitch = () => {
     setThumbPosition(0);
     setIsSwitchOn(false);
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSearchSubmit called');
    console.log('searchQuery:', JSON.stringify(searchQuery));
    console.log('searchQuery length:', searchQuery.length);
    console.log('searchQuery char codes:', Array.from(searchQuery).map(c => c.charCodeAt(0)));

    if (!searchQuery.trim()) {
      console.log('searchQuery is empty, returning');
      return;
    }

    const query = searchQuery.trim().toUpperCase();
    const finanzasKey = FINANZAS_KEY.toUpperCase();
    const adminKey = ADMIN_KEY.toUpperCase();

    console.log('Search query (upper):', JSON.stringify(query));
    console.log('FINANZAS_KEY (upper):', JSON.stringify(finanzasKey));
    console.log('ADMIN_KEY (upper):', JSON.stringify(adminKey));
    console.log('FINANZAS_KEY char codes:', Array.from(FINANZAS_KEY).map(c => c.charCodeAt(0)));
    console.log('ADMIN_KEY char codes:', Array.from(ADMIN_KEY).map(c => c.charCodeAt(0)));
    console.log('Comparison results:', {
      queryEqualsFinanzas: query === finanzasKey,
      queryEqualsAdmin: query === adminKey
    });

    const normalizedQuery = query.replace(/\s/g, '').toUpperCase();
    const normalizedFinanzasKey = finanzasKey.replace(/\s/g, '').toUpperCase();
    const normalizedAdminKey = adminKey.replace(/\s/g, '').toUpperCase();

    console.log('Normalized query:', JSON.stringify(normalizedQuery));
    console.log('Normalized finanzas key:', JSON.stringify(normalizedFinanzasKey));
    console.log('Normalized admin key:', JSON.stringify(normalizedAdminKey));

    // Verificar claves exactas (case insensitive, sin espacios)
    if (normalizedQuery === normalizedFinanzasKey) {
      console.log('MATCH: Redirecting to finanzas');
      localStorage.setItem('finanzas_authenticated', 'true');
      setIsLoading(true);
      setTimeout(() => {
        router.push('/finanzas');
      }, 1000);
      return;
    } else if (normalizedQuery === normalizedAdminKey) {
      console.log('MATCH: Redirecting to admin');
      localStorage.setItem('admin_authenticated', 'true');
      setIsLoading(true);
      setTimeout(() => {
        router.push('/admin');
      }, 1000);
      return;
    }

    // Verificar si contiene las claves pero con posibles errores
    if (query.includes('JUSTPHONES$1') || query.includes('JUSTPHONES$2')) {
      console.log('Detected JUSTPHONES keyword but not exact match');
      alert('Clave detectada pero no coincide exactamente. Asegúrate de escribir JUSTPHONES$1 o JUSTPHONES$2 exactamente.');
      setSearchQuery('');
      return;
    }

    // Buscar productos normalmente
    console.log('Searching for products');
    setIsLoading(true);
    setTimeout(() => {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }, 1000);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    handleInteractionStart(e.clientX);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleInteractionMove(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    handleInteractionEnd();
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleClick = () => {
      if (!isDragging && !isLoading) {
          activateSwitch();
      }
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-50">
          <Aurora />
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center text-center p-8">
        {!isLoading ? (
          <>
            <div className="mb-24">
              <Logo className="h-auto w-48" />
            </div>
            <div className="flex flex-col items-center space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div
                  ref={switchRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className="p-4 cursor-grab active:cursor-grabbing"
                >
                  <button
                    id="catalog-switch"
                    role="switch"
                    aria-checked={isSwitchOn}
                    data-state={isSwitchOn ? "checked" : "unchecked"}
                    onClick={handleClick}
                    className={cn(
                      "peer inline-flex h-8 w-16 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                      isSwitchOn ? "border-primary bg-primary animate-magic-glow" : "border-foreground bg-transparent"
                    )}
                  >
                    <span
                      style={{ transform: `translateX(${thumbPosition}px)` }}
                      className={cn(
                        "pointer-events-none block h-6 w-6 rounded-full shadow-lg ring-0",
                        !isDragging && "transition-transform",
                        isSwitchOn ? "bg-black dark:bg-black" : "bg-foreground"
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <Loader />
        )}
      </div>
      <Analytics />
    </div>
  );
}
