'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export function Logo({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const [logoSrc, setLogoSrc] = useState('/JustPhonesLogo.png?v=2');

  useEffect(() => {
    if (resolvedTheme === 'light') {
      setLogoSrc('/JustPhonesLogoDark.png?v=2');
    } else {
      setLogoSrc('/JustPhonesLogo.png?v=2');
    }
  }, [resolvedTheme]);

  return (
    <Image
      src={logoSrc}
      alt="JustPhones Logo"
      width={500}
      height={500}
      className={cn("object-contain", className)}
      priority
    />
  );
}
