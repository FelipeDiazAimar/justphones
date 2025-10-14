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
  formatDistanceToNow,
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
  Edit,
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
  Brain,
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
import { Badge } from '@/components/ui/badge';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Product } from '@/lib/products';
import type { SalaryWithdrawal } from '@/lib/salary-withdrawals';
import type { MonetaryIncome } from '@/lib/monetary-income';
import type { FixedCost } from '@/lib/fixed-costs';
import type { StockHistory } from '@/lib/stock-history';
import { ThemeToggle } from '@/components/theme-toggle';
import { Logo } from '@/components/icons/logo';

const GastosIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12 3V9M12 3L9.5 5.5M12 3L14.5 5.5M5.82333 9.00037C6.2383 9.36683 6.5 9.90285 6.5 10.5C6.5 11.6046 5.60457 12.5 4.5 12.5C3.90285 12.5 3.36683 12.2383 3.00037 11.8233M5.82333 9.00037C5.94144 9 6.06676 9 6.2 9H8M5.82333 9.00037C4.94852 9.00308 4.46895 9.02593 4.09202 9.21799C3.71569 9.40973 3.40973 9.71569 3.21799 10.092C3.02593 10.469 3.00308 10.9485 3.00037 11.8233M3.00037 11.8233C3 11.9414 3 12.0668 3 12.2V17.8C3 17.9332 3 18.0586 3.00037 18.1767M3.00037 18.1767C3.36683 17.7617 3.90285 17.5 4.5 17.5C5.60457 17.5 6.5 18.3954 6.5 19.5C6.5 20.0971 6.2383 20.6332 5.82333 20.9996M3.00037 18.1767C3.00308 19.0515 3.02593 19.5311 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.46895 20.9741 4.94852 20.9969 5.82333 20.9996M5.82333 20.9996C5.94144 21 6.06676 21 6.2 21H17.8C17.9332 21 18.0586 21 18.1767 20.9996M21 18.1771C20.6335 17.7619 20.0973 17.5 19.5 17.5C18.3954 17.5 17.5 18.3954 17.5 19.5C17.5 20.0971 17.7617 20.6332 18.1767 20.9996M21 18.1771C21.0004 18.0589 21 17.9334 21 17.8V12.2C21 12.0668 21 11.9414 20.9996 11.8233M21 18.1771C20.9973 19.0516 20.974 19.5311 20.782 19.908C20.5903 20.2843 20.2843 20.5903 19.908 20.782C19.5311 20.9741 19.0515 20.9969 18.1767 20.9996M20.9996 11.8233C20.6332 12.2383 20.0971 12.5 19.5 12.5C18.3954 12.5 17.5 11.6046 17.5 10.5C17.5 9.90285 17.7617 9.36683 18.1767 9.00037M20.9996 11.8233C20.9969 10.9485 20.9741 10.469 20.782 10.092C20.5903 9.71569 20.2843 9.40973 19.908 9.21799C19.5311 9.02593 19.0515 9.00308 18.1767 9.00037M18.1767 9.00037C18.0586 9 17.9332 9 17.8 9H16M14 15C14 16.1046 13.1046 17 12 17C10.8954 17 10 16.1046 10 15C10 13.8954 10.8954 13 12 13C13.1046 13 14 13.8954 14 15Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const VentasIcon = (props: React.SVGProps<SVGSVGElement>) => {
  const { className, ...restProps } = props;
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      className={`fill-black dark:fill-white ${className || ''}`}
      {...restProps}
    >
    <g id="Layer_2" data-name="Layer 2">
      <g id="invisible_box" data-name="invisible box">
        <rect width="48" height="48" fill="none" />
      </g>
      <g id="Icons">
        <g>
          <path fill="currentColor" d="M42.2,31.7a4.6,4.6,0,0,0-4-1.1l-9.9,1.7A4.7,4.7,0,0,0,26.9,29l-7.1-7H5a2,2,0,0,0,0,4H18.2l5.9,5.9a.8.8,0,0,1,0,1.1.9.9,0,0,1-1.2,0l-3.5-3.5a2.1,2.1,0,0,0-2.8,0,2.1,2.1,0,0,0,0,2.9l3.5,3.4a4.5,4.5,0,0,0,3.4,1.4,5.7,5.7,0,0,0,1.8-.3h0l13.6-2.4a1,1,0,0,1,.8.2,1.1,1.1,0,0,1,.3.7,1,1,0,0,1-.8,1L20.6,39.8,9.7,30.9H5a2,2,0,0,0,0,4H8.3L19.4,44l20.5-3.7A4.9,4.9,0,0,0,44,35.4,4.6,4.6,0,0,0,42.2,31.7Z" />
          <path fill="currentColor" d="M34.3,20.1h0a6.7,6.7,0,0,1-4.1-1.3,2,2,0,0,0-2.8.6,1.8,1.8,0,0,0,.3,2.6A10.9,10.9,0,0,0,32,23.8V26a2,2,0,0,0,4,0V23.8a6.3,6.3,0,0,0,3-1.3,4.9,4.9,0,0,0,2-4h0c0-3.7-3.4-4.9-6.3-5.5s-3.5-1.3-3.5-1.8.2-.6.5-.9a3.4,3.4,0,0,1,1.8-.4,6.3,6.3,0,0,1,3.3.9,1.8,1.8,0,0,0,2.7-.5,1.9,1.9,0,0,0-.4-2.8A9.1,9.1,0,0,0,36,6.3V4a2,2,0,0,0-4,0V6.2c-3,.5-5,2.5-5,5.2s3.3,4.9,6.5,5.5,3.3,1.3,3.3,1.8S35.7,20.1,34.3,20.1Z" />
        </g>
      </g>
    </g>
  </svg>
  );
};

const SidebarToggleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </svg>
);

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
  { id: 'popularidad', label: 'Popularidad', icon: TrendingUp },
  { id: 'costos', label: 'Gastos', icon: GastosIcon },
  { id: 'pedidos', label: 'Pedidos', icon: PackageSearch },
  { id: 'ventas-historial', label: 'Ventas', icon: VentasIcon },
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
  amount: z.coerce.number().min(-999999, 'El monto debe ser mayor a -999999.').max(999999, 'El monto debe ser menor a 999999.'),
  description: z.string().optional(),
});

const ITEMS_PER_PAGE_RENTABILIDAD = 8;
const ITEMS_PER_PAGE_LOW_ROTATION = 5;
const ITEMS_PER_PAGE_STOCK_RECOMMENDATIONS = 3;
type StatsPeriod = string; // 'all' or closure ID

type SalesFilter = 'all' | 'today' | 'yesterday' | 'dayBeforeYesterday';

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

const AUTH_KEY = 'JUSTPHONES$1';
const AUTH_STORAGE_KEY = 'finanzas_authenticated';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Verificar si ya está autenticado en localStorage
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === AUTH_KEY) {
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      setError('');
    } else {
      setError('Clave incorrecta. Inténtalo de nuevo.');
      setPassword('');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <PackageSearch className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Acceso Restringido</CardTitle>
              <CardDescription>
                Ingresa la clave de acceso para continuar al panel financiero de JustPhones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Ingresa la clave de acceso"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-center text-lg"
                    autoFocus
                  />
                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" size="lg">
                  Acceder al Panel Financiero
                </Button>
              </form>
              <div className="mt-6 text-center text-xs text-muted-foreground">
                <p>Sistema de gestión financiera JustPhones</p>
                <p>Acceso autorizado únicamente</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};

