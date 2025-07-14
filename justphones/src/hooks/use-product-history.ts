
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ProductHistory } from '@/lib/product-history';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './use-toast';

export function useProductHistory() {
  const supabase = createClient();
  const { toast } = useToast();
  const [productHistory, setProductHistory] = useState<ProductHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProductHistory = useCallback(async () => {
    console.log("Fetching product history...");
    setIsLoading(true);
    const { data, error } = await supabase
      .from('product_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching product history:', error.message);
      setProductHistory([]);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar el historial de productos. Asegúrate de que la tabla "product_history" exista.' });
    } else {
      console.log("Product history fetched successfully:", data);
      setProductHistory(data as ProductHistory[]);
    }
    setIsLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
    fetchProductHistory();
    const channel = supabase
      .channel('product_history_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_history' },
        (payload) => {
          console.log('Product history change detected, refetching...', payload);
          fetchProductHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProductHistory, supabase]);


  return { productHistory, isLoading };
}
