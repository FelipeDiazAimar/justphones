
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './use-toast';
import { slugify } from '@/lib/utils';

export type Subcategories = {
  case: string[];
  accessory: string[];
  auriculares: string[];
};

export function useSubcategories() {
  const supabase = createClient();
  const { toast } = useToast();
  const [subcategories, setSubcategories] = useState<Subcategories>({ case: [], accessory: [], auriculares: [] });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubcategories = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('product_names').select('name, category');

    if (error) {
      console.error('Error fetching product names:', error.message);
      toast({
        variant: 'destructive',
        title: 'Error de Base de Datos',
        description: 'No se pudo cargar la lista de nombres. Asegúrese que la tabla "product_names" existe en Supabase.',
      });
      setSubcategories({ case: [], accessory: [], auriculares: [] });
    } else if (data) {
      const grouped = data.reduce((acc, item) => {
        const category = item.category as keyof Subcategories;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(item.name);
        return acc;
      }, {} as Subcategories);

      const finalGrouped = {
        case: [...new Set(grouped.case || [])].sort(),
        accessory: [...new Set(grouped.accessory || [])].sort(),
        auriculares: [...new Set(grouped.auriculares || [])].sort(),
      };

      setSubcategories(finalGrouped);
    }
    setIsLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
    fetchSubcategories();
  }, [fetchSubcategories]);

  const addSubcategory = async (name: string, category: keyof Subcategories) => {
    const slug = slugify(name);
    const { error } = await supabase.from('product_names').insert([{ name: slug, category }]);
    if (error) {
      console.error('Error adding product name:', error.message);
      const description = error.message.includes('violates row-level security policy')
        ? 'Acción bloqueada por la seguridad de la base de datos. Por favor, revisa las políticas de RLS para la tabla "product_names".'
        : `No se pudo guardar el nombre: ${error.message}`;
      toast({ variant: 'destructive', title: 'Error', description });
      return false;
    }
    await fetchSubcategories();
    return true;
  };

  const updateSubcategory = async (oldName: string, newName: string, category: keyof Subcategories) => {
    const newSlug = slugify(newName);
    
    const { error: updateError } = await supabase
      .from('product_names')
      .update({ name: newSlug })
      .match({ name: oldName, category });
      
    if (updateError) {
      console.error('Error updating product name:', updateError.message);
      const description = updateError.message.includes('violates row-level security policy')
        ? 'Acción bloqueada por la seguridad de la base de datos. Por favor, revisa las políticas de RLS para la tabla "product_names".'
        : `No se pudo actualizar el nombre en la lista maestra: ${updateError.message}`;
      toast({ variant: 'destructive', title: 'Error', description });
      return false;
    }

    const { error: productUpdateError } = await supabase
        .from('products')
        .update({ name: newSlug })
        .match({ name: oldName, category });

    if (productUpdateError) {
        console.error('Error updating products with new name:', productUpdateError.message);
        toast({ variant: 'destructive', title: 'Error Parcial', description: 'El nombre se actualizó pero falló la actualización en los productos existentes.' });
    }
    
    await fetchSubcategories();
    return true;
  };

  const deleteSubcategory = async (name: string, category: keyof Subcategories) => {
    const { error } = await supabase.from('product_names').delete().match({ name, category });
    if (error) {
      console.error('Error deleting product name:', error.message);
      const description = error.message.includes('violates row-level security policy')
        ? 'Acción bloqueada por la seguridad de la base de datos. Por favor, revisa las políticas de RLS para la tabla "product_names".'
        : `No se pudo eliminar el nombre: ${error.message}`;
      toast({ variant: 'destructive', title: 'Error', description });
      return false;
    }
    await fetchSubcategories();
    return true;
  };


  return { subcategories, isLoading, addSubcategory, updateSubcategory, deleteSubcategory };
}
