'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { formatPriceARS } from '@/lib/demo';
import {
  generarVentasDemo,
  generarGastosDemo,
  combinarMovimientos,
  calcularResumen,
  agruparPorDia,
  formatearFechaCorta,
} from './datos';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrendingUp, TrendingDown, Wallet, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';

// Recharts solo se usa en esta sección del panel real; en demo se carga
// con import dinámico sin SSR para no sumar peso al primer render.
const GraficoDemo = dynamic(() => import('./grafico-demo'), {
  ssr: false,
  loading: () => (
    <p className="text-sm text-muted-foreground">Cargando gráfico…</p>
  ),
});

export default function VistaDemoFinanzas() {
  const ventas = useMemo(() => generarVentasDemo(), []);
  const gastos = useMemo(() => generarGastosDemo(), []);
  const movimientos = useMemo(
    () => combinarMovimientos(ventas, gastos),
    [ventas, gastos],
  );
  const resumen = useMemo(() => calcularResumen(ventas, gastos), [ventas, gastos]);
  const porDia = useMemo(() => agruparPorDia(movimientos, 14), [movimientos]);

  const tarjetas = [
    {
      titulo: 'Ingresos por ventas',
      valor: formatPriceARS(resumen.totalIngresos),
      detalle: `${resumen.cantidadVentas} ventas · ${resumen.unidadesVendidas} unidades`,
      icono: TrendingUp,
      clase: 'text-green-600 dark:text-green-500',
    },
    {
      titulo: 'Egresos',
      valor: formatPriceARS(resumen.totalEgresos),
      detalle: `${gastos.length} gastos registrados`,
      icono: TrendingDown,
      clase: 'text-red-600 dark:text-red-500',
    },
    {
      titulo: 'Balance del período',
      valor: formatPriceARS(resumen.balance),
      detalle: resumen.balance >= 0 ? 'Resultado positivo' : 'Resultado negativo',
      icono: Wallet,
      clase:
        resumen.balance >= 0
          ? 'text-green-600 dark:text-green-500'
          : 'text-red-600 dark:text-red-500',
    },
    {
      titulo: 'Ticket promedio',
      valor: formatPriceARS(resumen.ticketPromedio),
      detalle: 'Promedio por venta',
      icono: Receipt,
      clase: 'text-foreground',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:py-8">
        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Finanzas</h1>
            <Badge variant="secondary">Demo</Badge>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Vista de demostración con datos de ejemplo generados localmente. Sin
            conexión a base de datos: los movimientos no se guardan.
          </p>
        </header>

        <section aria-label="Resumen" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tarjetas.map((t) => (
            <Card key={t.titulo} className="rounded-2xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.titulo}</CardTitle>
                <t.icono className={cn('h-5 w-5 text-muted-foreground', t.clase)} />
              </CardHeader>
              <CardContent>
                <div className={cn('text-2xl font-bold', t.clase)}>{t.valor}</div>
                <p className="mt-1 text-xs text-muted-foreground">{t.detalle}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section aria-label="Evolución">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Ingresos vs. egresos</CardTitle>
              <CardDescription>Últimos 14 días · montos en ARS</CardDescription>
            </CardHeader>
            <CardContent>
              <GraficoDemo datos={porDia} />
            </CardContent>
          </Card>
        </section>

        <section aria-label="Movimientos">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Movimientos</CardTitle>
              <CardDescription>
                {movimientos.length} movimientos de ejemplo · ordenados por fecha
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead className="hidden sm:table-cell">Detalle</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimientos.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatearFechaCorta(m.fecha)}
                        </TableCell>
                        <TableCell className="font-medium">{m.concepto}</TableCell>
                        <TableCell className="hidden max-w-[220px] truncate text-muted-foreground sm:table-cell">
                          {m.detalle ?? '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={m.tipo === 'ingreso' ? 'default' : 'destructive'}>
                            {m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={cn(
                            'whitespace-nowrap text-right font-semibold',
                            m.tipo === 'ingreso'
                              ? 'text-green-600 dark:text-green-500'
                              : 'text-red-600 dark:text-red-500',
                          )}
                        >
                          {m.tipo === 'ingreso' ? '+' : '−'} {formatPriceARS(m.monto)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>

        <p className="text-xs text-muted-foreground">
          Datos ilustrativos a partir del catálogo de demostración. La gestión
          financiera completa requiere acceso autorizado.
        </p>
      </div>
    </div>
  );
}
