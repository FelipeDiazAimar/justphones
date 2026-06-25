'use client';

import { useState } from 'react';
import { useToast } from './use-toast';
import { MOCK_MODELS } from '@/lib/mock-data';

export type ModelsByCategory = {
  case: string[];
  accessory: string[];
  auriculares: string[];
};

export function useModels() {
  const { toast } = useToast();
  const [models, setModels] = useState<ModelsByCategory>(MOCK_MODELS);
  const [isLoading] = useState(false);

  const addModel = async (name: string, category: keyof ModelsByCategory): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    setModels(prev => ({
      ...prev,
      [category]: [...(prev[category] || []), name].sort((a, b) => b.localeCompare(a, undefined, { numeric: true })),
    }));
    toast({ title: 'Modelo añadido', description: `"${name}" fue añadido a ${category}.` });
    return true;
  };

  const updateModel = async (oldName: string, newName: string, category: keyof ModelsByCategory): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    setModels(prev => ({
      ...prev,
      [category]: prev[category].map(m => m === oldName ? newName : m),
    }));
    toast({ title: 'Modelo actualizado' });
    return true;
  };

  const deleteModel = async (name: string, category: keyof ModelsByCategory): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    setModels(prev => ({
      ...prev,
      [category]: prev[category].filter(m => m !== name),
    }));
    toast({ title: 'Modelo eliminado' });
    return true;
  };

  const allModels = [...new Set(Object.values(models).flat())].sort();

  return { models, allModels, isLoading, addModel, updateModel, deleteModel };
}
