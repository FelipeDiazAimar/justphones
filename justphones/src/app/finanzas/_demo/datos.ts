import { DEMO_PRODUCTS, formatPriceARS } from '@/lib/demo';

export type TipoMovimiento = 'ingreso' | 'egreso';

export interface MovimientoDemo {
  id: string;
  fecha: string; // ISO
  concepto: string;
  detalle?: string;
  tipo: TipoMovimiento;
  monto: number; // siempre positivo; el signo lo da `tipo`
  categoria?: string;
}

export interface VentaDemo {
  id: string;
  fecha: string;
  productoId: string;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

export interface GastoDemo {
  id: string;
  fecha: string;
  concepto: string;
  detalle?: string;
  monto: number;
}

function diasAtrasISO(dias: number, hora = 12): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  d.setHours(hora, 24, 0, 0);
  return d.toISOString();
}

function precioEfectivo(p: (typeof DEMO_PRODUCTS)[number]): number {
  return p.precioOferta ?? p.precio;
}

/**
 * Ventas de ejemplo deterministas a partir de DEMO_PRODUCTS.
 * Sin DB, sin azar: el resultado es estable entre renders.
 */
export function generarVentasDemo(): VentaDemo[] {
  const TOTAL = 18;
  const ventas: VentaDemo[] = [];

  for (let i = 0; i < TOTAL; i++) {
    const producto = DEMO_PRODUCTS[i % DEMO_PRODUCTS.length];
    const cantidad = (i % 3) + 1; // 1..3
    const diasAtras = (i * 5 + (producto.precio % 7)) % 30; // 0..29 disperso
    const precioUnitario = precioEfectivo(producto);
    ventas.push({
      id: `venta-demo-${String(i + 1).padStart(2, '0')}`,
      fecha: diasAtrasISO(diasAtras, 10 + (i % 9)),
      productoId: producto.id,
      producto: producto.nombre,
      cantidad,
      precioUnitario,
      total: cantidad * precioUnitario,
    });
  }

  return ventas.sort((a, b) => +new Date(b.fecha) - +new Date(a.fecha));
}

/**
 * Gastos de ejemplo fijos (local comercial típico). Montos en ARS.
 */
export function generarGastosDemo(): GastoDemo[] {
  return [
    {
      id: 'gasto-demo-01',
      fecha: diasAtrasISO(2, 9),
      concepto: 'Alquiler del local',
      detalle: 'Mensual',
      monto: 350000,
    },
    {
      id: 'gasto-demo-02',
      fecha: diasAtrasISO(4, 11),
      concepto: 'Reposición de stock',
      detalle: 'Vidrios templados y fundas',
      monto: 128500,
    },
    {
      id: 'gasto-demo-03',
      fecha: diasAtrasISO(7, 10),
      concepto: 'Sueldos',
      detalle: 'Medio turno',
      monto: 280000,
    },
    {
      id: 'gasto-demo-04',
      fecha: diasAtrasISO(11, 15),
      concepto: 'Luz + Internet',
      detalle: 'Servicios del local',
      monto: 45200,
    },
    {
      id: 'gasto-demo-05',
      fecha: diasAtrasISO(15, 12),
      concepto: 'Packaging y bolsas',
      detalle: 'Insumos',
      monto: 18900,
    },
    {
      id: 'gasto-demo-06',
      fecha: diasAtrasISO(20, 14),
      concepto: 'Comisiones pasarela de pago',
      detalle: 'Ventas con tarjeta',
      monto: 23400,
    },
    {
      id: 'gasto-demo-07',
      fecha: diasAtrasISO(26, 9),
      concepto: 'Publicidad en redes',
      detalle: 'Campaña mensual',
      monto: 60000,
    },
  ].sort((a, b) => +new Date(b.fecha) - +new Date(a.fecha));
}

export function combinarMovimientos(
  ventas: VentaDemo[],
  gastos: GastoDemo[],
): MovimientoDemo[] {
  const ingresos: MovimientoDemo[] = ventas.map((v) => ({
    id: v.id,
    fecha: v.fecha,
    concepto: `Venta · ${v.producto}`,
    detalle: `${v.cantidad} × ${formatPriceARS(v.precioUnitario)}`,
    tipo: 'ingreso',
    monto: v.total,
    categoria: 'Ventas',
  }));

  const egresos: MovimientoDemo[] = gastos.map((g) => ({
    id: g.id,
    fecha: g.fecha,
    concepto: g.concepto,
    detalle: g.detalle,
    tipo: 'egreso',
    monto: g.monto,
    categoria: 'Gastos',
  }));

  return [...ingresos, ...egresos].sort(
    (a, b) => +new Date(b.fecha) - +new Date(a.fecha),
  );
}

export interface ResumenDemo {
  totalIngresos: number;
  totalEgresos: number;
  balance: number;
  cantidadVentas: number;
  unidadesVendidas: number;
  ticketPromedio: number;
}

export function calcularResumen(
  ventas: VentaDemo[],
  gastos: GastoDemo[],
): ResumenDemo {
  const totalIngresos = ventas.reduce((acc, v) => acc + v.total, 0);
  const totalEgresos = gastos.reduce((acc, g) => acc + g.monto, 0);
  const unidadesVendidas = ventas.reduce((acc, v) => acc + v.cantidad, 0);
  return {
    totalIngresos,
    totalEgresos,
    balance: totalIngresos - totalEgresos,
    cantidadVentas: ventas.length,
    unidadesVendidas,
    ticketPromedio: ventas.length > 0 ? totalIngresos / ventas.length : 0,
  };
}

export interface PuntoDiario {
  fecha: string; // dd/MM
  orden: number;
  Ingresos: number;
  Egresos: number;
}

/** Agrupa ingresos/egresos por día (últimos 14 días) para el gráfico. */
export function agruparPorDia(
  movimientos: MovimientoDemo[],
  dias = 14,
): PuntoDiario[] {
  const mapa = new Map<string, { orden: number; Ingresos: number; Egresos: number }>();
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(hoy);
    d.setDate(d.getDate() - i);
    const clave = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    mapa.set(clave, { orden: dias - i, Ingresos: 0, Egresos: 0 });
  }

  for (const m of movimientos) {
    const f = new Date(m.fecha);
    const diffDias = Math.floor((hoy.getTime() - new Date(f.getFullYear(), f.getMonth(), f.getDate()).getTime()) / 86400000);
    if (diffDias < 0 || diffDias >= dias) continue;
    const clave = new Date(f.getFullYear(), f.getMonth(), f.getDate()).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
    });
    const punto = mapa.get(clave);
    if (!punto) continue;
    if (m.tipo === 'ingreso') punto.Ingresos += m.monto;
    else punto.Egresos += m.monto;
  }

  return Array.from(mapa.entries()).map(([fecha, v]) => ({ fecha, ...v }));
}

export function formatearFechaCorta(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}
