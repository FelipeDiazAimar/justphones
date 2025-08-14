
'use client';

import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import type { MonetaryIncome } from '@/lib/monetary-income';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './use-toast';

interface MonetaryIncomeContextType {
  monetaryIncome: MonetaryIncome[];
  isLoading: boolean;
  addMonetaryIncome: (data: Omit<MonetaryIncome, 'id' | 'created_at'>) => Promise<boolean>;
  updateMonetaryIncome: (id: string, data: Partial<Omit<MonetaryIncome, 'id' | 'created_at'>>) => Promise<boolean>;
  deleteMonetaryIncome: (id: string) => Promise<boolean>;
  fetchMonetaryIncome: () => Promise<void>;
}

const MonetaryIncomeContext = createContext<MonetaryIncomeContextType | undefined>(undefined);

export function MonetaryIncomeProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const { toast } = useToast();
  const [monetaryIncome, setMonetaryIncome] = useState<MonetaryIncome[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMonetaryIncome = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('monetary_income').select('*').order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching monetary income:', error.message);
      setMonetaryIncome([]);
      toast({ 
          variant: 'destructive', 
          title: 'Error de Base de Datos', 
          description: `No se pudieron cargar los ingresos monetarios. Error: ${error.message}` 
      });
    } else {
      setMonetaryIncome(data as MonetaryIncome[]);
    }
    setIsLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
    fetchMonetaryIncome();
    const channel = supabase
      .channel('monetary_income_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'monetary_income' },
        () => fetchMonetaryIncome()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMonetaryIncome, supabase]);
  
  const addMonetaryIncome = async (data: Omit<MonetaryIncome, 'id' | 'created_at'>) => {
    const { error } = await supabase.from('monetary_income').insert([data]);
    if (error) {
      console.error('Error adding monetary income:', error.message);
      const description = error.message.includes('violates row-level security policy')
        ? 'Acción bloqueada por la seguridad de la base de datos. Por favor, revisa las políticas de RLS para la tabla "monetary_income".'
        : `No se pudo registrar el ingreso: ${error.message}`;
      toast({ 
          variant: 'destructive', 
          title: 'Error', 
          description 
      });
      return false;
    }
    return true;
  };
  
  const updateMonetaryIncome = async (id: string, data: Partial<Omit<MonetaryIncome, 'id' | 'created_at'>>) => {
    const { error } = await supabase.from('monetary_income').update(data).eq('id', id);
    if (error) {
        console.error('Error updating monetary income:', error.message);
        const description = error.message.includes('violates row-level security policy')
          ? 'Acción bloqueada por la seguridad de la base de datos. Por favor, revisa las políticas de RLS para la tabla "monetary_income".'
          : `No se pudo actualizar el ingreso: ${error.message}`;
        toast({ 
            variant: 'destructive', 
            title: 'Error', 
            description 
        });
        return false;
    }
    return true;
  };
  
  const deleteMonetaryIncome = async (id: string) => {
    const { error } = await supabase.from('monetary_income').delete().eq('id', id);
    if (error) {
      console.error('Error deleting monetary income:', error.message);
      const description = error.message.includes('violates row-level security policy')
        ? 'Acción bloqueada por la seguridad de la base de datos. Por favor, revisa las políticas de RLS para la tabla "monetary_income".'
        : `No se pudo eliminar el ingreso: ${error.message}`;
      toast({ 
          variant: 'destructive', 
          title: 'Error', 
          description 
      });
      return false;
    }
    return true;
  };

  const value = {
      monetaryIncome,
      isLoading,
      addMonetaryIncome,
      updateMonetaryIncome,
      deleteMonetaryIncome,
      fetchMonetaryIncome
  };

  return React.createElement(MonetaryIncomeContext.Provider, { value }, children);
}

export function useMonetaryIncome() {
  const context = useContext(MonetaryIncomeContext);
  if (context === undefined) {
    throw new Error('useMonetaryIncome must be used within a MonetaryIncomeProvider');
  }
  return context;
}
