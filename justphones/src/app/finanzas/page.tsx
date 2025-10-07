'use client';

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  subDays,
  parseISO,
  startOfToday,
  startOfWeek,
  startOfMonth,
  startOfYear,
  isAfter,
  getDaysInMonth,
  getMonth,
} from 'date-fns';
import { es } from 'date-fns/locale';

import { useSales } from '@/hooks/use-sales';
import { useProducts } from '@/hooks/use-products';
import { useProductViews } from '@/hooks/use-product-views';
import { useCustomerRequests } from '@/hooks/use-customer-requests';
import { useStockHistory } from '@/hooks/use-stock-history';
import { useFixedCosts } from '@/hooks/use-fixed-costs';
import {
  useSalaryWithdrawals,
  SalaryWithdrawalsProvider,
} from '@/hooks/use-salary-withdrawals';
import {
  useMonetaryIncome,
  MonetaryIncomeProvider,
} from '@/hooks/use-monetary-income';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Goal,
  Banknote,
  Coins,
  PackageSearch,
  PlusCircle,
  Trash,
  Wallet,
  ChevronDown,
  BarChart,
  PieChart as PieIcon,
  Settings,
  AlertTriangle,
  Zap,
  Home,
  Lightbulb,
  Package,
  ShoppingBag,
  Loader2,
  PiggyBank,
  Menu,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  type TooltipProps,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, unslugify } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { Product } from '@/lib/products';
import type { SalaryWithdrawal } from '@/lib/salary-withdrawals';
import type { MonetaryIncome } from '@/lib/monetary-income';
import type { FixedCost } from '@/lib/fixed-costs';
import type { StockHistory } from '@/lib/stock-history';
import { ThemeToggle } from '@/components/theme-toggle';

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

const navigationItems = [
  { id: 'resumen', label: 'Resumen', icon: Home },
  { id: 'acciones', label: 'Acciones', icon: Zap },
  { id: 'insights', label: 'Insights', icon: Lightbulb },
  { id: 'graficos', label: 'Gráficos', icon: BarChart },
  { id: 'categorias', label: 'Categorías', icon: PieIcon },
  { id: 'rentabilidad', label: 'Rentabilidad', icon: TrendingUp },
  { id: 'costos', label: 'Costos', icon: Settings },
  { id: 'pedidos', label: 'Pedidos', icon: PackageSearch },
];

const fixedCostSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  amount: z.coerce.number().min(0.01, 'El monto debe ser mayor a 0.'),
});

const salaryWithdrawalSchema = z.object({
  amount: z.coerce.number().min(1, 'El monto debe ser mayor a 1.'),
  description: z.string().optional(),
});

const monetaryIncomeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  amount: z.coerce.number().min(1, 'El monto debe ser mayor a 1.'),
  description: z.string().optional(),
});

const ITEMS_PER_PAGE_RENTABILIDAD = 8;
type StatsPeriod = string; // 'all' or closure ID

type ClosureEntry = {
  id: string;
  month: string;
  startDate: string;
  createdAt?: string | null;
};

const EditablePriceCell = ({
  product,
  field,
  value,
}: {
  product: Product;
  field: 'cost' | 'price';
  value: number;
}) => {
  const { updateProduct } = useProducts();
  const { toast } = useToast();
  const [currentValue, setCurrentValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleUpdate = async () => {
    setIsEditing(false);
    if (currentValue === value) return;

    const success = await updateProduct(product.id, { [field]: currentValue });
    if (success) {
      toast({
        title: `${field === 'cost' ? 'Costo' : 'Precio'} actualizado`,
        description: `El ${field} de ${unslugify(product.name)} se actualizó a $${currentValue.toLocaleString()}.`,
      });
    } else {
      setCurrentValue(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleUpdate();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setCurrentValue(value);
    }
  };

  return isEditing ? (
    <Input
      type="number"
      value={currentValue}
      onChange={(e) => setCurrentValue(Number(e.target.value))}
      onBlur={handleUpdate}
      onKeyDown={handleKeyDown}
      className="w-24 text-right h-8"
      autoFocus
      onFocus={(e) => e.target.select()}
    />
  ) : (
    <div
      onClick={() => setIsEditing(true)}
      className="cursor-pointer text-right w-full h-full px-2 py-1 rounded-md hover:bg-muted"
    >
      ${value.toLocaleString()}
    </div>
  );
};

const FinancialKpiCard = ({
  title,
  value,
  icon: Icon,
  detail,
  colorClass,
  children,
  custom,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  detail: string;
  colorClass?: string;
  children?: React.ReactNode;
  custom: number;
}) => (
  <Collapsible asChild>
    <motion.div
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay: custom * 0.1 }}
    >
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full -mr-2 -mt-2">
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={cn('text-3xl font-bold', colorClass)}>{value}</div>
            <Icon className={cn('h-6 w-6 text-muted-foreground', colorClass)} />
          </div>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </CardContent>
        <CollapsibleContent>
          <div className="px-6 pb-4 text-xs text-muted-foreground space-y-1 bg-muted/50 border-t">
            {children}
          </div>
        </CollapsibleContent>
      </Card>
    </motion.div>
  </Collapsible>
);