function FinanceDashboard() {
  const { sales, isLoading: isLoadingSales } = useSales();
  const { products, isLoading: isLoadingProducts } = useProducts();
  const { customerRequests, isLoading: isLoadingRequests } = useCustomerRequests();
  const { productViews, isLoading: isLoadingViews } = useProductViews();
  const { stockHistory, isLoading: isLoadingStock } = useStockHistory();
  const { fixedCosts, addFixedCost, updateFixedCost, deleteFixedCost } = useFixedCosts();
  const {
    salaryWithdrawals,
    addSalaryWithdrawal,
    updateSalaryWithdrawal,
    deleteSalaryWithdrawal,
  } = useSalaryWithdrawals();
  const { monetaryIncome, addMonetaryIncome, updateMonetaryIncome, deleteMonetaryIncome } = useMonetaryIncome();

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
  const [lowRotationCurrentPage, setLowRotationCurrentPage] = useState(1);
  const [stockRecommendationsCurrentPage, setStockRecommendationsCurrentPage] = useState(1);
  const [popularityCurrentPage, setPopularityCurrentPage] = useState(1);
  const [expandedStockProducts, setExpandedStockProducts] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>('');
  const [activeSection, setActiveSection] = useState('resumen');
  const [activeSalesFilter, setActiveSalesFilter] = useState<SalesFilter>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingFixedCostId, setEditingFixedCostId] = useState<string | null>(null);
  const [editingSalaryId, setEditingSalaryId] = useState<string | null>(null);
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [editingFixedCostValues, setEditingFixedCostValues] = useState<{ name: string; amount: number } | null>(null);
  const [editingSalaryValues, setEditingSalaryValues] = useState<{ description: string; amount: number } | null>(null);
  const [editingIncomeValues, setEditingIncomeValues] = useState<{ name: string; amount: number } | null>(null);

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

  const paginatedPopularity = useMemo(() => {
    return productPopularityData.slice(
      (popularityCurrentPage - 1) * ITEMS_PER_PAGE_RENTABILIDAD,
      popularityCurrentPage * ITEMS_PER_PAGE_RENTABILIDAD,
    );
  }, [productPopularityData, popularityCurrentPage]);

  const popularityTotalPages = Math.ceil(
    productPopularityData.length / ITEMS_PER_PAGE_RENTABILIDAD,
  );

  const handlePopularityPageChange = (page: number) => {
    if (page < 1 || page > popularityTotalPages) return;
    setPopularityCurrentPage(page);
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
      .sort((a, b) => {
        // Primero ordenar por stock ascendente (menos stock primero)
        if (a.stock !== b.stock) {
          return a.stock - b.stock;
        }
        // Si tienen el mismo stock, ordenar por ventas descendentes
        return b.sales - a.sales;
      });
  }, [productPopularityData]);

  const lowRotationProducts = useMemo(() => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const productsWithRecentSales = new Set(
      sales
        .filter(sale => new Date(sale.created_at) >= thirtyDaysAgo)
        .map(sale => sale.product_id)
    );
    return products
      .filter(product => {
        const hasStock = product.colors.some(color => color.stock > 0);
        const hasRecentSale = productsWithRecentSales.has(product.id);
        return hasStock && !hasRecentSale;
      })
      .map(product => ({
        ...product,
        totalStock: product.colors.reduce((sum, c) => sum + c.stock, 0)
      }));
  }, [products, sales]);

  const paginatedLowRotation = useMemo(() => {
    return lowRotationProducts.slice(
      (lowRotationCurrentPage - 1) * ITEMS_PER_PAGE_LOW_ROTATION,
      lowRotationCurrentPage * ITEMS_PER_PAGE_LOW_ROTATION,
    );
  }, [lowRotationProducts, lowRotationCurrentPage]);

  const lowRotationTotalPages = useMemo(() => {
    return Math.ceil(lowRotationProducts.length / ITEMS_PER_PAGE_LOW_ROTATION);
  }, [lowRotationProducts.length]);

  const handleLowRotationPageChange = useCallback((page: number) => {
    if (page < 1 || page > lowRotationTotalPages) return;
    setLowRotationCurrentPage(page);
  }, [lowRotationTotalPages]);

  const growingCategoriesData = useMemo(() => {
    return categoryRevenueData
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 categorías
  }, [categoryRevenueData]);

  const topProductsByCategory = useMemo(() => {
    if (!selectedCategory) return [];
    
    const categoryProducts = products.filter(product => 
      unslugify(product.category) === selectedCategory
    );
    
    const productSales = categoryProducts.map(product => {
      const salesCount = sales
        .filter(sale => sale.product_id === product.id)
        .reduce((sum, sale) => sum + sale.quantity, 0);
      
      return {
        ...product,
        salesCount,
        totalRevenue: sales
          .filter(sale => sale.product_id === product.id)
          .reduce((sum, sale) => sum + sale.total_price, 0)
      };
    });
    
    return productSales
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 3);
  }, [selectedCategory, products, sales]);

  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  const lowStockRecommendations = useMemo(() => {
    // Agrupar productos por nombre
    const groupedByName = products.reduce((acc, product) => {
      const name = unslugify(product.name);
      if (!acc[name]) {
        acc[name] = [];
      }
      acc[name].push(product);
      return acc;
    }, {} as Record<string, typeof products>);

    // Para cada grupo, calcular recomendaciones
    const recommendations = Object.entries(groupedByName).map(([productName, productVariants]) => {
      // Ordenar por modelo
      const sortedVariants = productVariants.sort((a, b) => a.model.localeCompare(b.model));
      
      // Calcular stock total por variante
      const variantsWithStock = sortedVariants.map(variant => {
        const totalStock = variant.colors.reduce((sum, color) => sum + color.stock, 0);
        const recommendedQuantity = Math.max(0, 5 - totalStock);
        
        return {
          ...variant,
          totalStock,
          recommendedQuantity,
          needsRestock: totalStock < 5
        };
      }).filter(variant => variant.needsRestock);

      if (variantsWithStock.length === 0) return null;

      return {
        productName,
        variants: variantsWithStock,
        totalRecommended: variantsWithStock.reduce((sum, v) => sum + v.recommendedQuantity, 0)
      };
    }).filter(Boolean) as Array<{
      productName: string;
      variants: Array<{
        id: string;
        name: string;
        model: string;
        totalStock: number;
        recommendedQuantity: number;
        needsRestock: boolean;
      }>;
      totalRecommended: number;
    }>;

    return recommendations.sort((a, b) => a.productName.localeCompare(b.productName));
  }, [products]);

  const paginatedStockRecommendations = useMemo(() => {
    // Separar productos grandes (> 4 modelos) y pequeños (≤ 4 modelos)
    const largeProducts = lowStockRecommendations.filter(r => r.variants.length > 4);
    const smallProducts = lowStockRecommendations.filter(r => r.variants.length <= 4);

    // Calcular páginas dedicadas para productos grandes
    const largeProductPages = largeProducts.length;

    // Si estamos en una página dedicada a un producto grande
    if (stockRecommendationsCurrentPage <= largeProductPages) {
      const largeProductIndex = stockRecommendationsCurrentPage - 1;
      return [largeProducts[largeProductIndex]];
    }

    // Para páginas con productos pequeños, agrupar de 3 en 3
    const smallProductsStartPage = largeProductPages + 1;
    const smallProductPageIndex = stockRecommendationsCurrentPage - smallProductsStartPage;
    const startIndex = smallProductPageIndex * ITEMS_PER_PAGE_STOCK_RECOMMENDATIONS;
    const endIndex = startIndex + ITEMS_PER_PAGE_STOCK_RECOMMENDATIONS;

    return smallProducts.slice(startIndex, endIndex);
  }, [lowStockRecommendations, stockRecommendationsCurrentPage]);

  const stockRecommendationsTotalPages = useMemo(() => {
    const largeProducts = lowStockRecommendations.filter(r => r.variants.length > 4);
    const smallProducts = lowStockRecommendations.filter(r => r.variants.length <= 4);

    // Páginas dedicadas para productos grandes (1 página por producto grande)
    const largeProductPages = largeProducts.length;

    // Páginas para productos pequeños (agrupados de 3 en 3)
    const smallProductPages = Math.ceil(smallProducts.length / ITEMS_PER_PAGE_STOCK_RECOMMENDATIONS);

    return largeProductPages + smallProductPages;
  }, [lowStockRecommendations.length]);

  const handleStockRecommendationsPageChange = useCallback((page: number) => {
    if (page < 1 || page > stockRecommendationsTotalPages) return;
    setStockRecommendationsCurrentPage(page);
  }, [stockRecommendationsTotalPages]);

  const toggleProductExpansion = useCallback((productName: string) => {
    setExpandedStockProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productName)) {
        newSet.delete(productName);
      } else {
        newSet.add(productName);
      }
      return newSet;
    });
  }, []);

  const filteredSales = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      const saleDay = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate());

      switch (activeSalesFilter) {
        case 'today':
          return saleDay.getTime() === today.getTime();
        case 'yesterday':
          return saleDay.getTime() === yesterday.getTime();
        case 'dayBeforeYesterday':
          return saleDay.getTime() === dayBeforeYesterday.getTime();
        case 'all':
        default:
          return saleDate >= sevenDaysAgo;
      }
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [sales, activeSalesFilter]);

  const productsMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  // Set default category when growing categories data is loaded
  useEffect(() => {
    if (growingCategoriesData.length > 0 && !selectedCategory) {
      setSelectedCategory(growingCategoriesData[0].name);
    }
  }, [growingCategoriesData, selectedCategory]);

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
          {isSidebarOpen && isMobile && (
            <motion.div
              key="sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isSidebarOpen && (
            <motion.aside
              key="sidebar"
              initial={{ x: -80 }}
              animate={{ x: 0 }}
              exit={{ x: -80 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={cn(
                'fixed top-0 left-0 h-full border-r py-8 space-y-6 flex-col items-center',
                isMobile
                  ? 'flex w-[79px] shadow-lg z-30 md:hidden bg-background/70'
                  : 'hidden w-20 md:flex z-20 bg-background'
              )}
            >
              <Logo className="w-12 h-12" />
              <nav className="flex flex-col items-center space-y-4">
                {navigationItems.map((item) => (
                  <TooltipProvider key={item.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={activeSection === item.id ? 'secondary' : 'ghost'}
                          size="icon"
                          className="rounded-lg"
                          onClick={() => scrollToSection(item.id)}
                        >
                          <item.icon className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </nav>
            </motion.aside>
          )}
        </AnimatePresence>

        <div className={`flex-1 w-full ${isSidebarOpen ? 'ml-0 md:ml-20' : 'ml-0'}`}>
          <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b py-3 md:py-4 px-4 md:px-8 flex items-center gap-4 w-full">
            <div className="flex flex-1 items-center justify-start">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                className="h-10 w-10"
              >
                <SidebarToggleIcon className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex flex-1 justify-center">
              <div className="text-center space-y-1">
                <h1 className="text-xl md:text-2xl font-bold mt-2 whitespace-nowrap">Dashboard Financiero</h1>
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  {format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                  Último cierre: {lastClosure ? format(new Date(lastClosure.startDate), "d 'de' MMMM, yyyy", { locale: es }) : 'Ninguno'}
                </p>
              </div>
            </div>
            <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden h-10 w-10">
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
              <div className="hidden md:flex items-center gap-3">
                <div className="w-full md:w-auto md:min-w-[230px] flex items-center">
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
                  className="h-10"
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
                  className="h-10"
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
              </div>
              <div className="hidden md:flex items-center">
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
                  <p className="font-semibold mt-4">Fórmula: SUMA(Cantidad vendida × Precio de venta)</p>
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {financialSummaryDetails.revenueBreakdown.map((item, index) => (
                      <div key={index} className="text-sm flex justify-between">
                        <span>{item.label}</span>
                        <span className={item.isNegative ? 'text-red-600' : 'text-green-600'}>
                          {item.isNegative ? '-' : ''}${item.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 font-semibold">Total: <span className="text-green-600">${financialSummaryDetails.totalSales.toLocaleString()}</span></p>
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
                  <p className="font-semibold mt-4">Fórmula: SUMA(Ingresos) - SUMA(Egresos)</p>
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
                  <p className="mt-2 font-semibold">Total: <span className={financialSummaryDetails.totalMonetaryIncome >= 0 ? 'text-green-600' : 'text-red-600'}>${financialSummaryDetails.totalMonetaryIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></p>
                </FinancialKpiCard>
                <FinancialKpiCard
                  title="Ingresos Totales"
                  value={`$${financialSummaryDetails.totalRevenue.toLocaleString()}`}
                  icon={TrendingUp}
                  detail="Productos + Monetarios"
                  colorClass="text-green-500"
                  custom={2}
                >
                  <p className="font-semibold mt-4">Fórmula: Ingreso por Productos + Movimientos Monetarios</p>
                  <p>Ingreso por Productos: <span className="text-green-600">${financialSummaryDetails.totalSales.toLocaleString()}</span></p>
                  <p>Movimientos Monetarios: <span className={financialSummaryDetails.totalMonetaryIncome >= 0 ? 'text-green-600' : 'text-red-600'}>${financialSummaryDetails.totalMonetaryIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></p>
                  <p className="mt-2 font-semibold">Total: <span className="text-green-600">${financialSummaryDetails.totalRevenue.toLocaleString()}</span></p>
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
                  <p className="font-semibold mt-4">Fórmula: SUMA(Costos por pedido)</p>
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
                  <p className="mt-2 font-semibold">Total: <span className="text-red-600">${financialSummaryDetails.totalStockInvestment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></p>
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
                  <p className="font-semibold mt-4">Fórmula: SUMA(Costos fijos en período)</p>
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
                  <p className="mt-2 font-semibold">Total: <span className="text-red-600">${financialSummaryDetails.totalFixedCostsForPeriod.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></p>
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
                  <p className="font-semibold mt-4">Fórmula: SUMA(Extracciones registradas)</p>
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
                  <p className="mt-2 font-semibold">Total: <span className="text-red-600">${financialSummaryDetails.totalSalaryWithdrawn.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></p>
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
                  <p className="font-semibold mt-4">Fórmula: Costos de Pedidos + Costos Fijos + Extracción de Sueldos</p>
                  <p>Costos de Pedidos: <span className="text-red-600">${financialSummaryDetails.totalStockInvestment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></p>
                  <p>Costos Fijos: <span className="text-red-600">${financialSummaryDetails.totalFixedCostsForPeriod.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></p>
                  <p>Extracción de Sueldos: <span className="text-red-600">${financialSummaryDetails.totalSalaryWithdrawn.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></p>
                  <p className="mt-2 font-semibold">Total: <span className="text-red-600">${financialSummaryDetails.totalCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></p>
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
                  <p className="font-semibold mt-4">Fórmula: Ingresos Totales - Costos Totales</p>
                  <p>Ingresos Totales: <span className="text-green-600">${financialSummaryDetails.totalRevenue.toLocaleString()}</span></p>
                  <p>Costos Totales: <span className="text-red-600">${financialSummaryDetails.totalCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></p>
                  <p className="mt-2 font-semibold">Total: <span className={financialSummaryDetails.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>${financialSummaryDetails.netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></p>
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
                  <p className="font-semibold mt-4">Fórmula: SUMA(Costo del producto × Stock)</p>
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
                  <p className="mt-2 font-semibold">Total: <span className="text-green-600">${financialSummaryDetails.netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></p>
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
                  <p className="font-semibold mt-4">Fórmula: Capital acumulado desde julio 2025 (fecha de inicio del negocio)</p>
                  <p className="font-semibold">Cálculos:</p>
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {financialSummaryDetails.capitalBreakdown.map((item, index) => (
                      <div key={index} className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>{item.month} ingresos</span>
                          <span className="text-green-600">${item.income.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{item.month} costos</span>
                          <span className="text-red-600">-${item.costs.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 font-semibold">Total Ingresos Históricos: <span className="text-green-600">${financialSummaryDetails.totalHistoricalIncome.toLocaleString()}</span></p>
                  <p className="mt-2 font-semibold">Total Costos Históricos: <span className="text-red-600">-${financialSummaryDetails.totalHistoricalCosts.toLocaleString()}</span></p>
                  <p className="mt-2 font-semibold">Capital Disponible: <span className="text-green-600">${financialSummaryDetails.availableCapital.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></p>
                  <p className="mt-2 font-semibold">Total: <span className="text-green-600">${financialSummaryDetails.availableCapital.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></p>
                </FinancialKpiCard>
                <FinancialKpiCard
                  title="Items Vendidos"
                  value={`${financialSummaryDetails.soldItemsCount}`}
                  icon={Package}
                  detail="Unidades vendidas"
                  colorClass="text-amber-500"
                  custom={10}
                >
                  <p className="font-semibold mt-4">Fórmula: SUMA(Cantidades vendidas)</p>
                  <p>Total de unidades vendidas en el período.</p>
                </FinancialKpiCard>
                <FinancialKpiCard
                  title="Tasa de Conversión"
                  value={`${financialSummaryDetails.conversionRate.toFixed(1)}%`}
                  icon={Goal}
                  detail="De pedidos a ventas"
                  custom={11}
                >
                  <p className="font-semibold mt-4">Fórmula: (Items Vendidos / Pedidos Totales) × 100</p>
                  <p>Items Vendidos: <span className="text-amber-600">{financialSummaryDetails.soldItemsCount}</span></p>
                  <p>Pedidos Totales: <span className="text-blue-600">{financialSummaryDetails.requestsCount}</span></p>
                  <p className="mt-2 font-semibold">Total: <span className="text-green-600">{financialSummaryDetails.conversionRate.toFixed(1)}%</span></p>
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
                <Button variant="outline" className="h-20 flex-col" onClick={() => scrollToSection('ventas-historial')}>
                  <VentasIcon className="h-6 w-6 mb-1" />
                  <span>Visualizar ventas</span>
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
                      <VentasIcon className="h-8 w-8" />
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
                {lowRotationProducts.length > 0 && (
                  <motion.div
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-2xl bg-blue-500/10 border-blue-500/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="h-5 w-5" />
                          Productos con baja rotación o sin venta
                        </CardTitle>
                        <CardDescription>
                          Productos con stock disponible pero sin ventas en los últimos 30 días
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {paginatedLowRotation.map(product => (
                            <div key={product.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{unslugify(product.name)} ({product.model})</span>
                                <Badge variant="secondary">Sin venta</Badge>
                              </div>
                              <span className="text-sm text-muted-foreground">Stock: {product.totalStock}</span>
                            </div>
                          ))}
                        </div>
                        {lowRotationTotalPages > 1 && (
                          <div className="flex items-center justify-between mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLowRotationPageChange(lowRotationCurrentPage - 1)}
                              disabled={lowRotationCurrentPage === 1}
                            >
                              Anterior
                            </Button>
                            <span className="text-sm text-muted-foreground">
                              Página {lowRotationCurrentPage} de {lowRotationTotalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLowRotationPageChange(lowRotationCurrentPage + 1)}
                              disabled={lowRotationCurrentPage === lowRotationTotalPages}
                            >
                              Siguiente
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
                {growingCategoriesData.length > 0 && (
                  <motion.div
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-2xl bg-violet-500/10 border-violet-500/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Categorías en crecimiento
                        </CardTitle>
                        <CardDescription>
                          Tendencias de ventas por categoría - selecciona una para ver los productos más vendidos
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Seleccionar categoría:</label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Elige una categoría" />
                              </SelectTrigger>
                              <SelectContent>
                                {growingCategoriesData.map((category) => (
                                  <SelectItem key={category.name} value={category.name}>
                                    {category.name} - ${category.value.toLocaleString()}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {selectedCategory && topProductsByCategory.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold">Top 3 productos en {selectedCategory}:</h4>
                              {topProductsByCategory.map((product, index) => (
                                <div key={product.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                                      #{index + 1}
                                    </span>
                                    <span className="text-sm font-medium">{unslugify(product.name)} ({product.model})</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-semibold">${product.totalRevenue.toLocaleString()}</div>
                                    <div className="text-xs text-muted-foreground">{product.salesCount} unidades</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {selectedCategory && topProductsByCategory.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No hay productos vendidos en esta categoría
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
                {lowStockRecommendations.length > 0 && (
                  <motion.div
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-2xl bg-white/10 border-white/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Recomendaciones de Stock
                        </CardTitle>
                        <CardDescription>
                          Productos con bajo inventario - sugerencias para mantener stock mínimo de 5 unidades
                        </CardDescription>
                        {stockRecommendationsTotalPages > 1 && (
                          <div className="flex items-center justify-between mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStockRecommendationsPageChange(stockRecommendationsCurrentPage - 1)}
                              disabled={stockRecommendationsCurrentPage === 1}
                            >
                              Anterior
                            </Button>
                            <span className="text-sm text-muted-foreground">
                              Página {stockRecommendationsCurrentPage} de {stockRecommendationsTotalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStockRecommendationsPageChange(stockRecommendationsCurrentPage + 1)}
                              disabled={stockRecommendationsCurrentPage === stockRecommendationsTotalPages}
                            >
                              Siguiente
                            </Button>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {paginatedStockRecommendations.map((recommendation, index) => {
                            const isExpanded = expandedStockProducts.has(recommendation.productName);
                            const hasManyModels = recommendation.variants.length > 4;
                            
                            return (
                              <div key={recommendation.productName} className="border rounded-lg p-4 bg-gray-50/50">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold text-sm">{recommendation.productName}</h4>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      Total recomendado: {recommendation.totalRecommended} unidades
                                    </Badge>
                                    {hasManyModels && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleProductExpansion(recommendation.productName)}
                                        className="h-6 w-6 p-0"
                                      >
                                        <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  {(!hasManyModels || isExpanded) && recommendation.variants.map((variant) => (
                                    <div key={variant.id} className="flex items-center justify-between text-sm bg-orange-500/10 p-2 rounded border">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{variant.model}</span>
                                        <Badge variant="secondary" className="text-xs">
                                          Stock actual: {variant.totalStock}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">Pedir:</span>
                                        <Badge variant="destructive" className="text-xs">
                                          {variant.recommendedQuantity} unidades
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                  {hasManyModels && !isExpanded && (
                                    <div className="flex items-center justify-center text-sm bg-orange-500/10 p-3 rounded border">
                                      <div className="text-center">
                                        <span className="font-medium text-muted-foreground">
                                          {recommendation.variants.length} modelos requieren reposición
                                        </span>
                                        <div className="mt-1">
                                          <Badge variant="destructive" className="text-xs">
                                            Total a pedir: {recommendation.totalRecommended} unidades
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
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
              <div className="space-y-8">
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
                <div className="grid grid-cols-1">
                  <Card className="shadow-lg rounded-2xl">
                    <CardHeader>
                      <CardTitle>Ganancia por Cierre de Caja</CardTitle>
                      <CardDescription>Evolución mensual de ganancias netas</CardDescription>
                    </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={financialSummaryDetails.capitalBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis
                          tickFormatter={(value) => `$${Number(value) / 1000}k`}
                          tick={{ fontSize: 12 }}
                        />
                        <RechartsTooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0]?.payload;
                              return (
                                <div className="rounded-lg border bg-background/80 backdrop-blur-sm p-3 shadow-sm">
                                  <div className="grid grid-cols-1 gap-2">
                                    <div className="flex flex-col">
                                      <span className="text-[0.70rem] uppercase text-muted-foreground">Mes</span>
                                      <span className="font-bold text-muted-foreground">{label}</span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[0.70rem] uppercase text-muted-foreground">Ganancia Neta</span>
                                      <span className="font-bold" style={{ color: data?.net >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}>
                                        ${data?.net?.toLocaleString() || 0}
                                      </span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[0.70rem] uppercase text-muted-foreground">Ingresos</span>
                                      <span className="font-bold text-green-600">
                                        ${data?.income?.toLocaleString() || 0}
                                      </span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[0.70rem] uppercase text-muted-foreground">Costos</span>
                                      <span className="font-bold text-red-600">
                                        ${data?.costs?.toLocaleString() || 0}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="net"
                          name="Ganancia Neta"
                          stroke="hsl(var(--primary))"
                          strokeWidth={3}
                          dot={{ r: 5 }}
                          activeDot={{ r: 7 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
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
              id="popularidad"
              ref={(el) => {
                sectionRefs.current['popularidad'] = el;
              }}
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-bold mb-4">Análisis de Popularidad de Productos</h2>
              <Card className="shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Análisis de Popularidad de Productos
                  </CardTitle>
                  <CardDescription>
                    Compara vistas, pedidos y ventas para identificar tendencias y oportunidades.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-medium">Ordenar por:</span>
                    <Button variant={popularitySort === 'sales' ? 'default' : 'outline'} size="sm" onClick={() => setPopularitySort('sales')}>Ventas</Button>
                    <Button variant={popularitySort === 'requests' ? 'default' : 'outline'} size="sm" onClick={() => setPopularitySort('requests')}>Pedidos</Button>
                    <Button variant={popularitySort === 'views' ? 'default' : 'outline'} size="sm" onClick={() => setPopularitySort('views')}>Vistas</Button>
                  </div>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-center">Vistas</TableHead>
                          <TableHead className="text-center">Pedidos</TableHead>
                          <TableHead className="text-center">Ventas</TableHead>
                          <TableHead className="text-center">Stock</TableHead>
                          <TableHead className="text-center">Conversión (Venta/Pedido)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedPopularity.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.model}</p>
                            </TableCell>
                            <TableCell className="text-center font-medium">{product.views}</TableCell>
                            <TableCell className="text-center font-medium">{product.requests}</TableCell>
                            <TableCell className="text-center font-bold text-primary">{product.sales}</TableCell>
                            <TableCell className="text-center font-medium">{product.stock}</TableCell>
                            <TableCell className="text-center font-medium">
                              {product.requests > 0 ? `${((product.sales / product.requests) * 100).toFixed(0)}%` : '0%'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {popularityTotalPages > 1 && (
                    <div className="mt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => handlePopularityPageChange(popularityCurrentPage - 1)}
                              disabled={popularityCurrentPage === 1}
                            />
                          </PaginationItem>

                          <div className="hidden sm:flex items-center gap-1">
                            {getPageNumbers(popularityTotalPages, popularityCurrentPage).map((page, index) => (
                              <PaginationItem key={index}>
                                {typeof page === 'number' ? (
                                  <PaginationLink
                                    onClick={() => handlePopularityPageChange(page)}
                                    isActive={popularityCurrentPage === page}
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
                              Página {popularityCurrentPage} de {popularityTotalPages}
                            </span>
                          </PaginationItem>

                          <PaginationItem>
                            <PaginationNext
                              onClick={() => handlePopularityPageChange(popularityCurrentPage + 1)}
                              disabled={popularityCurrentPage === popularityTotalPages}
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
              <h2 className="text-2xl font-bold mb-4">Gestión de Gastos y Sueldos</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle>Costos Fijos Mensuales</CardTitle>
                  </CardHeader>
                  <form
                    onSubmit={handleSubmitFixedCost(onFixedCostSubmit)}
                    className="flex items-start gap-2 mb-4 px-6"
                  >
                    <Input {...registerFixedCost('name')} placeholder="Nombre del costo" className="h-9" />
                    <Input {...registerFixedCost('amount', { valueAsNumber: true })} type="number" placeholder="$" className="h-9 w-24" />
                    <Button type="submit" size="icon" className="h-9 w-9 flex-shrink-0">
                      <PlusCircle />
                    </Button>
                  </form>
                  <CardContent className="overflow-y-auto max-h-96">
                    <ul className="space-y-2 pr-2">
                      {fixedCosts.map((cost) => (
                        <li key={cost.id} className="flex justify-between items-center text-sm">
                          {editingFixedCostId === cost.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={editingFixedCostValues?.name || cost.name}
                                onChange={(e) => setEditingFixedCostValues(prev => ({ ...prev!, name: e.target.value }))}
                                className="h-8 text-sm"
                                placeholder="Nombre del costo"
                              />
                              <Input
                                type="number"
                                value={editingFixedCostValues?.amount || cost.amount}
                                onChange={(e) => setEditingFixedCostValues(prev => ({ ...prev!, amount: parseFloat(e.target.value) || 0 }))}
                                className="h-8 w-20 text-sm"
                                placeholder="$"
                              />
                              <Button
                                size="sm"
                                onClick={async () => {
                                  if (editingFixedCostValues) {
                                    await updateFixedCost(cost.id, editingFixedCostValues);
                                    setEditingFixedCostId(null);
                                    setEditingFixedCostValues(null);
                                  }
                                }}
                                className="h-8"
                              >
                                Guardar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingFixedCostId(null);
                                  setEditingFixedCostValues(null);
                                }}
                                className="h-8"
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span>{cost.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">${cost.amount.toLocaleString()}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-full"
                                  onClick={() => {
                                    setEditingFixedCostId(cost.id);
                                    setEditingFixedCostValues({ name: cost.name, amount: cost.amount });
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
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
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle>Extracciones de Sueldo</CardTitle>
                  </CardHeader>
                  <form
                    onSubmit={handleSubmitSalary(onSalarySubmit)}
                    className="flex items-start gap-2 mb-4 px-6"
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
                  <CardContent className="overflow-y-auto max-h-96">
                    <ul className="space-y-2 pr-2">
                      {salaryWithdrawals.map((s) => (
                        <li key={s.id} className="flex justify-between items-center text-sm">
                          {editingSalaryId === s.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={editingSalaryValues?.description || s.description || ''}
                                onChange={(e) => setEditingSalaryValues(prev => ({ ...prev!, description: e.target.value }))}
                                className="h-8 text-sm"
                                placeholder="Descripción"
                              />
                              <Input
                                type="number"
                                value={editingSalaryValues?.amount || s.amount}
                                onChange={(e) => setEditingSalaryValues(prev => ({ ...prev!, amount: parseFloat(e.target.value) || 0 }))}
                                className="h-8 w-20 text-sm"
                                placeholder="$"
                              />
                              <Button
                                size="sm"
                                onClick={async () => {
                                  if (editingSalaryValues) {
                                    await updateSalaryWithdrawal(s.id, editingSalaryValues);
                                    setEditingSalaryId(null);
                                    setEditingSalaryValues(null);
                                  }
                                }}
                                className="h-8"
                              >
                                Guardar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingSalaryId(null);
                                  setEditingSalaryValues(null);
                                }}
                                className="h-8"
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div>
                                <span>{s.description || 'Sin descripción'}</span>
                                <p className="text-xs text-muted-foreground">
                                  {format(parseISO(s.created_at), 'dd/MM/yy')}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">${s.amount.toLocaleString()}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-full"
                                  onClick={() => {
                                    setEditingSalaryId(s.id);
                                    setEditingSalaryValues({ description: s.description || '', amount: s.amount });
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
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
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle>Ingresos/Extracciones</CardTitle>
                  </CardHeader>
                  <form
                    onSubmit={handleSubmitIncome(onIncomeSubmit)}
                    className="flex items-start gap-2 mb-4 px-6"
                  >
                    <Input {...registerIncome('name')} placeholder="Nombre del ingreso/egreso" className="h-9" />
                    <Input {...registerIncome('amount', { valueAsNumber: true })} type="number" placeholder="±$" className="h-9 w-24" />
                    <Button type="submit" size="icon" className="h-9 w-9 flex-shrink-0">
                      <PlusCircle />
                    </Button>
                  </form>
                  <CardContent className="overflow-y-auto max-h-96">
                    <ul className="space-y-2 pr-2">
                      {monetaryIncome.map((income) => (
                        <li key={income.id} className="flex justify-between items-center text-sm">
                          {editingIncomeId === income.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={editingIncomeValues?.name || income.name}
                                onChange={(e) => setEditingIncomeValues(prev => ({ ...prev!, name: e.target.value }))}
                                className="h-8 text-sm"
                                placeholder="Nombre del ingreso"
                              />
                              <Input
                                type="number"
                                value={editingIncomeValues?.amount || income.amount}
                                onChange={(e) => setEditingIncomeValues(prev => ({ ...prev!, amount: parseFloat(e.target.value) || 0 }))}
                                className="h-8 w-20 text-sm"
                                placeholder="±$"
                              />
                              <Button
                                size="sm"
                                onClick={async () => {
                                  if (editingIncomeValues) {
                                    await updateMonetaryIncome(income.id, editingIncomeValues);
                                    setEditingIncomeId(null);
                                    setEditingIncomeValues(null);
                                  }
                                }}
                                className="h-8"
                              >
                                Guardar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingIncomeId(null);
                                  setEditingIncomeValues(null);
                                }}
                                className="h-8"
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div>
                                <span>{income.name}</span>
                                <p className="text-xs text-muted-foreground">
                                  {format(parseISO(income.created_at), 'dd/MM/yy')}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">${income.amount.toLocaleString()}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-full"
                                  onClick={() => {
                                    setEditingIncomeId(income.id);
                                    setEditingIncomeValues({ name: income.name, amount: income.amount });
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
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
                            </>
                          )}
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
                            <div className="font-normal text-red-500">
                              -${pedido.totalCost.toLocaleString()}
                              <div className="text-xs text-muted-foreground">Costo</div>
                            </div>
                            <div className="font-normal text-green-500">
                              +${pedido.profit.toLocaleString()}
                              <div className="text-xs text-muted-foreground">Ganancia posible</div>
                            </div>
                            <div className="font-normal text-primary">
                              {pedido.margin.toFixed(1)}%
                              <div className="text-xs text-muted-foreground">Margen</div>
                            </div>
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

            <motion.section
              id="ventas-historial"
              ref={(el) => {
                sectionRefs.current['ventas-historial'] = el;
              }}
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-bold mb-4">Historial de Ventas</h2>
              <Card className="shadow-lg rounded-2xl">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <CardTitle>Ventas Registradas</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'all', label: 'Últimos 7 días' },
                        { key: 'today', label: 'Hoy' },
                        { key: 'yesterday', label: 'Ayer' },
                        { key: 'dayBeforeYesterday', label: 'Anteayer' },
                      ].map((filter) => (
                        <Button
                          key={filter.key}
                          variant={activeSalesFilter === filter.key ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setActiveSalesFilter(filter.key as SalesFilter)}
                        >
                          {filter.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Precio Unit.</TableHead>
                          <TableHead>Descuento</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Hace</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSales.map((sale) => {
                          const product = productsMap.get(sale.product_id);
                          const saleDate = new Date(sale.created_at);
                          const timeAgo = formatDistanceToNow(saleDate, { addSuffix: true, locale: es });

                          return (
                            <TableRow key={sale.id}>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{unslugify(sale.product_name)}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {sale.product_model} - {sale.color_name}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>{sale.quantity}</TableCell>
                              <TableCell>${sale.price_per_unit.toLocaleString()}</TableCell>
                              <TableCell>
                                {sale.discount_code ? (
                                  <div className="flex flex-col">
                                    <Badge variant="secondary" className="w-fit">
                                      {sale.discount_code}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      -{sale.discount_percentage}%
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                ${sale.total_price.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span>{format(saleDate, 'dd/MM/yyyy')}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(saleDate, 'HH:mm')}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {timeAgo}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {filteredSales.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay ventas registradas para el período seleccionado.
                    </div>
                  )}
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
        <ProtectedRoute>
          <FinanceDashboard />
        </ProtectedRoute>
      </MonetaryIncomeProvider>
    </SalaryWithdrawalsProvider>
  );
}
