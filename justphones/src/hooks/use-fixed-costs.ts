
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FixedCost } from '@/lib/fixed-costs';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './use-toast';

export function useFixedCosts() {
  const supabase = createClient();
  const { toast } = useToast();
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFixedCosts = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('fixed_costs').select('*').order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching fixed costs:', error.message);
      setFixedCosts([]);
      toast({ 
          variant: 'destructive', 
          title: 'Error de Base de Datos', 
          description: `No se pudieron cargar los costos fijos. Asegúrate de que la tabla "fixed_costs" existe. Error: ${error.message}` 
      });
    } else {
      setFixedCosts(data as FixedCost[]);
    }
    setIsLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
    fetchFixedCosts();

    const channel = supabase
      .channel('fixed_costs_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fixed_costs' },
        () => fetchFixedCosts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFixedCosts, supabase]);
  
  const addFixedCost = async (costData: Omit<FixedCost, 'id' | 'created_at'>) => {
    const { error } = await supabase.from('fixed_costs').insert([costData]);
    if (error) {
      console.error('Error adding fixed cost:', error.message);
      toast({ 
          variant: 'destructive', 
          title: 'Error', 
          description: `No se pudo añadir el costo fijo: ${error.message}` 
      });
      return false;
    }
    // No need to call fetch here, the realtime subscription will handle it.
    return true;
  };
  
  const updateFixedCost = async (costId: string, costData: Partial<Omit<FixedCost, 'id' | 'created_at'>>) => {
    const { error } = await supabase.from('fixed_costs').update(costData).eq('id', costId);
    if (error) {
        console.error('Error updating fixed cost:', error.message);
        toast({ 
            variant: 'destructive', 
            title: 'Error', 
            description: `No se pudo actualizar el costo fijo: ${error.message}` 
        });
        return false;
    }
    return true;
  };
  
  const updateCostsWithoutMonth = async (defaultMonth: string) => {
    const costsWithoutMonth = fixedCosts.filter(cost => !cost.month);
    if (costsWithoutMonth.length === 0) return;

    const updates = costsWithoutMonth.map(cost => 
      supabase.from('fixed_costs').update({ month: defaultMonth }).eq('id', cost.id)
    );

    await Promise.all(updates);
    // The realtime subscription will handle the fetch
  };

  const deleteFixedCost = async (costId: string) => {
    const { error } = await supabase.from('fixed_costs').delete().eq('id', costId);
    if (error) {
      console.error('Error deleting fixed cost:', error.message);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: `No se pudo eliminar el costo fijo: ${error.message}` 
      });
      return false;
    }
    return true;
  };

  return { fixedCosts, isLoading, addFixedCost, updateFixedCost, deleteFixedCost, updateCostsWithoutMonth };
}
