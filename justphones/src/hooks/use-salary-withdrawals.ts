
'use client';

import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import type { SalaryWithdrawal } from '@/lib/salary-withdrawals';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './use-toast';

interface SalaryContextType {
  salaryWithdrawals: SalaryWithdrawal[];
  isLoading: boolean;
  addSalaryWithdrawal: (data: Omit<SalaryWithdrawal, 'id' | 'created_at'>) => Promise<boolean>;
  updateSalaryWithdrawal: (id: string, data: Partial<Omit<SalaryWithdrawal, 'id' | 'created_at'>>) => Promise<boolean>;
  deleteSalaryWithdrawal: (id: string) => Promise<boolean>;
}

const SalaryContext = createContext<SalaryContextType | undefined>(undefined);

export function SalaryWithdrawalsProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const { toast } = useToast();
  const [salaryWithdrawals, setSalaryWithdrawals] = useState<SalaryWithdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSalaryWithdrawals = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('salary_withdrawals').select('*').order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching salary withdrawals:', error.message);
      setSalaryWithdrawals([]);
      toast({ 
          variant: 'destructive', 
          title: 'Error de Base de Datos', 
          description: `No se pudieron cargar las extracciones de sueldo. Error: ${error.message}` 
      });
    } else {
      setSalaryWithdrawals(data as SalaryWithdrawal[]);
    }
    setIsLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
    fetchSalaryWithdrawals();
    const channel = supabase
      .channel('salary_withdrawals_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'salary_withdrawals' },
        () => fetchSalaryWithdrawals()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSalaryWithdrawals, supabase]);
  
  const addSalaryWithdrawal = async (data: Omit<SalaryWithdrawal, 'id' | 'created_at'>) => {
    const { error } = await supabase.from('salary_withdrawals').insert([data]);
    if (error) {
      console.error('Error adding salary withdrawal:', error.message);
      toast({ 
          variant: 'destructive', 
          title: 'Error', 
          description: `No se pudo registrar la extracción: ${error.message}` 
      });
      return false;
    }
    return true;
  };
  
  const updateSalaryWithdrawal = async (id: string, data: Partial<Omit<SalaryWithdrawal, 'id' | 'created_at'>>) => {
    const { error } = await supabase.from('salary_withdrawals').update(data).eq('id', id);
    if (error) {
        console.error('Error updating salary withdrawal:', error.message);
        toast({ 
            variant: 'destructive', 
            title: 'Error', 
            description: `No se pudo actualizar la extracción: ${error.message}` 
        });
        return false;
    }
    return true;
  };
  
  const deleteSalaryWithdrawal = async (id: string) => {
    const { error } = await supabase.from('salary_withdrawals').delete().eq('id', id);
    if (error) {
      console.error('Error deleting salary withdrawal:', error.message);
      toast({ 
          variant: 'destructive', 
          title: 'Error', 
          description: `No se pudo eliminar la extracción: ${error.message}` 
      });
      return false;
    }
    return true;
  };

  const value = {
      salaryWithdrawals,
      isLoading,
      addSalaryWithdrawal,
      updateSalaryWithdrawal,
      deleteSalaryWithdrawal
  };

  return React.createElement(SalaryContext.Provider, { value }, children);
}

export function useSalaryWithdrawals() {
  const context = useContext(SalaryContext);
  if (context === undefined) {
    throw new Error('useSalaryWithdrawals must be used within a SalaryWithdrawalsProvider');
  }
  return context;
}