type TooltipDatum = NonNullable<TooltipProps<number, string>['payload']>[number];

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const entries = payload as TooltipDatum[];
    return (
      <div className="rounded-lg border bg-background/80 backdrop-blur-sm p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">Fecha</span>
            <span className="font-bold text-muted-foreground">{label}</span>
          </div>
          {entries.map((p) => {
            if (!p) return null;
            const color = (p.color as string) || 'hsl(var(--primary))';
            const rawValue = p.value;
            const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue ?? 0);
            return (
              <div className="flex flex-col" key={String(p.dataKey)}>
                <span
                  className="text-[0.70rem] uppercase text-muted-foreground"
                  style={{ color }}
                >
                  {p.name}
                </span>
                <span className="font-bold" style={{ color }}>
                  ${numericValue.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

function FinanceDashboard() {
  const { sales, isLoading: isLoadingSales } = useSales();
  const { products, isLoading: isLoadingProducts } = useProducts();
  const { customerRequests, isLoading: isLoadingRequests } = useCustomerRequests();
  const { productViews, isLoading: isLoadingViews } = useProductViews();
  const { stockHistory, isLoading: isLoadingStock } = useStockHistory();
  const { fixedCosts, addFixedCost, deleteFixedCost } = useFixedCosts();
  const {
    salaryWithdrawals,
    addSalaryWithdrawal,
    deleteSalaryWithdrawal,
  } = useSalaryWithdrawals();
  const { monetaryIncome, addMonetaryIncome, deleteMonetaryIncome } = useMonetaryIncome();

  const [closures, setClosures] = useState<ClosureEntry[]>([]);
  const [isLoadingClosures, setIsLoadingClosures] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [popularitySort, setPopularitySort] = useState<'sales' | 'requests' | 'views'>('sales');
  const [rentabilidadSort, setRentabilidadSort] = useState<{
    column: 'name' | 'cost' | 'price' | 'profit' | 'margin' | 'stock';
    direction: 'asc' | 'desc';
  }>({ column: 'profit', direction: 'desc' });
  const [rentabilidadCurrentPage, setRentabilidadCurrentPage] = useState(1);
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>('');
  const [activeSection, setActiveSection] = useState('resumen');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set default to last closure when closures are loaded
  useEffect(() => {
    if (closures.length > 0) {
      const sortedClosures = [...closures].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      const lastClosure = sortedClosures[sortedClosures.length - 1];
      setStatsPeriod(lastClosure.id);
    } else if (closures.length === 0) {
      setStatsPeriod('all');
    }
  }, [closures]);

  const { toast } = useToast();

    const refreshClosures = useCallback(async () => {
      setIsLoadingClosures(true);
      try {
        const response = await fetch('/api/admin/finance-closures', {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success || !Array.isArray(result.data)) {
          throw new Error(result?.error ?? 'No se pudieron cargar los cierres de caja.');
        }

        const normalized: ClosureEntry[] = (result.data as Array<Record<string, unknown>>)
          .map((record) => {
            const id = typeof record['id'] === 'string' ? (record['id'] as string) : null;
            const month = typeof record['month'] === 'string' ? (record['month'] as string) : null;
            const startDateRaw =
              typeof record['start_date'] === 'string'
                ? (record['start_date'] as string)
                : typeof record['startDate'] === 'string'
                  ? (record['startDate'] as string)
                  : null;
            const createdAt =
              typeof record['created_at'] === 'string'
                ? (record['created_at'] as string)
                : typeof record['createdAt'] === 'string'
                  ? (record['createdAt'] as string)
                  : null;

            if (!id || !month || !startDateRaw) {
              return null;
            }

            return {
              id,
              month,
              startDate: startDateRaw,
              createdAt,
            } as ClosureEntry;
          })
          .filter((item): item is ClosureEntry => item !== null);

        normalized.sort(
          (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
        );
        setClosures(normalized);
      } catch (error) {
        console.error('[Finanzas] Error cargando cierres:', error);
        const message =
          error instanceof Error ? error.message : 'No se pudieron cargar los cierres de caja.';
        toast({ variant: 'destructive', title: 'Error de cierres', description: message });
        setClosures([]);
      } finally {
        setIsLoadingClosures(false);
      }
    }, [toast]);

    useEffect(() => {
      refreshClosures();
    }, [refreshClosures]);

  const {
    register: registerFixedCost,
    handleSubmit: handleSubmitFixedCost,
    reset: resetFixedCost,
  } = useForm<{ name: string; amount: number }>({
    resolver: zodResolver(fixedCostSchema),
    defaultValues: { name: '', amount: 0 },
  });
  const {
    register: registerSalary,
    handleSubmit: handleSubmitSalary,
    reset: resetSalary,
  } = useForm<{ amount: number; description?: string }>({
    resolver: zodResolver(salaryWithdrawalSchema),
    defaultValues: { amount: 0, description: '' },
  });
  const {
    register: registerIncome,
    handleSubmit: handleSubmitIncome,
    reset: resetIncome,
  } = useForm<{ name: string; amount: number; description?: string }>({
    resolver: zodResolver(monetaryIncomeSchema),
    defaultValues: { name: '', amount: 0, description: '' },
  });

  const onFixedCostSubmit = async (data: { name: string; amount: number }) => {
    if (await addFixedCost(data as Omit<FixedCost, 'id' | 'created_at'>)) {
      toast({ title: 'Costo Fijo Añadido' });
      resetFixedCost({ name: '', amount: 0 });
    }
  };

  const onSalarySubmit = async (data: { amount: number; description?: string }) => {
    const payload: Omit<SalaryWithdrawal, 'id' | 'created_at'> = {
      amount: data.amount,
      description: data.description,
    };
    if (await addSalaryWithdrawal(payload)) {
      toast({ title: 'Extracción de Sueldo Registrada' });
      resetSalary({ amount: 0, description: '' });
    }
  };

  const onIncomeSubmit = async (data: {
    name: string;
    amount: number;
    description?: string;
  }) => {
    const payload: Omit<MonetaryIncome, 'id' | 'created_at'> = {
      name: data.name,
      amount: data.amount,
      description: data.description,
    };
    if (await addMonetaryIncome(payload)) {
      toast({ title: 'Ingreso Monetario Registrado' });
      resetIncome({ name: '', amount: 0, description: '' });
    }
  };

  const isLoading =
    isLoadingSales ||
    isLoadingProducts ||
    isLoadingRequests ||
    isLoadingViews ||
    isLoadingStock;

  const financialSummaryDetails = useMemo(() => {
    const selectedClosure = statsPeriod === 'all' ? null : closures.find(c => c.id === statsPeriod);

    const filterByClosure = <T extends { created_at: string }>(items: T[]): T[] => {
      if (!selectedClosure) return items;
      return items.filter(item => new Date(item.created_at) >= new Date(selectedClosure.startDate));
    };

    const filteredSales = filterByClosure(sales);
    const filteredSalaryWithdrawals = filterByClosure(salaryWithdrawals);
    const filteredMonetaryIncome = filterByClosure(monetaryIncome);
    const filteredStockHistory = filterByClosure(stockHistory);
    const filteredCustomerRequests = filterByClosure(customerRequests);
    const productsMap = new Map(products.map((p) => [p.id, p]));
    const today = new Date();

    const totalCostOfGoods = filteredSales.reduce((sum, sale) => {
      const product = productsMap.get(sale.product_id);
      return sum + ((product?.cost || 0) * sale.quantity);
    }, 0);

    const monthlyFixedCosts = fixedCosts.reduce((sum, cost) => sum + cost.amount, 0);
    const totalFixedCostsForPeriod = - fixedCosts.reduce((sum, cost) => sum + cost.amount, 0);

    const totalSalaryWithdrawn = - filteredSalaryWithdrawals.reduce(
      (sum, s) => sum + s.amount,
      0,
    );

    const positiveMonetaryIncome = filteredMonetaryIncome.filter(i => i.amount > 0).reduce((sum, i) => sum + i.amount, 0);
    const negativeMonetaryIncome = filteredMonetaryIncome.filter(i => i.amount < 0).reduce((sum, i) => sum + Math.abs(i.amount), 0);

    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total_price, 0) + positiveMonetaryIncome;

    const totalStockInvestment = - filteredStockHistory.reduce(
      (sum, entry) => sum + (entry.cost || 0) * entry.quantity_added,
      0,
    );

    const totalCosts = totalFixedCostsForPeriod + totalSalaryWithdrawn + totalStockInvestment + negativeMonetaryIncome;
    const netProfit = totalRevenue + totalCosts;

    const totalStockValue = products.reduce((sum, p) => {
      const stock = p.colors.reduce((colorSum, c) => colorSum + c.stock, 0);
      return sum + p.cost * stock;
    }, 0);

    const totalMonetaryIncome = filteredMonetaryIncome.reduce(
      (sum, income) => sum + income.amount,
      0,
    );

    const netWorth = totalStockValue;

    const totalItemsSoldCount = filteredSales.reduce(
      (acc, sale) => acc + sale.quantity,
      0,
    );
    const totalItemsRequestedCount = filteredCustomerRequests.reduce(
      (acc, item) => acc + item.quantity,
      0,
    );
    const conversionRate =
      totalItemsRequestedCount > 0
        ? (totalItemsSoldCount / totalItemsRequestedCount) * 100
        : 0;

    // Breakdowns
    const revenueBreakdown = filteredSales
      .map(sale => {
        const product = productsMap.get(sale.product_id);
        return {
          label: `${unslugify(product?.name || 'Unknown')} (${sale.quantity} × $${sale.price_per_unit})`,
          value: sale.total_price,
          isNegative: false,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const monetaryMovementsBreakdown = filteredMonetaryIncome
      .map(income => {
        const isEgreso = income.name.startsWith('[EGRESO]') || income.amount < 0;
        return {
          label: isEgreso ? income.name.replace('[EGRESO] ', '') : income.name,
          value: Math.abs(income.amount),
          isNegative: isEgreso,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const fixedCostsBreakdown = fixedCosts
      .map(cost => ({
        label: cost.name,
        value: cost.amount,
        isNegative: true,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const salaryWithdrawalsBreakdown = filteredSalaryWithdrawals
      .map(salary => ({
        label: salary.description || 'Extracción de sueldo',
        value: salary.amount,
        isNegative: true,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const groupedPedidos = filteredStockHistory.reduce((acc, entry) => {
      const pedidoId = entry.pedido_id;
      if (!acc[pedidoId]) {
        acc[pedidoId] = {
          date: new Date(entry.created_at),
          totalCost: 0,
          items: [],
        };
      }
      const cost = (entry.cost || 0) * entry.quantity_added;
      acc[pedidoId].totalCost += cost;
      acc[pedidoId].items.push({
        product: entry.product_name,
        quantity: entry.quantity_added,
        cost: entry.cost || 0,
        totalCost: cost,
      });
      return acc;
    }, {} as Record<string, { date: Date; totalCost: number; items: unknown[] }>);

    const pedidoCostsBreakdown = Object.entries(groupedPedidos)
      .map(([pedidoId, { date, totalCost, items }]) => ({
        label: `Pedido ${format(date, 'dd/MM/yyyy')} (${items.length} items)`,
        value: totalCost,
        isNegative: true,
        items,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const stockValueBreakdown = products
      .filter(p => p.colors.some(c => c.stock > 0))
      .map(product => {
        const stock = product.colors.reduce((sum, c) => sum + c.stock, 0);
        const total = product.cost * stock;
        return {
          label: `${unslugify(product.name)} (${stock} × $${product.cost})`,
          value: total,
          isNegative: false,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const capitalBreakdown = (() => {
      const out = [] as Array<{ month: string; income: number; costs: number; net: number; cumulative: number }>;
      if (closures.length === 0) return out;
      const sorted = [...closures].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      const relevantClosures = statsPeriod === 'all' ? sorted.slice(-6) : (selectedClosure ? sorted.filter(c => new Date(c.startDate) <= new Date(selectedClosure.startDate)).slice(-6) : sorted.slice(-6));
      let totalIngresos = 0;
      let totalCostos = 0;
      relevantClosures.forEach((c, idx) => {
        const start = new Date(c.startDate);
        const next = relevantClosures[idx + 1];
        const end = next ? new Date(new Date(next.startDate).getTime() - 1) : new Date();
        const labelDate = new Date(Number(c.month.split('-')[0]), Number(c.month.split('-')[1]) - 1, 1);
        const label = labelDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

        const ventas = sales.filter(s => {
          const d = parseISO(s.created_at);
          return d >= start && d <= end;
        }).reduce((acc, s) => acc + s.total_price, 0);
        const ingresosPositivos = monetaryIncome.filter(mi => {
          const d = parseISO(mi.created_at);
          return (!mi.name.startsWith('[EGRESO]') && mi.amount > 0) && d >= start && d <= end;
        }).reduce((acc, mi) => acc + mi.amount, 0);
        const ingresosMes = ventas + ingresosPositivos;

        const costosFijos = fixedCosts.reduce((acc, c2) => acc + c2.amount, 0);
        const sueldos = salaryWithdrawals.filter(w => {
          const d = parseISO(w.created_at);
          return d >= start && d <= end;
        }).reduce((acc, w) => acc + w.amount, 0);
        const costosPedidos = stockHistory.filter(e => {
          const d = parseISO(e.created_at);
          return d >= start && d <= end;
        }).reduce((acc, e) => acc + ((e.cost || 0) * e.quantity_added), 0);
        const egresosMonetarios = monetaryIncome.filter(mi => {
          const d = parseISO(mi.created_at);
          return (mi.name.startsWith('[EGRESO]') || mi.amount < 0) && d >= start && d <= end;
        }).reduce((acc, mi) => acc + Math.abs(mi.amount), 0);
        const costosMes = costosFijos + sueldos + costosPedidos + egresosMonetarios;

        totalIngresos += ingresosMes;
        totalCostos += costosMes;
        const net = ingresosMes - costosMes;
        const cumulative = totalIngresos - totalCostos;
        out.push({ month: label, income: ingresosMes, costs: costosMes, net, cumulative });
      });
      return out;
    })();

    const availableCapital = capitalBreakdown.length > 0 ? capitalBreakdown[capitalBreakdown.length - 1].cumulative : 0;
    const totalHistoricalIncome = capitalBreakdown.reduce((sum, m) => sum + m.income, 0);
    const totalHistoricalCosts = capitalBreakdown.reduce((sum, m) => sum + m.costs, 0);

    return {
      totalRevenue,
      totalCosts,
      netProfit,
      netWorth,
      availableCapital,
      conversionRate,
      totalCostOfGoods,
      totalFixedCostsForPeriod,
      totalSalaryWithdrawn,
      totalStockValue,
      totalMonetaryIncome,
      totalStockInvestment,
      salesCount: filteredSales.length,
      requestsCount: totalItemsRequestedCount,
      soldItemsCount: totalItemsSoldCount,
      totalSales: filteredSales.reduce((sum, sale) => sum + sale.total_price, 0),
      revenueBreakdown,
      monetaryMovementsBreakdown,
      fixedCostsBreakdown,
      salaryWithdrawalsBreakdown,
      pedidoCostsBreakdown,
      stockValueBreakdown,
      capitalBreakdown,
      totalHistoricalIncome,
      totalHistoricalCosts,
    };
  }, [
    sales,
    products,
    fixedCosts,
    salaryWithdrawals,
    monetaryIncome,
    stockHistory,
    customerRequests,
    closures,
    statsPeriod,
  ]);

  const salesChartData = useMemo(() => {
    const last30Days = subDays(new Date(), 30);
    const dailySales = sales
      .filter((sale) => new Date(sale.created_at) >= last30Days)
      .reduce((acc, sale) => {
        const date = format(new Date(sale.created_at), 'dd/MM');
        acc[date] = (acc[date] || 0) + sale.total_price;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(dailySales)
      .map(([date, total]) => ({ date, Ingresos: total }))
      .reverse();
  }, [sales]);

  const profitCostChartData = useMemo(() => {
    const productCostMap = new Map(products.map((p) => [p.id, p.cost]));
    const last30Days = subDays(new Date(), 30);
    const dailyData = sales
      .filter((sale) => new Date(sale.created_at) >= last30Days)
      .reduce((acc, sale) => {
        const date = format(new Date(sale.created_at), 'dd/MM');
        if (!acc[date]) {
          acc[date] = { Ganancia: 0, Costo: 0 };
        }
        const cost = (productCostMap.get(sale.product_id) || 0) * sale.quantity;
        acc[date].Ganancia += sale.total_price - cost;
        acc[date].Costo += cost;
        return acc;
      }, {} as Record<string, { Ganancia: number; Costo: number }>);

    return Object.entries(dailyData)
      .map(([date, values]) => ({ date, ...values }))
      .reverse();
  }, [sales, products]);

  const categoryRevenueData = useMemo(() => {
    const categorySales: Record<string, number> = {};
    sales.forEach((sale) => {
      const product = products.find((p) => p.id === sale.product_id);
      if (product) {
        const categoryName = unslugify(product.category);
        categorySales[categoryName] =
          (categorySales[categoryName] || 0) + sale.total_price;
      }
    });
    return Object.entries(categorySales).map(([name, value]) => ({ name, value }));
  }, [sales, products]);

  const productPopularityData = useMemo(() => {
    const productStats = products.map((product) => {
      const views =
        productViews.find((v) => v.product_id === product.id)?.view_count || 0;
      const requests = customerRequests
        .filter((item) => item.product_id === product.id)
        .reduce((sum, item) => sum + item.quantity, 0);
      const salesCount = sales
        .filter((sale) => sale.product_id === product.id)
        .reduce((sum, sale) => sum + sale.quantity, 0);
      const stock = product.colors.reduce((sum, color) => sum + color.stock, 0);

      return {
        id: product.id,
        name: unslugify(product.name),
        model: product.model,
        views,
        requests,
        sales: salesCount,
        stock,
        conversion: requests > 0 ? (salesCount / requests) * 100 : 0,
      };
    });

    return productStats.sort(
      (a, b) => b[popularitySort] - a[popularitySort],
    );
  }, [products, productViews, customerRequests, sales, popularitySort]);

  const rentabilidadData = useMemo(() => {
    const data = products.map((product) => {
      const stock = product.colors.reduce((sum, color) => sum + color.stock, 0);
      const profit = product.price - product.cost;
      const margin = product.cost > 0 ? (profit / product.cost) * 100 : 0;
      return { ...product, stock, profit, margin };
    });

    return data.sort((a, b) => {
      const { column, direction } = rentabilidadSort;
      const aVal = a[column];
      const bVal = b[column];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [products, rentabilidadSort]);

  const paginatedRentabilidad = useMemo(() => {
    return rentabilidadData.slice(
      (rentabilidadCurrentPage - 1) * ITEMS_PER_PAGE_RENTABILIDAD,
      rentabilidadCurrentPage * ITEMS_PER_PAGE_RENTABILIDAD,
    );
  }, [rentabilidadData, rentabilidadCurrentPage]);

  const rentabilidadTotalPages = Math.ceil(
    rentabilidadData.length / ITEMS_PER_PAGE_RENTABILIDAD,
  );

  const handleRentabilidadPageChange = (page: number) => {
    if (page < 1 || page > rentabilidadTotalPages) return;
    setRentabilidadCurrentPage(page);
  };

  const handleRentabilidadSort = (
    column: 'name' | 'cost' | 'price' | 'profit' | 'margin' | 'stock',
  ) => {
    setRentabilidadSort((prev) => ({
      column,
      direction:
        prev.column === column && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const groupedStockHistory = useMemo(() => {
    if (!stockHistory || stockHistory.length === 0) return [];

    const grouped = stockHistory.reduce(
      (acc, entry) => {
        const pedidoId = entry.pedido_id;
        if (!acc[pedidoId]) {
          acc[pedidoId] = {
            entries: [] as StockHistory[],
            date: new Date(entry.created_at),
            totalCost: 0,
            totalPrice: 0,
          };
        }
        acc[pedidoId].entries.push(entry);
        acc[pedidoId].totalCost += (entry.cost || 0) * entry.quantity_added;
        acc[pedidoId].totalPrice += (entry.price || 0) * entry.quantity_added;
        return acc;
      },
      {} as Record<string, { entries: StockHistory[]; date: Date; totalCost: number; totalPrice: number }>,
    );

    const entries = Object.entries(grouped)
      .sort(([, a], [, b]) => b.date.getTime() - a.date.getTime())
      .map(([pedido_id, { entries, date, totalCost, totalPrice }], index, arr) => ({
        pedido_id,
        pedido_num: arr.length - index,
        entries,
        date,
        totalCost,
        totalPrice,
        profit: totalPrice - totalCost,
        margin: totalCost > 0 ? ((totalPrice - totalCost) / totalCost) * 100 : 0,
      }));

    return entries;
  }, [stockHistory]);

  const mostSoldProduct = useMemo(() => {
    return productPopularityData.length > 0
      ? productPopularityData.reduce((prev, current) =>
          prev.sales > current.sales ? prev : current,
        )
      : null;
  }, [productPopularityData]);

  const mostProfitableProduct = useMemo(() => {
    return rentabilidadData.length > 0
      ? rentabilidadData.reduce((prev, current) =>
          prev.profit > current.profit ? prev : current,
        )
      : null;
  }, [rentabilidadData]);

  const lowStockPopularProducts = useMemo(() => {
    return productPopularityData
      .filter((p) => p.stock <= 5 && p.sales > 0)
      .sort((a, b) => b.sales - a.sales);
  }, [productPopularityData]);

  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Skeleton className="h-32 w-32 rounded-full" />
      </div>
    );
  }

  const getSortIcon = (
    column: 'name' | 'cost' | 'price' | 'profit' | 'margin' | 'stock',
  ) => {
    if (rentabilidadSort.column !== column)
      return <TrendingUp className="h-4 w-4 ml-2 opacity-20" />;
    return rentabilidadSort.direction === 'asc' ? (
      <TrendingUp className="h-4 w-4 ml-2" />
    ) : (
      <TrendingDown className="h-4 w-4 ml-2" />
    );
  };

  const getPageNumbers = (totalPages: number, currentPage: number) => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages] as const;
    }
    if (currentPage >= totalPages - 2) {
      return [
        1,
        '...',
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ] as const;
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages] as const;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current) return;
    touchEndX.current = e.changedTouches[0].clientX;
    const deltaX = touchEndX.current - touchStartX.current;
    const threshold = 100;

    if (isMobile) {
      if (touchStartX.current < 50 && deltaX > threshold) {
        // Swipe from left edge to right
        setIsSidebarOpen(true);
      } else if (isSidebarOpen && touchStartX.current > window.innerWidth - 50 && deltaX < -threshold) {
        // Swipe from right edge to left
        setIsSidebarOpen(false);
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const scrollToSection = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const lastClosure = closures.length > 0 ? closures[closures.length - 1] : null;

  return (
    <div
      className="bg-muted/40 min-h-screen w-full"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex w-full">
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.aside
              initial={{ x: -80 }}
              animate={{ x: 0 }}
              exit={{ x: -80 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed top-0 left-0 h-full w-20 bg-background border-r flex flex-col items-center py-8 space-y-6 z-20 hidden md:flex"
            >
              <h1 className="font-bold text-primary">JP</h1>
              <nav className="flex flex-col items-center space-y-4">
                {navigationItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeSection === item.id ? 'secondary' : 'ghost'}
                    size="icon"
                    className="rounded-lg"
                    onClick={() => scrollToSection(item.id)}
                  >
                    <item.icon className="h-5 w-5" />
                  </Button>
                ))}
              </nav>
            </motion.aside>
          )}
        </AnimatePresence>

        <div className={`flex-1 w-full ${isSidebarOpen ? 'ml-0 md:ml-20' : 'ml-0'}`}>
          <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b py-3 md:py-4 px-0 md:px-8 flex justify-center md:justify-between items-center w-full">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:inline-flex absolute left-0 top-0 h-full w-16 md:mr-4"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3 px-4 md:px-0 justify-center md:justify-start w-full md:w-auto ml-[36px]">
              <div className="text-center md:text-left">
                <h1 className="text-xl md:text-2xl font-bold mt-2">Dashboard Financiero</h1>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Último cierre: {lastClosure ? format(new Date(lastClosure.startDate), "d 'de' MMMM, yyyy", { locale: es }) : 'Ninguno'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 md:gap-3 px-4 md:px-0">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Opciones</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-4 mt-6">
                    <div className="w-full">
                      <Select
                        onValueChange={(value) => setStatsPeriod(value as StatsPeriod)}
                        defaultValue={statsPeriod}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar período" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Total Histórico</SelectItem>
                          {closures.map((closure) => (
                            <SelectItem key={closure.id} value={closure.id}>
                              {closure.month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isClosing || isReverting || isLoadingClosures}
                      onClick={async () => {
                        if (isClosing || isReverting) return;
                        setIsClosing(true);
                        try {
                          const today = new Date();
                          console.log('Fecha del último cierre:', closures.length > 0 ? new Date(closures[closures.length - 1].startDate).toLocaleDateString() : 'Ninguno');
                          const already = closures.some((closure) => {
                            const date = new Date(closure.startDate);
                            return (
                              date.getFullYear() === today.getFullYear() &&
                              date.getMonth() === today.getMonth() &&
                              date.getDate() === today.getDate()
                            );
                          });
                          if (already) {
                            console.log('Error: Ya existe un cierre hoy');
                            toast({
                              title: 'Cierre ya registrado',
                              description: 'Ya existe un cierre de caja hoy.',
                            });
                            return;
                          }

                          const newMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
                          const startDate = new Date(
                            today.getFullYear(),
                            today.getMonth(),
                            today.getDate(),
                            0,
                            0,
                            0,
                            0,
                          ).toISOString();
                          const response = await fetch('/api/admin/finance-closures', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ month: newMonth, startDate }),
                          });
                          const result = await response.json().catch(() => null);
                          if (!response.ok || !result?.success) {
                            throw new Error(result?.error ?? 'No se pudo registrar el cierre de caja.');
                          }

                          const createdMonth =
                            typeof result?.data?.month === 'string' ? (result.data.month as string) : newMonth;
                          await refreshClosures();
                          toast({
                            title: 'Caja cerrada',
                            description: `Se inició el período ${createdMonth}.`,
                          });
                        } catch (error) {
                          console.error('[Finanzas] Error creando cierre:', error);
                          const message =
                            error instanceof Error
                              ? error.message
                              : 'No se pudo registrar el cierre de caja.';
                          console.log('Error al hacer el cierre de caja:', message);
                          toast({ variant: 'destructive', title: 'Error', description: message });
                        } finally {
                          setTimeout(() => setIsClosing(false), 300);
                        }
                      }}
                    >
                      {isClosing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cerrando…
                        </>
                      ) : (
                        'Cerrar caja hoy'
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isReverting || isClosing || closures.length <= 1 || isLoadingClosures}
                      onClick={async () => {
                        if (isReverting || isClosing) return;
                        setIsReverting(true);
                        try {
                          if (closures.length <= 1) {
                            toast({
                              title: 'Nada para revertir',
                              description: 'No hay cierres previos para revertir.',
                            });
                            return;
                          }

                          const sortedClosures = [...closures].sort(
                            (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
                          );
                          const lastEntry = sortedClosures[sortedClosures.length - 1];
                          if (!lastEntry) {
                            toast({
                              title: 'Nada para revertir',
                              description: 'No hay cierres previos para revertir.',
                            });
                            return;
                          }

                          const response = await fetch('/api/admin/finance-closures', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: lastEntry.id }),
                          });
                          const result = await response.json().catch(() => null);
                          if (!response.ok || !result?.success) {
                            throw new Error(result?.error ?? 'No se pudo revertir el cierre.');
                          }

                          await refreshClosures();
                          toast({
                            title: 'Cierre revertido',
                            description: `Se eliminó el cierre de ${lastEntry.month}.`,
                          });
                        } catch (error) {
                          console.error('[Finanzas] Error revirtiendo cierre:', error);
                          const message =
                            error instanceof Error
                              ? error.message
                              : 'No se pudo revertir el último cierre.';
                          toast({ variant: 'destructive', title: 'Error', description: message });
                        } finally {
                          setTimeout(() => setIsReverting(false), 300);
                        }
                      }}
                    >
                      {isReverting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Revirtiendo…
                        </>
                      ) : (
                        'Revertir cierre'
                      )}
                    </Button>
                    <ThemeToggle />
                  </div>
                </SheetContent>
              </Sheet>
              <div className="hidden md:flex flex-wrap items-center gap-2 md:gap-3">
                <div className="w-full md:w-auto md:min-w-[230px]">
                  <Select
                    onValueChange={(value) => setStatsPeriod(value as StatsPeriod)}
                    value={statsPeriod}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Total Histórico</SelectItem>
                      {closures.map((closure) => (
                        <SelectItem key={closure.id} value={closure.id}>
                          {closure.month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isClosing || isReverting || isLoadingClosures}
                  onClick={async () => {
                    if (isClosing || isReverting) return;
                    setIsClosing(true);
                    try {
                      const today = new Date();
                      console.log('Fecha del último cierre:', closures.length > 0 ? new Date(closures[closures.length - 1].startDate).toLocaleDateString() : 'Ninguno');
                      const already = closures.some((closure) => {
                        const date = new Date(closure.startDate);
                        return (
                          date.getFullYear() === today.getFullYear() &&
                          date.getMonth() === today.getMonth() &&
                          date.getDate() === today.getDate()
                        );
                      });
                      if (already) {
                        console.log('Error: Ya existe un cierre hoy');
                        toast({
                          title: 'Cierre ya registrado',
                          description: 'Ya existe un cierre de caja hoy.',
                        });
                        return;
                      }

                      const newMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
                      const startDate = new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        today.getDate(),
                        0,
                        0,
                        0,
                        0,
                      ).toISOString();
                      const response = await fetch('/api/admin/finance-closures', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ month: newMonth, startDate }),
                      });
                      const result = await response.json().catch(() => null);
                      if (!response.ok || !result?.success) {
                        throw new Error(result?.error ?? 'No se pudo registrar el cierre de caja.');
                      }

                      const createdMonth =
                        typeof result?.data?.month === 'string' ? (result.data.month as string) : newMonth;
                      await refreshClosures();
                      toast({
                        title: 'Caja cerrada',
                        description: `Se inició el período ${createdMonth}.`,
                      });
                    } catch (error) {
                      console.error('[Finanzas] Error creando cierre:', error);
                      const message =
                        error instanceof Error
                          ? error.message
                          : 'No se pudo registrar el cierre de caja.';
                      console.log('Error al hacer el cierre de caja:', message);
                      toast({ variant: 'destructive', title: 'Error', description: message });
                    } finally {
                      setTimeout(() => setIsClosing(false), 300);
                    }
                  }}
                >
                  {isClosing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cerrando…
                    </>
                  ) : (
                    'Cerrar caja hoy'
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isReverting || isClosing || closures.length <= 1 || isLoadingClosures}
                  onClick={async () => {
                    if (isReverting || isClosing) return;
                    setIsReverting(true);
                    try {
                      if (closures.length <= 1) {
                        toast({
                          title: 'Nada para revertir',
                          description: 'No hay cierres previos para revertir.',
                        });
                        return;
                      }

                      const sortedClosures = [...closures].sort(
                        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
                      );
                      const lastEntry = sortedClosures[sortedClosures.length - 1];
                      if (!lastEntry) {
                        toast({
                          title: 'Nada para revertir',
                          description: 'No hay cierres previos para revertir.',
                        });
                        return;
                      }

                      const response = await fetch('/api/admin/finance-closures', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: lastEntry.id }),
                      });
                      const result = await response.json().catch(() => null);
                      if (!response.ok || !result?.success) {
                        throw new Error(result?.error ?? 'No se pudo revertir el cierre.');
                      }

                      await refreshClosures();
                      toast({
                        title: 'Cierre revertido',
                        description: `Se eliminó el cierre de ${lastEntry.month}.`,
                      });
                    } catch (error) {
                      console.error('[Finanzas] Error revirtiendo cierre:', error);
                      const message =
                        error instanceof Error
                          ? error.message
                          : 'No se pudo revertir el último cierre.';
                      toast({ variant: 'destructive', title: 'Error', description: message });
                    } finally {
                      setTimeout(() => setIsReverting(false), 300);
                    }
                  }}
                >
                  {isReverting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Revirtiendo…
                    </>
                  ) : (
                    'Revertir cierre'
                  )}
                </Button>
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main className="px-4 md:px-8 py-4 md:py-8 space-y-8">
            <motion.section
              id="resumen"
              ref={(el) => {
                sectionRefs.current['resumen'] = el;
              }}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-bold mb-4">Resumen Financiero</h2>
              <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <FinancialKpiCard
                  title="Ingreso por Productos"
                  value={`$${financialSummaryDetails.totalSales.toLocaleString()}`}
                  icon={DollarSign}
                  detail="Ventas de productos"
                  colorClass="text-green-500"
                  custom={0}
                >
                  <p className="font-semibold">Fórmula: SUMA(Cantidad vendida × Precio de venta)</p>
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {financialSummaryDetails.revenueBreakdown.map((item, index) => (
                      <div key={index} className="text-sm flex justify-between">
                        <span>{item.label}</span>
                        <span className={item.isNegative ? 'text-red-600' : ''}>
                          {item.isNegative ? '-' : ''}${item.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 font-semibold">Total: ${financialSummaryDetails.totalSales.toLocaleString()}</p>
                </FinancialKpiCard>
                <FinancialKpiCard
                  title="Movimientos Monetarios"
                  value={`$${financialSummaryDetails.totalMonetaryIncome.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}`}
                  icon={PiggyBank}
                  detail="Ingresos/Egresos adicionales"
                  colorClass={financialSummaryDetails.totalMonetaryIncome >= 0 ? 'text-green-500' : 'text-red-500'}
                  custom={1}
                >
                  <p className="font-semibold">Fórmula: SUMA(Ingresos) - SUMA(Egresos)</p>
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {financialSummaryDetails.monetaryMovementsBreakdown.map((item, index) => (
                      <div key={index} className="text-sm flex justify-between">
                        <span>{item.label}</span>
                        <span className={item.isNegative ? 'text-red-600' : 'text-green-600'}>
                          {item.isNegative ? '-' : '+'}${item.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 font-semibold">Total: ${financialSummaryDetails.totalMonetaryIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </FinancialKpiCard>
                <FinancialKpiCard
                  title="Ingresos Totales"
                  value={`$${financialSummaryDetails.totalRevenue.toLocaleString()}`}
                  icon={TrendingUp}
                  detail="Productos + Monetarios"
                  colorClass="text-green-500"
                  custom={2}
                >
                  <p className="font-semibold">Fórmula: Ingreso por Productos + Movimientos Monetarios</p>
                  <p>Ingreso por Productos: ${financialSummaryDetails.totalSales.toLocaleString()}</p>
                  <p>Movimientos Monetarios: ${financialSummaryDetails.totalMonetaryIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  <p className="mt-2 font-semibold">Total: ${financialSummaryDetails.totalRevenue.toLocaleString()}</p>
                </FinancialKpiCard>
                <FinancialKpiCard
                  title="Costos de Pedidos"
                  value={`$${financialSummaryDetails.totalStockInvestment.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}`}
                  icon={BarChart}
                  detail="Compras a proveedores"
                  colorClass="text-orange-500"
                  custom={3}
                >
                  <p className="font-semibold">Fórmula: SUMA(Costos por pedido)</p>
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {financialSummaryDetails.pedidoCostsBreakdown.map((item, index) => (
                      <div key={index} className="text-sm flex justify-between">
                        <span>{item.label}</span>
                        <span className={item.isNegative ? 'text-red-600' : ''}>
                          {item.isNegative ? '-' : ''}${item.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 font-semibold">Total: ${financialSummaryDetails.totalStockInvestment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </FinancialKpiCard>
                <FinancialKpiCard
                  title="Costos Fijos"
                  value={`$${financialSummaryDetails.totalFixedCostsForPeriod.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}`}
                  icon={Settings}
                  detail="Suscripciones y gastos fijos"
                  colorClass="text-slate-500"
                  custom={4}
                >
                  <p className="font-semibold">Fórmula: SUMA(Costos fijos en período)</p>
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {financialSummaryDetails.fixedCostsBreakdown.map((item, index) => (
                      <div key={index} className="text-sm flex justify-between">
                        <span>{item.label}</span>
                        <span className={item.isNegative ? 'text-red-600' : ''}>
                          {item.isNegative ? '-' : ''}${item.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 font-semibold">Total: ${financialSummaryDetails.totalFixedCostsForPeriod.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </FinancialKpiCard>
                <FinancialKpiCard
                  title="Extracción de Sueldos"
                  value={`$${financialSummaryDetails.totalSalaryWithdrawn.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}`}
                  icon={Wallet}
                  detail="Pagos a empleados"
                  colorClass="text-blue-500"
                  custom={5}
                >
                  <p className="font-semibold">Fórmula: SUMA(Extracciones registradas)</p>
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {financialSummaryDetails.salaryWithdrawalsBreakdown.map((item, index) => (
                      <div key={index} className="text-sm flex justify-between">
                        <span>{item.label}</span>
                        <span className={item.isNegative ? 'text-red-600' : ''}>
                          {item.isNegative ? '-' : ''}${item.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 font-semibold">Total: ${financialSummaryDetails.totalSalaryWithdrawn.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </FinancialKpiCard>
                <FinancialKpiCard
                  title="Costos Totales"
                  value={`$${financialSummaryDetails.totalCosts.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}`}
                  icon={TrendingDown}
                  detail="Pedidos + Fijos + Sueldos"
                  colorClass="text-red-500"
                  custom={6}
                >
                  <p className="font-semibold">Fórmula: Costos de Pedidos + Costos Fijos + Extracción de Sueldos</p>
                  <p>Costos de Pedidos: ${financialSummaryDetails.totalStockInvestment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  <p>Costos Fijos: ${financialSummaryDetails.totalFixedCostsForPeriod.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  <p>Extracción de Sueldos: ${financialSummaryDetails.totalSalaryWithdrawn.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  <p className="mt-2 font-semibold">Total: ${financialSummaryDetails.totalCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </FinancialKpiCard>
                <FinancialKpiCard
                  title="Ganancia"
                  value={`$${financialSummaryDetails.netProfit.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}`}
                  icon={TrendingUp}
                  detail="Ingresos - Costos"
                  colorClass={financialSummaryDetails.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}
                  custom={7}
                >
                  <p className="font-semibold">Fórmula: Ingresos Totales - Costos Totales</p>
                  <p>Ingresos Totales: ${financialSummaryDetails.totalRevenue.toLocaleString()}</p>
                  <p>Costos Totales: ${financialSummaryDetails.totalCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  <p className="mt-2 font-semibold">Total: ${financialSummaryDetails.netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </FinancialKpiCard>
                <FinancialKpiCard
                  title="Patrimonio Total"
                  value={`$${financialSummaryDetails.netWorth.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}`}
                  icon={Banknote}
                  detail="Valor de productos en stock"
                  custom={8}
                >
                  <p className="font-semibold">Fórmula: SUMA(Costo del producto × Stock)</p>
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {financialSummaryDetails.stockValueBreakdown.map((item, index) => (
                      <div key={index} className="text-sm flex justify-between">
                        <span>{item.label}</span>
                        <span className={item.isNegative ? 'text-red-600' : ''}>
                          {item.isNegative ? '-' : ''}${item.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 font-semibold">Total: ${financialSummaryDetails.netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </FinancialKpiCard>
                <FinancialKpiCard
                  title="Capital Disponible"
                  value={`$${financialSummaryDetails.availableCapital.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}`}
                  icon={Coins}
                  detail="Dinero líquido histórico"
                  custom={9}
                >
                  <p className="font-semibold">Fórmula: Capital acumulado desde julio 2025 (fecha de inicio del negocio)</p>
                  <p className="font-semibold">Cálculos:</p>
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {financialSummaryDetails.capitalBreakdown.map((item, index) => (
                      <div key={index} className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>{item.month} ingresos</span>
                          <span>${item.income.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{item.month} costos</span>
                          <span className="text-red-600">-${item.costs.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 font-semibold">Total Ingresos Históricos: ${financialSummaryDetails.totalHistoricalIncome.toLocaleString()}</p>
                  <p className="mt-2 font-semibold">Total Costos Históricos: -${financialSummaryDetails.totalHistoricalCosts.toLocaleString()}</p>
                  <p className="mt-2 font-semibold">Capital Disponible: ${financialSummaryDetails.availableCapital.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  <p className="mt-2 font-semibold">Total: ${financialSummaryDetails.availableCapital.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </FinancialKpiCard>
                <FinancialKpiCard
                  title="Items Vendidos"
                  value={`${financialSummaryDetails.soldItemsCount}`}
                  icon={Package}
                  detail="Unidades vendidas"
                  colorClass="text-amber-500"
                  custom={10}
                >
                  <p className="font-semibold">Fórmula: SUMA(Cantidades vendidas)</p>
                  <p>Total de unidades vendidas en el período.</p>
                </FinancialKpiCard>
                <FinancialKpiCard
                  title="Tasa de Conversión"
                  value={`${financialSummaryDetails.conversionRate.toFixed(1)}%`}
                  icon={Goal}
                  detail="De pedidos a ventas"
                  custom={11}
                >
                  <p className="font-semibold">Fórmula: (Items Vendidos / Pedidos Totales) × 100</p>
                  <p>Items Vendidos: {financialSummaryDetails.soldItemsCount}</p>
                  <p>Pedidos Totales: {financialSummaryDetails.requestsCount}</p>
                  <p className="mt-2 font-semibold">Total: {financialSummaryDetails.conversionRate.toFixed(1)}%</p>
                </FinancialKpiCard>
              </div>
            </motion.section>

            <motion.section
              id="acciones"
              ref={(el) => {
                sectionRefs.current['acciones'] = el;
              }}
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-bold mb-4">Acciones Rápidas</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <Button variant="outline" className="h-20 flex-col" onClick={() => scrollToSection('costos')}>
                  <PlusCircle className="h-6 w-6 mb-1" />
                  <span>Agregar Costo</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col" onClick={() => scrollToSection('costos')}>
                  <Wallet className="h-6 w-6 mb-1" />
                  <span>Registrar Sueldo</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col" onClick={() => scrollToSection('pedidos')}>
                  <Package className="h-6 w-6 mb-1" />
                  <span>Ver Pedidos</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col"
                  onClick={() => {
                    if (mostSoldProduct) {
                      const rentabilidadSection = document.getElementById('rentabilidad');
                      rentabilidadSection?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  <TrendingUp className="h-6 w-6 mb-1" />
                  <span>Analizar Rentabilidad</span>
                </Button>
              </div>
            </motion.section>

            <motion.section
              id="insights"
              ref={(el) => {
                sectionRefs.current['insights'] = el;
              }}
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-bold mb-4">Insights Automáticos</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                {mostSoldProduct && (
                  <Card className="bg-primary/10 border-primary/20">
                    <CardHeader className="flex-row items-center gap-4 space-y-0">
                      <ShoppingBag className="h-8 w-8 text-primary" />
                      <div>
                        <CardTitle>Producto Estrella</CardTitle>
                        <CardDescription>El más vendido</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-semibold">
                        {mostSoldProduct.name} ({mostSoldProduct.model})
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {mostSoldProduct.sales} unidades
                      </p>
                    </CardContent>
                  </Card>
                )}
                {mostProfitableProduct && (
                  <Card className="bg-green-500/10 border-green-500/20">
                    <CardHeader className="flex-row items-center gap-4 space-y-0">
                      <DollarSign className="h-8 w-8 text-green-500" />
                      <div>
                        <CardTitle>Joya de la Corona</CardTitle>
                        <CardDescription>El más rentable</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-semibold">
                        {unslugify(mostProfitableProduct.name)} ({mostProfitableProduct.model})
                      </p>
                      <p className="text-2xl font-bold text-green-500">
                        {mostProfitableProduct.margin.toFixed(1)}% de margen
                      </p>
                    </CardContent>
                  </Card>
                )}
                {lowStockPopularProducts.length > 0 && (
                  <Card className="bg-yellow-500/10 border-yellow-500/20">
                    <CardHeader className="flex-row items-center gap-4 space-y-0">
                      <AlertTriangle className="h-8 w-8 text-yellow-500" />
                      <div>
                        <CardTitle>Alerta de Stock</CardTitle>
                        <CardDescription>Popular y se agota</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-semibold">
                        {lowStockPopularProducts[0].name} ({lowStockPopularProducts[0].model})
                      </p>
                      <p className="text-2xl font-bold text-yellow-500">
                        {lowStockPopularProducts[0].stock} unidades restantes
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </motion.section>

            <motion.section
              id="graficos"
              ref={(el) => {
                sectionRefs.current['graficos'] = el;
              }}
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-bold mb-4">Gráficos de Evolución</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle>Evolución de Ventas</CardTitle>
                    <CardDescription>Últimos 30 días</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={salesChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis
                          tickFormatter={(value) => `$${Number(value) / 1000}k`}
                          tick={{ fontSize: 12 }}
                        />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="Ingresos"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle>Ganancias vs. Costos</CardTitle>
                    <CardDescription>Comparativo de los últimos 30 días</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={profitCostChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis
                          tickFormatter={(value) => `$${Number(value) / 1000}k`}
                          tick={{ fontSize: 12 }}
                        />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="Ganancia"
                          name="Ganancia"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="Costo"
                          name="Costo"
                          stroke="hsl(var(--destructive))"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </motion.section>

            <motion.section
              id="categorias"
              ref={(el) => {
                sectionRefs.current['categorias'] = el;
              }}
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-bold mb-4">Análisis de Categorías y Productos</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="shadow-lg rounded-2xl lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Ingresos por Categoría</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryRevenueData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {categoryRevenueData.map((entry, index) => (
                            <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="shadow-lg rounded-2xl lg:col-span-2">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Popularidad de Productos</CardTitle>
                        <CardDescription>Top 5 productos más relevantes</CardDescription>
                      </div>
                      <Select
                        value={popularitySort}
                        onValueChange={(value) => setPopularitySort(value as 'sales' | 'requests' | 'views')}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Ordenar por" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sales">Ventas</SelectItem>
                          <SelectItem value="requests">Pedidos</SelectItem>
                          <SelectItem value="views">Vistas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-center">Vistas</TableHead>
                          <TableHead className="text-center">Pedidos</TableHead>
                          <TableHead className="text-center">Ventas</TableHead>
                          <TableHead className="text-center">Stock</TableHead>
                          <TableHead className="text-center">Conversión</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productPopularityData.slice(0, 5).map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">
                              {p.name} <span className="text-xs text-muted-foreground">{p.model}</span>
                            </TableCell>
                            <TableCell className="text-center">{p.views}</TableCell>
                            <TableCell className="text-center">{p.requests}</TableCell>
                            <TableCell className="text-center font-bold text-primary">{p.sales}</TableCell>
                            <TableCell className="text-center">{p.stock}</TableCell>
                            <TableCell className="text-center font-semibold">{p.conversion.toFixed(1)}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </motion.section>

            <motion.section
              id="rentabilidad"
              ref={(el) => {
                sectionRefs.current['rentabilidad'] = el;
              }}
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-bold mb-4">Rentabilidad por Producto</h2>
              <Card className="shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle>Análisis de Rentabilidad</CardTitle>
                  <CardDescription>
                    Evalúa la rentabilidad de cada producto para optimizar precios y estrategias.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <Button variant="ghost" onClick={() => handleRentabilidadSort('name')} className="px-0">
                              Producto {getSortIcon('name')}
                            </Button>
                          </TableHead>
                          <TableHead className="text-right">
                            <Button
                              variant="ghost"
                              onClick={() => handleRentabilidadSort('cost')}
                              className="px-0 justify-end w-full"
                            >
                              Costo {getSortIcon('cost')}
                            </Button>
                          </TableHead>
                          <TableHead className="text-right">
                            <Button
                              variant="ghost"
                              onClick={() => handleRentabilidadSort('price')}
                              className="px-0 justify-end w-full"
                            >
                              Precio {getSortIcon('price')}
                            </Button>
                          </TableHead>
                          <TableHead className="text-right">
                            <Button
                              variant="ghost"
                              onClick={() => handleRentabilidadSort('profit')}
                              className="px-0 justify-end w-full"
                            >
                              Ganancia {getSortIcon('profit')}
                            </Button>
                          </TableHead>
                          <TableHead className="text-right">
                            <Button
                              variant="ghost"
                              onClick={() => handleRentabilidadSort('margin')}
                              className="px-0 justify-end w-full"
                            >
                              Margen {getSortIcon('margin')}
                            </Button>
                          </TableHead>
                          <TableHead className="text-center">
                            <Button
                              variant="ghost"
                              onClick={() => handleRentabilidadSort('stock')}
                              className="px-0 justify-center w-full"
                            >
                              Stock {getSortIcon('stock')}
                            </Button>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedRentabilidad.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">
                              {unslugify(p.name)}{' '}
                              <span className="text-xs text-muted-foreground">{p.model}</span>
                            </TableCell>
                            <TableCell>
                              <EditablePriceCell product={p} field="cost" value={p.cost} />
                            </TableCell>
                            <TableCell>
                              <EditablePriceCell product={p} field="price" value={p.price} />
                            </TableCell>
                            <TableCell className="text-right font-medium text-green-500">
                              ${p.profit.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span
                                  className={cn(
                                    'font-semibold',
                                    p.margin > 50
                                      ? 'text-green-500'
                                      : p.margin > 20
                                      ? 'text-yellow-500'
                                      : 'text-red-500',
                                  )}
                                >
                                  {p.margin.toFixed(1)}%
                                </span>
                                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={cn(
                                      'h-full rounded-full',
                                      p.margin > 50
                                        ? 'bg-green-500'
                                        : p.margin > 20
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500',
                                    )}
                                    style={{ width: `${Math.min(p.margin, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{p.stock}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {rentabilidadTotalPages > 1 && (
                    <div className="mt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => handleRentabilidadPageChange(rentabilidadCurrentPage - 1)}
                              disabled={rentabilidadCurrentPage === 1}
                            />
                          </PaginationItem>

                          <div className="hidden sm:flex items-center gap-1">
                            {getPageNumbers(rentabilidadTotalPages, rentabilidadCurrentPage).map((page, index) => (
                              <PaginationItem key={index}>
                                {typeof page === 'number' ? (
                                  <PaginationLink
                                    onClick={() => handleRentabilidadPageChange(page)}
                                    isActive={rentabilidadCurrentPage === page}
                                  >
                                    {page}
                                  </PaginationLink>
                                ) : (
                                  <PaginationEllipsis />
                                )}
                              </PaginationItem>
                            ))}
                          </div>

                          <PaginationItem className="sm:hidden flex items-center gap-2">
                            <span className="font-medium text-sm">
                              Página {rentabilidadCurrentPage} de {rentabilidadTotalPages}
                            </span>
                          </PaginationItem>

                          <PaginationItem>
                            <PaginationNext
                              onClick={() => handleRentabilidadPageChange(rentabilidadCurrentPage + 1)}
                              disabled={rentabilidadCurrentPage === rentabilidadTotalPages}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.section>

            <motion.section
              id="costos"
              ref={(el) => {
                sectionRefs.current['costos'] = el;
              }}
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-bold mb-4">Gestión de Costos y Sueldos</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle>Costos Fijos Mensuales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={handleSubmitFixedCost(onFixedCostSubmit)}
                      className="flex items-start gap-2 mb-4"
                    >
                      <Input {...registerFixedCost('name')} placeholder="Nombre del costo" className="h-9" />
                      <Input {...registerFixedCost('amount', { valueAsNumber: true })} type="number" placeholder="$" className="h-9 w-24" />
                      <Button type="submit" size="icon" className="h-9 w-9 flex-shrink-0">
                        <PlusCircle />
                      </Button>
                    </form>
                    <ul className="space-y-2">
                      {fixedCosts.map((cost) => (
                        <li key={cost.id} className="flex justify-between items-center text-sm">
                          <span>{cost.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">${cost.amount.toLocaleString()}</span>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive rounded-full">
                                  <Trash className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar costo fijo?</AlertDialogTitle>
                                  <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteFixedCost(cost.id)}>Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle>Extracciones de Sueldo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={handleSubmitSalary(onSalarySubmit)}
                      className="flex items-start gap-2 mb-4"
                    >
                      <Input
                        {...registerSalary('description')}
                        placeholder="Descripción (ej. Sueldo Enero)"
                        className="h-9"
                      />
                      <Input
                        {...registerSalary('amount', { valueAsNumber: true })}
                        type="number"
                        placeholder="$"
                        className="h-9 w-24"
                      />
                      <Button type="submit" size="icon" className="h-9 w-9 flex-shrink-0">
                        <PlusCircle />
                      </Button>
                    </form>
                    <ul className="space-y-2">
                      {salaryWithdrawals.slice(0, 5).map((s) => (
                        <li key={s.id} className="flex justify-between items-center text-sm">
                          <div>
                            <span>{s.description || 'Sin descripción'}</span>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(s.created_at), 'dd/MM/yy')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">${s.amount.toLocaleString()}</span>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive rounded-full">
                                  <Trash className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar extracción?</AlertDialogTitle>
                                  <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteSalaryWithdrawal(s.id)}>Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle>Ingresos Monetarios Extra</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={handleSubmitIncome(onIncomeSubmit)}
                      className="flex items-start gap-2 mb-4"
                    >
                      <Input {...registerIncome('name')} placeholder="Nombre del ingreso" className="h-9" />
                      <Input {...registerIncome('amount', { valueAsNumber: true })} type="number" placeholder="$" className="h-9 w-24" />
                      <Button type="submit" size="icon" className="h-9 w-9 flex-shrink-0">
                        <PlusCircle />
                      </Button>
                    </form>
                    <ul className="space-y-2">
                      {monetaryIncome.slice(0, 5).map((income) => (
                        <li key={income.id} className="flex justify-between items-center text-sm">
                          <div>
                            <span>{income.name}</span>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(income.created_at), 'dd/MM/yy')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">${income.amount.toLocaleString()}</span>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive rounded-full">
                                  <Trash className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar ingreso?</AlertDialogTitle>
                                  <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteMonetaryIncome(income.id)}>Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </motion.section>

            <motion.section
              id="pedidos"
              ref={(el) => {
                sectionRefs.current['pedidos'] = el;
              }}
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-bold mb-4">Análisis de Pedidos</h2>
              <Card className="shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PackageSearch /> Historial de Pedidos (Inversión)
                  </CardTitle>
                  <CardDescription>
                    Revisa el historial de pedidos de stock para analizar costos e ingresos potenciales.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-4">
                    {groupedStockHistory.map((pedido) => (
                      <Collapsible key={pedido.pedido_id} className="border-b last:border-b-0 pb-2">
                        <CollapsibleTrigger className="w-full flex justify-between items-center py-2 font-semibold text-left text-sm hover:bg-muted p-2 rounded-md">
                          <div className="flex-1">
                            Pedido #{pedido.pedido_num}
                            <span className="text-xs font-normal text-muted-foreground ml-2">
                              {pedido.date.toLocaleDateString('es-ES')}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-center min-w-[400px] items-center">
                            <div className="font-normal text-red-500">-${pedido.totalCost.toLocaleString()}</div>
                            <div className="font-normal text-green-500">+${pedido.profit.toLocaleString()}</div>
                            <div className="font-normal text-primary">{pedido.margin.toFixed(1)}%</div>
                          </div>
                          <ChevronDown className="h-5 w-5 transition-transform data-[state=open]:rotate-180 ml-4" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="py-2 px-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead>Color</TableHead>
                                <TableHead className="text-right">Costo</TableHead>
                                <TableHead className="text-right">Cantidad</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {pedido.entries.map((entry: StockHistory) => (
                                <TableRow key={entry.id}>
                                  <TableCell>
                                    {unslugify(entry.product_name)}{' '}
                                    <span className="text-xs text-muted-foreground">{entry.product_model}</span>
                                  </TableCell>
                                  <TableCell>{entry.color_name}</TableCell>
                                  <TableCell className="text-right">${entry.cost || 0}</TableCell>
                                  <TableCell className="text-right font-medium text-primary">
                                    +{entry.quantity_added}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function FinanzasPage() {
  return (
    <SalaryWithdrawalsProvider>
      <MonetaryIncomeProvider>
        <FinanceDashboard />
      </MonetaryIncomeProvider>
    </SalaryWithdrawalsProvider>
  );
}
