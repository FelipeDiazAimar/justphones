
import React from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AdminNav } from '@/components/admin-nav';
import { SalaryWithdrawalsProvider } from '../../hooks/use-salary-withdrawals';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header showCart={false} />
      <main className="flex-grow container mx-auto px-4 md:px-6 py-8">
        <h1 className="text-3xl font-bold mb-6 text-center md:text-left">Panel de Administración</h1>
        <AdminNav />
        <SalaryWithdrawalsProvider>
            <div className="mt-6">{children}</div>
        </SalaryWithdrawalsProvider>
      </main>
      <Footer />
    </div>
  );
}
