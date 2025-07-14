
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './use-toast';

export type ProductView = {
  product_id: string;
  view_count: number;
};

export function useProductViews() {
  const supabase = createClient();
  const { toast } = useToast();
  const [productViews, setProductViews] = useState<ProductView[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProductViews = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('product_views')
      .select('*')
      .order('view_count', { ascending: false });

    if (error) {
      console.error('Error fetching product views:', error.message);
      setProductViews([]);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar las vistas de productos.' });
    } else {
      setProductViews(data as ProductView[]);
    }
    setIsLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
    fetchProductViews();
  }, [fetchProductViews]);

  return { productViews, isLoading, fetchProductViews };
}
