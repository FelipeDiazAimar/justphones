
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from "@/components/icons/logo";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader } from '@/components/loader';
import { Button } from '@/components/ui/button';
import Aurora from '@/components/aurora';
import '@/components/aurora.css';


export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSwitchChange = (checked: boolean) => {
    if (checked) {
      setTimeout(() => {
        setIsLoading(true);
        setTimeout(() => {
          router.push('/catalog');
        }, 1500);
      }, 1500); 
    }
  };

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
              <Label htmlFor="catalog-switch" className="text-lg font-medium">
                Acceder
              </Label>
              <Switch
                id="catalog-switch"
                onCheckedChange={handleSwitchChange}
                className="h-8 w-16 data-[state=checked]:animate-magic-glow"
                thumbClassName="h-6 w-6 data-[state=checked]:translate-x-8"
              />
            </div>
          </>
        ) : (
          <Loader />
        )}
      </div>
    </div>
  );
}
