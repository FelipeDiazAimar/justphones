'use client';

import { useState } from 'react';
import type { FAQ } from '@/lib/faq';
import { MOCK_FAQS } from '@/lib/mock-data';
import { useToast } from './use-toast';

export function useFaqs() {
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<FAQ[]>(MOCK_FAQS);
  const [isLoading] = useState(false);

  const addFaq = async (faqData: Omit<FAQ, 'id'>): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    const newFaq: FAQ = { ...faqData, id: `faq-${Date.now()}` };
    setFaqs(prev => [...prev, newFaq]);
    toast({ title: 'Pregunta añadida' });
    return true;
  };

  const updateFaq = async (faqId: string, faqData: Partial<FAQ>): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    setFaqs(prev => prev.map(f => f.id === faqId ? { ...f, ...faqData } : f));
    toast({ title: 'Pregunta actualizada' });
    return true;
  };

  const deleteFaq = async (faqId: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    setFaqs(prev => prev.filter(f => f.id !== faqId));
    toast({ title: 'Pregunta eliminada' });
    return true;
  };

  return { faqs, isLoading, addFaq, updateFaq, deleteFaq };
}
