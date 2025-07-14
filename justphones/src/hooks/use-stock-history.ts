
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { StockHistory } from '@/lib/stock-history';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './use-toast';

export function useStockHistory() {
  const supabase = createClient();
  const { toast } = useToast();
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStockHistory = useCallback(async () => {
    console.log("[useStockHistory] Starting fetch...");
    setIsLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    console.log('[useStockHistory] Current session state:', session ? `Authenticated as ${session.user.email}` : 'Not authenticated');

    const { data, error, count } = await supabase
      .from('stock_history')
      .select('*', { count: 'exact' });

    console.log("[useStockHistory] Supabase response received.");
    console.log("[useStockHistory] Error object:", error);
    console.log("[useStockHistory] Data object:", data);
    console.log("[useStockHistory] Count:", count);

    if (error) {
      console.error('[useStockHistory] Error fetching stock history:', error.message);
      setStockHistory([]);
      toast({ 
        variant: 'destructive', 
        title: 'Error de Historial', 
        description: `No se pudo cargar el historial de stock: ${error.message}` 
      });
    } else {
      console.log(`[useStockHistory] Fetch successful. ${data?.length ?? 0} records returned by query.`);
      setStockHistory(data as StockHistory[]);
      if (data.length === 0 && count !== 0) {
        console.warn("[useStockHistory] WARNING: Query returned 0 records, but total count in table is non-zero. This strongly suggests an RLS policy issue or an authentication problem.");
        toast({
          variant: 'destructive',
          title: 'Problema de Permisos Detectado',
          description: 'El historial de stock tiene registros pero no se pueden mostrar. Revisa las políticas RLS y la autenticación.'
        });
      }
    }
    setIsLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
    fetchStockHistory();
    
    const channel = supabase
      .channel('stock_history_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stock_history' },
        (payload) => {
          console.log('[useStockHistory] Realtime change detected, refetching...', payload);
          fetchStockHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, [fetchStockHistory, supabase]);


  return { stockHistory, isLoading, fetchStockHistory };
}
