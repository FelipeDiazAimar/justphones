'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { PuntoDiario } from './datos';

function formatoEje(valor: number): string {
  if (valor >= 1000000) return `${Math.round(valor / 1000000)} M`;
  if (valor >= 1000) return `${Math.round(valor / 1000)} k`;
  return `${valor}`;
}

export default function GraficoDemo({ datos }: { datos: PuntoDiario[] }) {
  if (!datos.length) {
    return (
      <p className="text-sm text-muted-foreground">Sin datos para graficar.</p>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
          <XAxis dataKey="fecha" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis tickFormatter={formatoEje} tick={{ fontSize: 11 }} width={52} />
          <Tooltip
            formatter={(value, nombre) => [
              `$ ${(Number(value) || 0).toLocaleString('es-AR')}`,
              String(nombre ?? ''),
            ]}
          />
          <Legend />
          <Bar dataKey="Ingresos" fill="#16a34a" radius={[6, 6, 0, 0]} />
          <Bar dataKey="Egresos" fill="#dc2626" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
