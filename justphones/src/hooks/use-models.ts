
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './use-toast';
import { expandModelString } from '@/lib/utils';

export type ModelsByCategory = {
  case: string[];
  accessory: string[];
  auriculares: string[];
};

export function useModels() {
  const supabase = createClient();
  const { toast } = useToast();
  const [models, setModels] = useState<ModelsByCategory>({ case: [], accessory: [], auriculares: [] });
  const [isLoading, setIsLoading] = useState(true);

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('models').select('name, category');

    if (error) {
      console.error('Error fetching models:', error.message);
      toast({
        variant: 'destructive',
        title: 'Error de Base de Datos',
        description: `No se pudo cargar la lista de modelos. Error: ${error.message}`,
      });
      setModels({ case: [], accessory: [], auriculares: [] });
    } else if (data) {
      const grouped = data.reduce((acc, item) => {
        const category = item.category as keyof ModelsByCategory;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(item.name);
        return acc;
      }, {} as ModelsByCategory);
      
      const expandAllModels = (modelList: string[] = []): string[] => {
          const allIndividualModels = modelList.flatMap(m => expandModelString(m));
          return [...new Set(allIndividualModels)];
      };
      
      const finalGrouped: ModelsByCategory = {
        case: expandAllModels(grouped.case).sort((a,b) => b.localeCompare(a, undefined, { numeric: true })),
        accessory: expandAllModels(grouped.accessory).sort(),
        auriculares: expandAllModels(grouped.auriculares).sort(),
      };
      
      setModels(finalGrouped);
    }
    setIsLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const addModel = async (name: string, category: keyof ModelsByCategory) => {
    const { error } = await supabase.from('models').insert([{ name, category }]);
    if (error) {
      console.error('Error adding model:', error.message);
      const description = error.message.includes('violates row-level security policy')
        ? 'Acción bloqueada por la seguridad de la base de datos. Por favor, revisa las políticas de RLS para la tabla "models".'
        : `No se pudo guardar el modelo: ${error.message}`;
      toast({ 
        variant: 'destructive', 
        title: 'Error al guardar modelo', 
        description
      });
      return false;
    }
    await fetchModels();
    return true;
  };

  const updateModel = async (oldName: string, newName: string, category: keyof ModelsByCategory) => {
    const { error } = await supabase.from('models').update({ name: newName }).match({ name: oldName, category });
    if (error) {
      console.error('Error updating model:', error.message);
      const description = error.message.includes('violates row-level security policy')
        ? 'Acción bloqueada por la seguridad de la base de datos. Por favor, revisa las políticas de RLS para la tabla "models".'
        : `No se pudo actualizar el modelo: ${error.message}`;
      toast({ 
        variant: 'destructive', 
        title: 'Error al actualizar modelo', 
        description
      });
      return false;
    }
    const { error: productUpdateError } = await supabase.from('products').update({ model: newName }).match({ model: oldName, category });
    if(productUpdateError){
        console.error('Error updating products with new model:', productUpdateError.message);
    }
    await fetchModels();
    return true;
  };
  
  const deleteModel = async (name: string, category: keyof ModelsByCategory) => {
    const { error } = await supabase.from('models').delete().match({ name, category });
    if (error) {
      console.error('Error deleting model:', error.message);
      const description = error.message.includes('violates row-level security policy')
        ? 'Acción bloqueada por la seguridad de la base de datos. Por favor, revisa las políticas de RLS para la tabla "models".'
        : `No se pudo eliminar el modelo: ${error.message}`;
      toast({ 
        variant: 'destructive', 
        title: 'Error al eliminar modelo', 
        description
      });
      return false;
    }
    await fetchModels();
    return true;
  };

  const allModels = [...new Set(Object.values(models).flat())].sort();

  return { models, allModels, isLoading, addModel, updateModel, deleteModel };
}
