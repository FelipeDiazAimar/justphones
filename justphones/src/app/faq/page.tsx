'use client';

import { MainLayout } from '@/components/main-layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useFaqs } from '@/hooks/use-faqs';
import { Skeleton } from '@/components/ui/skeleton';

export default function FaqPage() {
  const { faqs, isLoading } = useFaqs();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto py-8">
          <Skeleton className="h-10 w-1/2 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">Preguntas Frecuentes</h1>
        {faqs.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq) => (
              <AccordionItem value={faq.id} key={faq.id}>
                <AccordionTrigger className="text-lg text-left hover:no-underline">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-center text-muted-foreground">No hay preguntas frecuentes en este momento.</p>
        )}
      </div>
    </MainLayout>
  );
}
