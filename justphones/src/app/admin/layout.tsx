
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Settings } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AdminNav } from '@/components/admin-nav';
import { SalaryWithdrawalsProvider } from '@/hooks/use-salary-withdrawals';
import { MonetaryIncomeProvider } from '@/hooks/use-monetary-income';

const ADMIN_AUTH_KEY = 'JUSTPHONES$2';
const ADMIN_AUTH_STORAGE_KEY = 'admin_authenticated';

function AdminAuthForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simular un pequeño delay para mejor UX
    setTimeout(() => {
      if (password === ADMIN_AUTH_KEY) {
        localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, 'true');
        window.location.reload(); // Recargar para activar la protección
      } else {
        setError('Clave incorrecta. Inténtalo de nuevo.');
        setPassword('');
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Settings className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Panel de Administración</CardTitle>
            <CardDescription>
              Ingresa la clave de acceso para continuar al panel administrativo de JustPhones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Ingresa la clave de acceso"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-center text-lg"
                  autoFocus
                  disabled={isLoading}
                />
                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Verificando...
                  </>
                ) : (
                  'Acceder al Panel Admin'
                )}
              </Button>
            </form>
            <div className="mt-6 text-center text-xs text-muted-foreground">
              <p>Sistema de administración JustPhones</p>
              <p>Acceso autorizado únicamente</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Verificar si ya está autenticado en localStorage
    const storedAuth = localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminAuthForm />;
  }

  const isDashboardPage = pathname === '/admin';

  return (
    <div className="flex flex-col min-h-screen">
      <Header showCart={false} />
      <main className="flex-grow container mx-auto px-4 md:px-6 py-8">
        {!isDashboardPage && (
          <h1 className="text-3xl font-bold mb-6 text-center md:text-left">Panel de Administración</h1>
        )}
        {!isDashboardPage && <AdminNav />}
        <SalaryWithdrawalsProvider>
          <MonetaryIncomeProvider>
            <div className={isDashboardPage ? "" : "mt-6"}>{children}</div>
          </MonetaryIncomeProvider>
        </SalaryWithdrawalsProvider>
      </main>
      <Footer />
    </div>
  );
}
