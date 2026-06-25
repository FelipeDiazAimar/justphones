
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AdminNav } from '@/components/admin-nav';
import { SalaryWithdrawalsProvider } from '@/hooks/use-salary-withdrawals';
import { MonetaryIncomeProvider } from '@/hooks/use-monetary-income';


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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
