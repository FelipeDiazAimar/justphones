
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
            <div className="flex flex-col items-center space-y-4">
              <label htmlFor="catalog-switch" className="text-lg font-medium">
                Acceder
              </label>
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
          </>
        ) : (
          <Loader />
        )}
      </div>
      <Analytics />
    </div>
  );
}
