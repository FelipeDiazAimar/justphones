'use client';

import { useState } from 'react';
import type { FixedCost } from '@/lib/fixed-costs';
import { MOCK_FIXED_COSTS } from '@/lib/mock-data';
import { useToast } from './use-toast';

export function useFixedCosts() {
  const { toast } = useToast();
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>(MOCK_FIXED_COSTS);
  const [isLoading] = useState(false);

  const addFixedCost = async (costData: Omit<FixedCost, 'id' | 'created_at'>): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    const newCost: FixedCost = {
      ...costData,
      id: `fc-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setFixedCosts(prev => [newCost, ...prev]);
    toast({ title: 'Costo fijo añadido' });
    return true;
  };

  const updateFixedCost = async (costId: string, costData: Partial<Omit<FixedCost, 'id' | 'created_at'>>): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    setFixedCosts(prev => prev.map(c => c.id === costId ? { ...c, ...costData } : c));
    toast({ title: 'Costo fijo actualizado' });
    return true;
  };

  const updateCostsWithoutMonth = async (_defaultMonth: string): Promise<void> => {
    // No-op in mock mode
  };

  const deleteFixedCost = async (costId: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    setFixedCosts(prev => prev.filter(c => c.id !== costId));
    toast({ title: 'Costo fijo eliminado' });
    return true;
  };

  return { fixedCosts, isLoading, addFixedCost, updateFixedCost, deleteFixedCost, updateCostsWithoutMonth };
}
