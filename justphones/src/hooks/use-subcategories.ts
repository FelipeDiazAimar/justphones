'use client';

import { useState } from 'react';
import { useToast } from './use-toast';
import { slugify } from '@/lib/utils';
import { MOCK_SUBCATEGORIES } from '@/lib/mock-data';

export type Subcategories = {
  case: string[];
  accessory: string[];
  auriculares: string[];
};

export function useSubcategories() {
  const { toast } = useToast();
  const [subcategories, setSubcategories] = useState<Subcategories>(MOCK_SUBCATEGORIES);
  const [isLoading] = useState(false);

  const addSubcategory = async (name: string, category: keyof Subcategories): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    const slug = slugify(name);
    setSubcategories(prev => ({
      ...prev,
      [category]: [...new Set([...(prev[category] || []), slug])].sort(),
    }));
    toast({ title: 'Categoría añadida' });
    return true;
  };

  const updateSubcategory = async (oldName: string, newName: string, category: keyof Subcategories): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    const newSlug = slugify(newName);
    setSubcategories(prev => ({
      ...prev,
      [category]: prev[category].map(s => s === oldName ? newSlug : s),
    }));
    toast({ title: 'Categoría actualizada' });
    return true;
  };

  const deleteSubcategory = async (name: string, category: keyof Subcategories): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    setSubcategories(prev => ({
      ...prev,
      [category]: prev[category].filter(s => s !== name),
    }));
    toast({ title: 'Categoría eliminada' });
    return true;
  };

  return { subcategories, isLoading, addSubcategory, updateSubcategory, deleteSubcategory };
}
