'use client';

import { useState } from 'react';
import type { Sale } from '@/lib/sales';
import { MOCK_SALES } from '@/lib/mock-data';
import { useToast } from './use-toast';

export function useSales() {
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>(MOCK_SALES);
  const [isLoading] = useState(false);

  const fetchSales = async () => {
    // No-op in mock mode
  };

  const addSale = async (saleData: Omit<Sale, 'id' | 'created_at'>): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    const newSale: Sale = {
      ...saleData,
      id: `sale-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setSales(prev => [newSale, ...prev]);
    toast({ title: 'Venta registrada', description: 'La venta fue guardada correctamente.' });
    return true;
  };

  const updateSale = async (saleId: string, saleData: Partial<Omit<Sale, 'id' | 'created_at'>>): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    setSales(prev => prev.map(s => s.id === saleId ? { ...s, ...saleData } : s));
    toast({ title: 'Venta actualizada' });
    return true;
  };

  const deleteSale = async (saleId: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    setSales(prev => prev.filter(s => s.id !== saleId));
    toast({ title: 'Venta eliminada' });
    return true;
  };

  return { sales, isLoading, addSale, updateSale, deleteSale, fetchSales };
}
