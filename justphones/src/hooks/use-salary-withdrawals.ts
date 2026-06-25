'use client';

import React, { useState, createContext, useContext, ReactNode } from 'react';
import type { SalaryWithdrawal } from '@/lib/salary-withdrawals';
import { MOCK_SALARY_WITHDRAWALS } from '@/lib/mock-data';
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
  const { toast } = useToast();
  const [salaryWithdrawals, setSalaryWithdrawals] = useState<SalaryWithdrawal[]>(MOCK_SALARY_WITHDRAWALS);
  const [isLoading] = useState(false);

  const addSalaryWithdrawal = async (data: Omit<SalaryWithdrawal, 'id' | 'created_at'>): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    const newEntry: SalaryWithdrawal = { ...data, id: `sw-${Date.now()}`, created_at: new Date().toISOString() };
    setSalaryWithdrawals(prev => [newEntry, ...prev]);
    toast({ title: 'Extracción registrada' });
    return true;
  };

  const updateSalaryWithdrawal = async (id: string, data: Partial<Omit<SalaryWithdrawal, 'id' | 'created_at'>>): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    setSalaryWithdrawals(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    toast({ title: 'Extracción actualizada' });
    return true;
  };

  const deleteSalaryWithdrawal = async (id: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    setSalaryWithdrawals(prev => prev.filter(s => s.id !== id));
    toast({ title: 'Extracción eliminada' });
    return true;
  };

  const value = { salaryWithdrawals, isLoading, addSalaryWithdrawal, updateSalaryWithdrawal, deleteSalaryWithdrawal };
  return React.createElement(SalaryContext.Provider, { value }, children);
}

export function useSalaryWithdrawals() {
  const context = useContext(SalaryContext);
  if (context === undefined) {
    throw new Error('useSalaryWithdrawals must be used within a SalaryWithdrawalsProvider');
  }
  return context;
}
