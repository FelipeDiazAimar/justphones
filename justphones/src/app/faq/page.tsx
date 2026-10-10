'use client';

import { useMemo, useState } from 'react';
import { Analytics } from "@vercel/analytics/next";
import { Search } from 'lucide-react';
import { MainLayout } from '@/components/main-layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DEMO_FAQS } from '@/lib/demo';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export default function FaqPage() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return DEMO_FAQS;
    return DEMO_FAQS.filter(
      (faq) =>
        normalize(faq.pregunta).includes(q) ||
        normalize(faq.respuesta).includes(q),
    );
  }, [query]);

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
        <h1 className="text-2xl sm:text-4xl font-bold mb-4 text-center font-headline">Preguntas Frecuentes</h1>
        <p className="text-center text-muted-foreground mb-8">
          Respuestas rápidas sobre envíos, compatibilidad, pagos y cambios.
        </p>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por palabra clave… (ej. envío, pago, cambio)"
            aria-label="Buscar preguntas frecuentes"
            className="pl-9"
          />
        </div>

        <p className="text-sm text-muted-foreground mb-4" role="status" aria-live="polite">
          {query.trim()
            ? `${filtered.length} de ${DEMO_FAQS.length} preguntas coinciden con “${query.trim()}”.`
            : `${DEMO_FAQS.length} preguntas en total.`}
        </p>

        {filtered.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {filtered.map((faq) => (
              <AccordionItem value={faq.id} key={faq.id}>
                <AccordionTrigger className="text-lg text-left hover:no-underline">
                  {faq.pregunta}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pb-4">
                  {faq.respuesta}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center space-y-4 py-8">
            <p className="text-muted-foreground">
              No encontramos preguntas que coincidan con tu búsqueda.
            </p>
            <Button variant="outline" onClick={() => setQuery('')}>
              Limpiar búsqueda
            </Button>
          </div>
        )}
      </div>
      <Analytics />
    </MainLayout>
  );
}
