'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Code2 } from 'lucide-react';

export default function AdminCodigosPage() {
  return (
    <div className="flex justify-center items-center mt-16">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
             <Code2 className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="mt-4 text-2xl">Próximamente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta sección para la gestión de códigos de descuento estará disponible pronto.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
