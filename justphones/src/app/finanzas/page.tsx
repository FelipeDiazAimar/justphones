'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { SalaryWithdrawalsProvider } from '@/hooks/use-salary-withdrawals';
import { MonetaryIncomeProvider } from '@/hooks/use-monetary-income';
import FinanzasDashboard from '@/app/admin/finanzas/page';

export default function FinanzasPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header showCart={false} />
      <main className="flex-grow container mx-auto px-4 md:px-6 py-8">
        <div className="space-y-2 mb-6 text-center md:text-left">
          <h1 className="text-3xl font-bold">Panel Financiero</h1>
          <p className="text-muted-foreground text-sm">
            Visualiza métricas, cierres y movimientos financieros en tiempo real.
          </p>
        </div>
        <SalaryWithdrawalsProvider>
          <MonetaryIncomeProvider>
            <div className="mt-6">
              <FinanzasDashboard />
            </div>
          </MonetaryIncomeProvider>
        </SalaryWithdrawalsProvider>
      </main>
      <Footer />
    </div>
  );
}
