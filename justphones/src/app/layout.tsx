
'use client';

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import React from 'react';

import { ProductsProvider } from "@/hooks/use-products";
import { CustomerRequestsProvider } from "@/hooks/use-customer-requests";
import { CartProvider } from "@/hooks/use-cart";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>JustPhones Showcase</title>
        <meta name="description" content="Fundas para iPhone y accesorios." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
          <ProductsProvider>
            <CustomerRequestsProvider>
              <CartProvider>
                {children}
                <Toaster />
              </CartProvider>
            </CustomerRequestsProvider>
          </ProductsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
