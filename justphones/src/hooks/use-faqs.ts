
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FAQ } from '@/lib/faq';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './use-toast';

export function useFaqs() {
  const supabase = createClient();
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFaqs = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('faqs').select('*');

    if (error) {
      console.error('Error fetching FAQs:', error.message);
      setFaqs([]);
    } else {
      setFaqs(data as FAQ[]);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);
  
  const addFaq = async (faqData: Omit<FAQ, 'id'>) => {
    const { error } = await supabase.from('faqs').insert([faqData]);
    if (error) {
      console.error('Error adding FAQ:', error.message);
      const description = error.message.includes('violates row-level security policy')
        ? 'Acción bloqueada por la seguridad de la base de datos. Por favor, revisa las políticas de RLS para la tabla "faqs".'
        : `No se pudo crear la pregunta: ${error.message}`;
      toast({ variant: 'destructive', title: 'Error', description });
      return false;
    }
    await fetchFaqs();
    return true;
  };
  
  const updateFaq = async (faqId: string, faqData: Partial<FAQ>) => {
    const { error } = await supabase.from('faqs').update(faqData).eq('id', faqId);
    if (error) {
      console.error('Error updating FAQ:', error.message);
      const description = error.message.includes('violates row-level security policy')
        ? 'Acción bloqueada por la seguridad de la base de datos. Por favor, revisa las políticas de RLS para la tabla "faqs".'
        : `No se pudo actualizar la pregunta: ${error.message}`;
      toast({ variant: 'destructive', title: 'Error', description });
      return false;
    }
    await fetchFaqs();
    return true;
  };

  const deleteFaq = async (faqId: string) => {
    const { error } = await supabase.from('faqs').delete().eq('id', faqId);
    if (error) {
      console.error('Error deleting FAQ:', error.message);
      const description = error.message.includes('violates row-level security policy')
        ? 'Acción bloqueada por la seguridad de la base de datos. Por favor, revisa las políticas de RLS para la tabla "faqs".'
        : `No se pudo eliminar la pregunta: ${error.message}`;
      toast({ variant: 'destructive', title: 'Error', description });
      return false;
    }
    await fetchFaqs();
    return true;
  };

  return { faqs, isLoading, addFaq, updateFaq, deleteFaq };
}
