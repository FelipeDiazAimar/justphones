
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Sale } from '@/lib/sales';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './use-toast';

export function useSales() {
  const supabase = createClient();
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sales:', error.message);
      setSales([]);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar el historial de ventas. Asegúrate de que la tabla "sales" exista y tenga las políticas de RLS correctas.' });
    } else {
      setSales(data as Sale[]);
    }
    setIsLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const addSale = async (saleData: Omit<Sale, 'id' | 'created_at'>) => {
    const { error } = await supabase.from('sales').insert([saleData]);
    if (error) {
      console.error('Error adding sale:', error.message);
      const description = error.message.includes('violates row-level security policy')
        ? 'Acción bloqueada por la seguridad de la base de datos. Por favor, revisa las políticas de RLS para la tabla "sales".'
        : `No se pudo registrar la venta: ${error.message}`;
      toast({ variant: 'destructive', title: 'Error', description });
      return false;
    }
    await fetchSales();
    return true;
  };

  return { sales, isLoading, addSale, fetchSales };
}
