import React from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { FloatingContact } from '@/components/floating-contact';

export function MainLayout({ children, noPaddingTop = false }: { children: React.ReactNode; noPaddingTop?: boolean }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className={`flex-grow container mx-auto px-4 md:px-6 pb-8 ${noPaddingTop ? '' : 'pt-8'}`}>
        {children}
      </main>
      <FloatingContact />
      <Footer />
    </div>
  );
}
