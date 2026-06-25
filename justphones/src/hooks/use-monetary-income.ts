'use client';

import React, { useState, createContext, useContext, ReactNode } from 'react';
import type { MonetaryIncome } from '@/lib/monetary-income';
import { MOCK_MONETARY_INCOME } from '@/lib/mock-data';
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
  const { toast } = useToast();
  const [monetaryIncome, setMonetaryIncome] = useState<MonetaryIncome[]>(MOCK_MONETARY_INCOME);
  const [isLoading] = useState(false);

  const fetchMonetaryIncome = async () => {
    // No-op in mock mode
  };

  const addMonetaryIncome = async (data: Omit<MonetaryIncome, 'id' | 'created_at'>): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    const newEntry: MonetaryIncome = { ...data, id: `mi-${Date.now()}`, created_at: new Date().toISOString() };
    setMonetaryIncome(prev => [newEntry, ...prev]);
    toast({ title: 'Ingreso registrado' });
    return true;
  };

  const updateMonetaryIncome = async (id: string, data: Partial<Omit<MonetaryIncome, 'id' | 'created_at'>>): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    setMonetaryIncome(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
    toast({ title: 'Ingreso actualizado' });
    return true;
  };

  const deleteMonetaryIncome = async (id: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    setMonetaryIncome(prev => prev.filter(m => m.id !== id));
    toast({ title: 'Ingreso eliminado' });
    return true;
  };

  const value = { monetaryIncome, isLoading, addMonetaryIncome, updateMonetaryIncome, deleteMonetaryIncome, fetchMonetaryIncome };
  return React.createElement(MonetaryIncomeContext.Provider, { value }, children);
}

export function useMonetaryIncome() {
  const context = useContext(MonetaryIncomeContext);
  if (context === undefined) {
    throw new Error('useMonetaryIncome must be used within a MonetaryIncomeProvider');
  }
  return context;
}
