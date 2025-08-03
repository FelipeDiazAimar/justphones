
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useSales } from '@/hooks/use-sales';
import { useProducts } from '@/hooks/use-products';
import { useProductViews } from '@/hooks/use-product-views';
import { useCustomerRequests } from '@/hooks/use-customer-requests';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, ShoppingCart, Package, TrendingUp, AlertTriangle, Eye, HelpCircle, ArrowDownUp, TrendingDown, ChevronsUpDown, Percent, BarChart, PackageSearch, Activity, Coins, Goal, History, PlusCircle, Trash, ChevronDown, Edit, Wallet, Banknote, Building, CreditCard, Calculator, PiggyBank } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip, XAxis, YAxis, CartesianGrid, BarChart as RechartsBarChart, Bar } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { unslugify, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { Product } from '@/lib/products';
import { useStockHistory } from '@/hooks/use-stock-history';
import type { StockHistory } from '@/lib/stock-history';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getWeek, getYear, format, parseISO, startOfToday, startOfWeek, startOfMonth, startOfYear, isAfter, getDaysInMonth, endOfMonth, endOfYear, endOfWeek, getMonth, isWithinInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFixedCosts } from '@/hooks/use-fixed-costs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { FixedCost } from '@/lib/fixed-costs';
import { useSalaryWithdrawals } from '@/hooks/use-salary-withdrawals';
import type { SalaryWithdrawal } from '@/lib/salary-withdrawals';
import { Textarea } from '@/components/ui/textarea';
import { useMonetaryIncome } from '@/hooks/use-monetary-income';
import type { MonetaryIncome } from '@/lib/monetary-income';
import { ScrollArea } from '@/components/ui/scroll-area';

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const ITEMS_PER_PAGE = 5;

const rentabilidadPaymentOptions = {
    list: { label: 'Precio de Lista', discount: 0 },
    cash: { label: 'Efectivo/Transferencia (20% OFF)', discount: 0.2 },
    debit: { label: 'Tarjeta de Débito (10% OFF)', discount: 0.1 },
};

const fixedCostSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "El nombre es requerido."),
    amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0."),
});

const salaryWithdrawalSchema = z.object({
    id: z.string().optional(),
    amount: z.coerce.number().min(1, "El monto debe ser mayor a 1."),
    description: z.string().optional(),
});

const monetaryIncomeSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "El nombre es requerido."),
    amount: z.coerce.number().min(1, "El monto debe ser mayor a 1."),
    description: z.string().optional(),
});


const EditablePriceCell = ({ product, field, value }: { product: Product; field: 'cost' | 'price'; value: number }) => {
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
                description: `El ${field} de ${unslugify(product.name)} se actualizó a $${currentValue.toLocaleString()}.`
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
            className="w-28 text-right"
            autoFocus
            onFocus={(e) => e.target.select()}
        />
    ) : (
        <div onClick={() => setIsEditing(true)} className="cursor-pointer text-right w-full h-full px-2 py-1 rounded-md hover:bg-muted">
            ${value.toLocaleString()}
        </div>
    );
};


export default function AdminFinancePage() {
  const { sales, isLoading: isLoadingSales } = useSales();
  const { products, updateProduct, isLoading: isLoadingProducts } = useProducts();
  const { productViews, isLoading: isLoadingViews } = useProductViews();
  const { customerRequests, isLoading: isLoadingRequests } = useCustomerRequests();
  const { stockHistory, isLoading: isLoadingStockHistory } = useStockHistory();
  const { fixedCosts, addFixedCost, updateFixedCost, deleteFixedCost, isLoading: isLoadingFixedCosts } = useFixedCosts();
  const { salaryWithdrawals, addSalaryWithdrawal, updateSalaryWithdrawal, deleteSalaryWithdrawal, isLoading: isLoadingSalaryWithdrawals } = useSalaryWithdrawals();
  const { monetaryIncome, addMonetaryIncome, updateMonetaryIncome, deleteMonetaryIncome, isLoading: isLoadingMonetaryIncome } = useMonetaryIncome();

  const [sortPopularityBy, setSortPopularityBy] = useState<'sales' | 'requests' | 'views'>('sales');
  
  const [popularityCurrentPage, setPopularityCurrentPage] = useState(1);
  const [rentabilidadCurrentPage, setRentabilidadCurrentPage] = useState(1);
  const [pedidosCurrentPage, setPedidosCurrentPage] = useState(1);

  const [rentabilidadPaymentMethod, setRentabilidadPaymentMethod] = useState<keyof typeof rentabilidadPaymentOptions>('list');
  const [salesChartView, setSalesChartView] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [profitChartView, setProfitChartView] = useState<'daily' | 'weekly' | 'monthly' | 'by_order'>('daily');

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Generar meses disponibles desde julio 2025 hasta el mes actual
  const getAvailableMonths = () => {
    const months = [];
    const startDate = new Date(2025, 6, 1); // Julio 2025 (mes 6 porque enero es 0)
    const currentDate = new Date();
    
    let currentMonth = new Date(startDate);
    
    while (currentMonth <= currentDate) {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const monthValue = `${year}-${String(month).padStart(2, '0')}`;
      const monthLabel = currentMonth.toLocaleDateString('es-ES', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      months.push({ value: monthValue, label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1) });
      
      // Avanzar al siguiente mes
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
    
    return months.reverse(); // Mostrar el más reciente primero
  };

  // Estado para controlar la expansión de cada card
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const [rentabilidadSort, setRentabilidadSort] = useState<{
    column: 'name' | 'cost' | 'price' | 'profit' | 'stock' | 'margin';
    direction: 'asc' | 'desc';
  }>({ column: 'profit', direction: 'desc' });

  const [isEditCostDialogOpen, setIsEditCostDialogOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<FixedCost | null>(null);

  const [isSalaryDialogOpen, setIsSalaryDialogOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<SalaryWithdrawal | null>(null);

  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<MonetaryIncome | null>(null);
  const [isIncomeHistoryDialogOpen, setIsIncomeHistoryDialogOpen] = useState(false);

  // Estados para controlar el colapso de cada card
  const [isRevenueExpanded, setIsRevenueExpanded] = useState(false);
  const [isProfitExpanded, setIsProfitExpanded] = useState(false);
  const [isFinancialCapitalExpanded, setIsFinancialCapitalExpanded] = useState(false);
  const [isCostsExpanded, setIsCostsExpanded] = useState(false);

  // Estado para el diálogo de desglose de ingresos
  const [isRevenueBreakdownDialogOpen, setIsRevenueBreakdownDialogOpen] = useState(false);

  const { toast } = useToast();

  const {
      register: registerFixedCost,
      handleSubmit: handleSubmitFixedCost,
      reset: resetFixedCost,
      formState: { errors: errorsFixedCost },
  } = useForm<z.infer<typeof fixedCostSchema>>({
      resolver: zodResolver(fixedCostSchema.omit({ id: true })),
      defaultValues: { name: '', amount: 0 },
  });

  const {
      register: registerEditFixedCost,
      handleSubmit: handleSubmitEditFixedCost,
      reset: resetEditFixedCost,
      formState: { errors: errorsEditFixedCost },
  } = useForm<z.infer<typeof fixedCostSchema>>({
      resolver: zodResolver(fixedCostSchema),
  });

  const {
      register: registerSalary,
      handleSubmit: handleSubmitSalary,
      reset: resetSalary,
      formState: { errors: errorsSalary },
  } = useForm<z.infer<typeof salaryWithdrawalSchema>>({
      resolver: zodResolver(salaryWithdrawalSchema.omit({ id: true })),
      defaultValues: { amount: 0, description: '' },
  });

  const {
      register: registerEditSalary,
      handleSubmit: handleSubmitEditSalary,
      reset: resetEditSalary,
      formState: { errors: errorsEditSalary },
  } = useForm<z.infer<typeof salaryWithdrawalSchema>>({
      resolver: zodResolver(salaryWithdrawalSchema),
  });

  const {
    register: registerIncome,
    handleSubmit: handleSubmitIncome,
    reset: resetIncome,
    formState: { errors: errorsIncome },
  } = useForm<z.infer<typeof monetaryIncomeSchema>>({
    resolver: zodResolver(monetaryIncomeSchema.omit({ id: true })),
    defaultValues: { name: '', amount: 0, description: '' },
  });

  const {
      register: registerEditIncome,
      handleSubmit: handleSubmitEditIncome,
      reset: resetEditIncome,
      formState: { errors: errorsEditIncome },
  } = useForm<z.infer<typeof monetaryIncomeSchema>>({
      resolver: zodResolver(monetaryIncomeSchema),
  });


  const onFixedCostSubmit = async (data: z.infer<typeof fixedCostSchema>) => {
      const success = await addFixedCost(data);
      if (success) {
          toast({ title: "Costo Fijo Añadido" });
          resetFixedCost({ name: '', amount: 0 });
      }
  };
  
  const handleEditCost = (cost: FixedCost) => {
    setEditingCost(cost);
    resetEditFixedCost(cost);
    setIsEditCostDialogOpen(true);
  };

  const onEditFixedCostSubmit = async (data: z.infer<typeof fixedCostSchema>) => {
    if (!editingCost) return;
    const success = await updateFixedCost(editingCost.id, { name: data.name, amount: data.amount });
    if (success) {
        toast({ title: "Costo Fijo Actualizado" });
        setIsEditCostDialogOpen(false);
        setEditingCost(null);
    }
  };

  const onSalarySubmit = async (data: z.infer<typeof salaryWithdrawalSchema>) => {
      const success = await addSalaryWithdrawal({ amount: data.amount, description: data.description });
      if (success) {
          toast({ title: "Extracción de Sueldo Registrada" });
          resetSalary({ amount: 0, description: '' });
      }
  };

  const handleEditSalary = (salary: SalaryWithdrawal) => {
    setEditingSalary(salary);
    resetEditSalary(salary);
    setIsSalaryDialogOpen(true);
  };

  const onEditSalarySubmit = async (data: z.infer<typeof salaryWithdrawalSchema>) => {
    if (!editingSalary) return;
    const success = await updateSalaryWithdrawal(editingSalary.id, { amount: data.amount, description: data.description });
    if (success) {
        toast({ title: "Extracción de Sueldo Actualizada" });
        setIsSalaryDialogOpen(false);
        setEditingSalary(null);
    }
  };

  const onIncomeSubmit = async (data: z.infer<typeof monetaryIncomeSchema>) => {
    const success = await addMonetaryIncome(data);
    if (success) {
        toast({ title: "Ingreso Monetario Registrado" });
        resetIncome({ name: '', amount: 0, description: '' });
    }
  };

  const handleEditIncome = (income: MonetaryIncome) => {
    setEditingIncome(income);
    resetEditIncome(income);
    setIsIncomeDialogOpen(true);
  };

  const onEditIncomeSubmit = async (data: z.infer<typeof monetaryIncomeSchema>) => {
    if (!editingIncome) return;
    const success = await updateMonetaryIncome(editingIncome.id, { name: data.name, amount: data.amount, description: data.description });
    if (success) {
        toast({ title: "Ingreso Actualizado" });
        setIsIncomeDialogOpen(false);
        setEditingIncome(null);
    }
  };

  // Función para alternar expansión de cards
  const toggleCard = (cardId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  // Función helper para filtrar por mes específico (del día 2 del mes al día 1 del siguiente)
  const isInSelectedMonth = (dateString: string) => {
    const date = parseISO(dateString);
    const [year, month] = selectedMonth.split('-').map(Number);
    
    // Inicio del período: día 2 del mes seleccionado
    const periodStart = new Date(year, month - 1, 2); // month - 1 porque los meses en Date son 0-indexed
    
    // Fin del período: día 1 del mes siguiente
    const periodEnd = new Date(year, month, 1); // Día 1 del mes siguiente
    
    return date >= periodStart && date <= periodEnd;
  };

  // Función helper para filtrar desde julio 2025 en adelante (comenzando el día 2)
  const isFromJulyOnwards = (dateString: string) => {
    const date = parseISO(dateString);
    const julyStart = new Date(2025, 6, 2); // 2 de julio 2025 (mes 6 porque enero es 0)
    return date >= julyStart;
  };

  const isLoading = isLoadingSales || isLoadingProducts || isLoadingViews || isLoadingStockHistory || isLoadingRequests || isLoadingFixedCosts || isLoadingSalaryWithdrawals || isLoadingMonetaryIncome;

  const salesChartData = useMemo(() => {
    if (salesChartView === 'daily') {
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      const dailySales = sales
        .filter(sale => new Date(sale.created_at) >= last30Days)
        .reduce((acc, sale) => {
          const date = new Date(sale.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
          if (!acc[date]) {
            acc[date] = 0;
          }
          acc[date] += sale.total_price;
          return acc;
        }, {} as Record<string, number>);
      return Object.entries(dailySales).map(([date, total]) => ({ date, total })).reverse();
    }
    
    if (salesChartView === 'monthly') {
      const last12Months = new Date();
      last12Months.setMonth(last12Months.getMonth() - 12);
      const monthlySales = sales
        .filter(sale => new Date(sale.created_at) >= last12Months)
        .reduce((acc, sale) => {
            const saleDate = new Date(sale.created_at);
            const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
            if (!acc[monthKey]) {
              acc[monthKey] = { date: saleDate.toLocaleString('es-ES', { month: 'short', year: '2-digit' }), total: 0 };
            }
            acc[monthKey].total += sale.total_price;
            return acc;
        }, {} as Record<string, { date: string, total: number }>);
        return Object.values(monthlySales).sort((a, b) => {
        const aTyped = a as { date: string, total: number };
        const bTyped = b as { date: string, total: number };
        const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        const [aMonthStr, aYearStr] = aTyped.date.split('. de ');
        const [bMonthStr, bYearStr] = bTyped.date.split('. de ');
        return (Number(aYearStr) * 100 + months.indexOf(aMonthStr)) - (Number(bYearStr) * 100 + months.indexOf(bMonthStr));
      });
    }

    if (salesChartView === 'yearly') {
        const yearlySales = sales.reduce((acc, sale) => {
            const year = new Date(sale.created_at).getFullYear().toString();
            if (!acc[year]) {
                acc[year] = { date: year, total: 0 };
            }
            acc[year].total += sale.total_price;
            return acc;
        }, {} as Record<string, { date: string, total: number }>);
        return Object.values(yearlySales).sort((a, b) => {
            const aTyped = a as { date: string, total: number };
            const bTyped = b as { date: string, total: number };
            return Number(aTyped.date) - Number(bTyped.date);
        });
    }

    return [];
  }, [sales, salesChartView]);

  const salesByCategory = useMemo(() => {
    const categorySales: Record<string, number> = {
        'Case': 0,
        'Accessory': 0,
        'Auriculares': 0,
    };
    
    sales.forEach(sale => {
        const product = products.find(p => p.id === sale.product_id);
        if (product) {
            const categoryName = product.category === 'case' ? 'Case' : unslugify(product.category);
            if (categoryName in categorySales) {
                categorySales[categoryName] += sale.total_price;
            }
        }
    });

    return Object.entries(categorySales).map(([name, value]) => ({ name, value }));
  }, [sales, products]);
  
  const productPopularity = useMemo(() => {
    const productStats = products.map(product => {
      const views = productViews.find(v => v.product_id === product.id)?.view_count || 0;
      
      const requests = customerRequests
        .filter(item => item.product_id === product.id)
        .reduce((sum, item) => sum + item.quantity, 0);

      const salesCount = sales
        .filter(sale => sale.product_id === product.id)
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
      };
    });

    return productStats.sort((a, b) => b[sortPopularityBy] - a[sortPopularityBy]);

  }, [products, productViews, customerRequests, sales, sortPopularityBy]);

  const rentabilidadData = useMemo(() => {
      const discount = rentabilidadPaymentOptions[rentabilidadPaymentMethod].discount;

      const data = products.map(product => {
          const stock = product.colors.reduce((sum, color) => sum + color.stock, 0);
          const finalPrice = product.price * (1 - discount);
          const profit = finalPrice - product.cost;
          const margin = product.cost > 0 ? ((finalPrice - product.cost) / product.cost) * 100 : 0;
          return {
              ...product,
              price: finalPrice, 
              stock,
              profit,
              margin
          };
      });

      return data.sort((a, b) => {
          const { column, direction } = rentabilidadSort;
          const aVal = column === 'name' ? unslugify(a[column]) : a[column];
          const bVal = column === 'name' ? unslugify(b[column]) : b[column];

          if (typeof aVal === 'string' && typeof bVal === 'string') {
              return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
          }
          if (typeof aVal === 'number' && typeof bVal === 'number') {
              return direction === 'asc' ? aVal - bVal : bVal - aVal;
          }
          return 0;
      });
  }, [products, rentabilidadSort, rentabilidadPaymentMethod]);

  const handleRentabilidadSort = (column: 'name' | 'cost' | 'price' | 'profit' | 'stock' | 'margin') => {
    setRentabilidadSort(prev => ({
        column,
        direction: prev.column === column && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };
  
  const getPageNumbers = (totalPages: number, currentPage: number) => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const paginatedPopularity = useMemo(() => {
    return productPopularity.slice(
      (popularityCurrentPage - 1) * ITEMS_PER_PAGE,
      popularityCurrentPage * ITEMS_PER_PAGE
    );
  }, [productPopularity, popularityCurrentPage]);

  const popularityTotalPages = Math.ceil(productPopularity.length / ITEMS_PER_PAGE);

  const handlePopularityPageChange = (page: number) => {
    if (page < 1 || page > popularityTotalPages) return;
    setPopularityCurrentPage(page);
    const popularProductsSection = document.getElementById('popular-products-section');
    if (popularProductsSection) {
        popularProductsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const paginatedRentabilidad = useMemo(() => {
    return rentabilidadData.slice(
        (rentabilidadCurrentPage - 1) * ITEMS_PER_PAGE,
        rentabilidadCurrentPage * ITEMS_PER_PAGE
    );
  }, [rentabilidadData, rentabilidadCurrentPage]);

  const rentabilidadTotalPages = Math.ceil(rentabilidadData.length / ITEMS_PER_PAGE);

  const handleRentabilidadPageChange = (page: number) => {
    if (page < 1 || page > rentabilidadTotalPages) return;
    setRentabilidadCurrentPage(page);
    const rentabilidadSection = document.getElementById('rentabilidad-section');
    if (rentabilidadSection) {
        rentabilidadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const groupedStockHistory = useMemo(() => {
    if (!stockHistory || stockHistory.length === 0) return [];
  
    const grouped = stockHistory.reduce((acc, entry) => {
      const pedidoId = entry.pedido_id;
      if (!acc[pedidoId]) {
        acc[pedidoId] = {
          entries: [],
          date: new Date(entry.created_at),
          totalCost: 0,
          totalPrice: 0,
        };
      }
      acc[pedidoId].entries.push(entry);
      acc[pedidoId].totalCost += (entry.cost || 0) * entry.quantity_added;
      acc[pedidoId].totalPrice += (entry.price || 0) * entry.quantity_added;
      return acc;
    }, {} as Record<string, { entries: StockHistory[], date: Date, totalCost: number, totalPrice: number }>);
  
    return Object.entries(grouped)
      .sort(([, a], [, b]) => {
        const aTyped = a as { entries: any[], date: Date, totalCost: number, totalPrice: number };
        const bTyped = b as { entries: any[], date: Date, totalCost: number, totalPrice: number };
        return bTyped.date.getTime() - aTyped.date.getTime();
      })
      .map(([pedido_id, groupData], index, arr) => {
        const { entries, date, totalCost, totalPrice } = groupData as { entries: any[], date: Date, totalCost: number, totalPrice: number };
        const profit = totalPrice - totalCost;
        const margin = totalCost > 0 ? (profit / totalCost) * 100 : 0;
        return {
            pedido_id,
            pedido_num: arr.length - index,
            entries,
            date,
            totalCost,
            totalPrice,
            profit,
            margin
        }
      });
  }, [stockHistory]);

  const pedidosTotalPages = Math.ceil(groupedStockHistory.length / ITEMS_PER_PAGE);

  const paginatedPedidos = useMemo(() => {
    return groupedStockHistory.slice(
      (pedidosCurrentPage - 1) * ITEMS_PER_PAGE,
      pedidosCurrentPage * ITEMS_PER_PAGE
    );
  }, [groupedStockHistory, pedidosCurrentPage]);

  const handlePedidosPageChange = (page: number) => {
    if (page < 1 || page > pedidosTotalPages) return;
    setPedidosCurrentPage(page);
    const pedidosSection = document.getElementById('pedidos-section');
    if (pedidosSection) {
      pedidosSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const profitChartData = useMemo(() => {
    const productsMap = new Map(products.map(p => [p.id, p]));
    const initialAccumulator = { profit: 0, cost: 0 };
  
    const processSales = (salesToProcess: typeof sales, dateFn: (sale: typeof sales[number]) => string) => {
        const groupedData = salesToProcess.reduce((acc, sale) => {
            const dateKey = dateFn(sale);
            if (!acc[dateKey]) {
                acc[dateKey] = { ...initialAccumulator };
            }
            const product = productsMap.get(sale.product_id);
            if (product) {
                acc[dateKey].profit += sale.total_price - ((product as any).cost * sale.quantity);
                acc[dateKey].cost += (product as any).cost * sale.quantity;
            }
            return acc;
        }, {} as Record<string, typeof initialAccumulator>);
  
        return Object.entries(groupedData).map(([date, values]) => ({ 
            date, 
            profit: (values as any).profit, 
            cost: (values as any).cost 
        }));
    };
  
    if (profitChartView === 'daily') {
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);
        const dailyData = processSales(
            sales.filter(sale => new Date(sale.created_at) >= last30Days),
            sale => format(parseISO(sale.created_at), 'dd/MM')
        );
        return dailyData.reverse();
    }
    if (profitChartView === 'weekly') {
        const weeklyData = processSales(
            sales,
            sale => `Sem ${getWeek(parseISO(sale.created_at), { weekStartsOn: 1 })}`
        );
        return weeklyData.sort((a,b) => a.date.localeCompare(b.date, undefined, { numeric: true }));
    }
    if (profitChartView === 'monthly') {
        const monthlyData = processSales(
            sales,
            sale => format(parseISO(sale.created_at), 'MMM yy', { locale: es })
        );
        return monthlyData.sort((a,b) => a.date.localeCompare(b.date));
    }
    if (profitChartView === 'by_order') {
        return groupedStockHistory.map(pedido => ({
            date: `Pedido #${pedido.pedido_num}`,
            profit: pedido.profit,
            cost: pedido.totalCost,
        })).reverse();
    }
    return [];
  }, [profitChartView, sales, products, groupedStockHistory]);


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
            <Skeleton className="h-80 lg:col-span-7" />
            <Skeleton className="h-80 lg:col-span-3" />
            <Skeleton className="h-80 lg:col-span-4" />
        </div>
        <div className="mt-6">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const getSortIcon = (column: string) => {
    if (rentabilidadSort.column !== column) {
      return <ChevronsUpDown className="h-4 w-4 ml-2 opacity-30" />;
    }
    return rentabilidadSort.direction === 'asc' ? <TrendingUp className="h-4 w-4 ml-2" /> : <TrendingDown className="h-4 w-4 ml-2" />;
  };

  const renderPagination = (totalPages: number, currentPage: number, onPageChange: (page: number) => void) => {
    if (totalPages <= 1) return null;

    return (
      <div className="mt-6">
        <Pagination>
          <PaginationContent>
            <PaginationItem className="hidden sm:flex">
              <PaginationPrevious onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} />
            </PaginationItem>
            <div className="hidden sm:flex items-center gap-1">
              {getPageNumbers(totalPages, currentPage).map((page, index) => (
                <PaginationItem key={index}>
                  {typeof page === 'number' ? (
                    <PaginationLink onClick={() => onPageChange(page)} isActive={currentPage === page}>
                      {page}
                    </PaginationLink>
                  ) : (<PaginationEllipsis />)}
                </PaginationItem>
              ))}
            </div>
            <PaginationItem className="flex sm:hidden items-center gap-1">
                <PaginationPrevious onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} size="icon" className="h-8 w-8 rounded-full" />
                <span className="font-medium text-sm whitespace-nowrap">
                    Pág {currentPage} de {totalPages}
                </span>
                <PaginationNext onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} size="icon" className="h-8 w-8 rounded-full" />
            </PaginationItem>
            <PaginationItem className="hidden sm:flex">
              <PaginationNext onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  return (
    <>
      <div className="mt-8 mb-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h2 className="text-2xl font-bold">Análisis Financiero</h2>
        <div className="w-full md:w-auto">
            <Select onValueChange={(value) => setSelectedMonth(value)} defaultValue={selectedMonth}>
                <SelectTrigger>
                    <SelectValue placeholder="Seleccionar mes" />
                </SelectTrigger>
                <SelectContent>
                    {getAvailableMonths().map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                            {month.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>
      
      {/* Nueva sección de Análisis Financiero unificada */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[
          {
            id: 'ingresos-productos',
            title: 'Ingreso por Productos',
            icon: <ShoppingCart className="h-4 w-4" />,
            value: sales.filter(sale => isInSelectedMonth(sale.created_at)).reduce((acc, sale) => acc + sale.total_price, 0),
            formula: 'SUMA(Cantidad vendida × Precio de venta)',
            calculations: sales.filter(sale => isInSelectedMonth(sale.created_at)).map(sale => ({
              label: `${sale.product_name} (${sale.quantity} × $${sale.price_per_unit})`,
              value: sale.total_price,
              isNegative: false
            })),
            isExpanded: expandedCards['ingresos-productos'] || false
          },
          {
            id: 'movimientos-monetarios',
            title: 'Movimientos Monetarios',
            icon: <Banknote className="h-4 w-4" />,
            value: (() => {
              const monthlyIncomes = monetaryIncome.filter(income => isInSelectedMonth(income.created_at));
              const ingresosMonetarios = monthlyIncomes.filter(income => !income.name.startsWith('[EGRESO]')).reduce((total, income) => total + income.amount, 0);
              const egresosMonetarios = monthlyIncomes.filter(income => income.name.startsWith('[EGRESO]')).reduce((total, income) => total + income.amount, 0);
              return ingresosMonetarios - egresosMonetarios;
            })(),
            formula: 'SUMA(Ingresos monetarios - Egresos monetarios)',
            calculations: monetaryIncome.filter(income => isInSelectedMonth(income.created_at)).map(income => {
              const isEgreso = income.name.startsWith('[EGRESO]');
              return {
                label: isEgreso ? income.name.replace('[EGRESO] ', '') : income.name,
                value: income.amount,
                isNegative: isEgreso
              };
            }),
            isExpanded: expandedCards['movimientos-monetarios'] || false
          },
          {
            id: 'costos-fijos',
            title: 'Costos Fijos',
            icon: <Building className="h-4 w-4" />,
            value: fixedCosts.reduce((acc, cost) => acc + cost.amount, 0),
            formula: 'SUMA(Costos fijos)',
            calculations: fixedCosts.map(cost => ({
              label: cost.name,
              value: cost.amount,
              isNegative: true
            })),
            isExpanded: expandedCards['costos-fijos'] || false
          },
          {
            id: 'extracciones-sueldos',
            title: 'Extracción de Sueldos',
            icon: <Wallet className="h-4 w-4" />,
            value: salaryWithdrawals
              .filter(w => isInSelectedMonth(w.created_at))
              .reduce((sum, w) => sum + w.amount, 0),
            formula: 'SUMA(Extracciones de sueldos)',
            calculations: salaryWithdrawals
              .filter(salary => isInSelectedMonth(salary.created_at))
              .map(salary => ({
                label: salary.description || 'Extracción de sueldo',
                value: salary.amount,
                isNegative: true
              })),
            isExpanded: expandedCards['extracciones-sueldos'] || false
          },
          {
            id: 'costos-pedidos',
            title: 'Costos de Pedidos',
            icon: <Package className="h-4 w-4" />,
            value: stockHistory
              .filter(entry => isInSelectedMonth(entry.created_at))
              .reduce((acc, entry) => acc + ((entry.cost || 0) * entry.quantity_added), 0),
            formula: 'SUMA(Costo × Cantidad pedida)',
            calculations: (() => {
              // Agrupar por fecha (día) para simular pedidos agrupados del mes seleccionado
              type GroupedOrder = {
                date: string;
                totalCost: number;
                items: Array<{
                  product: string;
                  quantity: number;
                  cost: number;
                  totalCost: number;
                }>;
              };

              const monthlyStockHistory = stockHistory.filter(entry => isInSelectedMonth(entry.created_at));
              
              const groupedOrders = monthlyStockHistory.reduce((acc: Record<string, GroupedOrder>, entry) => {
                const orderDate = parseISO(entry.created_at).toDateString();
                if (!acc[orderDate]) {
                  acc[orderDate] = {
                    date: orderDate,
                    totalCost: 0,
                    items: []
                  };
                }
                const entryCost = (entry.cost || 0) * entry.quantity_added;
                acc[orderDate].totalCost += entryCost;
                acc[orderDate].items.push({
                  product: entry.product_name,
                  quantity: entry.quantity_added,
                  cost: entry.cost || 0,
                  totalCost: entryCost
                });
                return acc;
              }, {});

              // Convertir a array y ordenar por fecha (más reciente primero)
              return Object.values(groupedOrders)
                .sort((a: GroupedOrder, b: GroupedOrder) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((order: GroupedOrder) => ({
                  label: `Pedido ${format(new Date(order.date), 'dd/MM/yyyy', { locale: es })} (${order.items.length} items)`,
                  value: order.totalCost,
                  isNegative: true
                }));
            })(),
            isExpanded: expandedCards['costos-pedidos'] || false
          },
          {
            id: 'costos-totales',
            title: 'Costos Totales',
            icon: <CreditCard className="h-4 w-4" />,
            value: (() => {
              const costosFijos = fixedCosts.reduce((acc, cost) => acc + cost.amount, 0);
              const extraccionesSueldos = salaryWithdrawals.filter(w => isInSelectedMonth(w.created_at)).reduce((sum, w) => sum + w.amount, 0);
              const costosPedidos = stockHistory.filter(entry => isInSelectedMonth(entry.created_at)).reduce((acc, entry) => acc + ((entry.cost || 0) * entry.quantity_added), 0);
              const egresosMonetarios = monetaryIncome.filter(income => income.name.startsWith('[EGRESO]') && isInSelectedMonth(income.created_at)).reduce((total, income) => total + income.amount, 0);
              return costosFijos + extraccionesSueldos + costosPedidos + egresosMonetarios;
            })(),
            formula: 'Costos fijos + Sueldos + Costos de pedidos + Egresos monetarios',
            calculations: [
              { label: 'Costos Fijos', value: fixedCosts.reduce((acc, cost) => acc + cost.amount, 0), isNegative: true },
              { label: 'Extracciones de Sueldos', value: salaryWithdrawals.filter(w => isInSelectedMonth(w.created_at)).reduce((sum, w) => sum + w.amount, 0), isNegative: true },
              { label: 'Costos de Pedidos', value: stockHistory.filter(entry => isInSelectedMonth(entry.created_at)).reduce((acc, entry) => acc + ((entry.cost || 0) * entry.quantity_added), 0), isNegative: true },
              { label: 'Egresos Monetarios', value: monetaryIncome.filter(income => income.name.startsWith('[EGRESO]') && isInSelectedMonth(income.created_at)).reduce((total, income) => total + income.amount, 0), isNegative: true }
            ],
            isExpanded: expandedCards['costos-totales'] || false
          },
          {
            id: 'ingresos-totales',
            title: 'Ingresos Totales',
            icon: <TrendingUp className="h-4 w-4" />,
            value: (() => {
              const ingresosProductos = sales.filter(sale => isInSelectedMonth(sale.created_at)).reduce((acc, sale) => acc + sale.total_price, 0);
              const ingresosMonetarios = monetaryIncome.filter(income => !income.name.startsWith('[EGRESO]') && isInSelectedMonth(income.created_at)).reduce((total, income) => total + income.amount, 0);
              return ingresosProductos + ingresosMonetarios;
            })(),
            formula: 'Ingresos por productos + Ingresos monetarios',
            calculations: [
              { label: 'Ingresos por Productos', value: sales.filter(sale => isInSelectedMonth(sale.created_at)).reduce((acc, sale) => acc + sale.total_price, 0), isNegative: false },
              { label: 'Ingresos Monetarios', value: monetaryIncome.filter(income => !income.name.startsWith('[EGRESO]') && isInSelectedMonth(income.created_at)).reduce((total, income) => total + income.amount, 0), isNegative: false }
            ],
            isExpanded: expandedCards['ingresos-totales'] || false
          },
          {
            id: 'ganancia',
            title: 'Ganancia',
            icon: <Calculator className="h-4 w-4" />,
            value: (() => {
              const ingresosProductos = sales.filter(sale => isInSelectedMonth(sale.created_at)).reduce((acc, sale) => acc + sale.total_price, 0);
              const ingresosMonetarios = monetaryIncome.filter(income => !income.name.startsWith('[EGRESO]') && isInSelectedMonth(income.created_at)).reduce((total, income) => total + income.amount, 0);
              const ingresosTotales = ingresosProductos + ingresosMonetarios;
              
              const costosFijos = fixedCosts.reduce((acc, cost) => acc + cost.amount, 0);
              const extraccionesSueldos = salaryWithdrawals.filter(w => isInSelectedMonth(w.created_at)).reduce((sum, w) => sum + w.amount, 0);
              const costosPedidos = stockHistory.filter(entry => isInSelectedMonth(entry.created_at)).reduce((acc, entry) => acc + ((entry.cost || 0) * entry.quantity_added), 0);
              const egresosMonetarios = monetaryIncome.filter(income => income.name.startsWith('[EGRESO]') && isInSelectedMonth(income.created_at)).reduce((total, income) => total + income.amount, 0);
              const costosTotales = costosFijos + extraccionesSueldos + costosPedidos + egresosMonetarios;
              
              return ingresosTotales - costosTotales;
            })(),
            formula: 'Ingresos totales - Costos totales',
            calculations: (() => {
              const ingresosProductos = sales.filter(sale => isInSelectedMonth(sale.created_at)).reduce((acc, sale) => acc + sale.total_price, 0);
              const ingresosMonetarios = monetaryIncome.filter(income => !income.name.startsWith('[EGRESO]') && isInSelectedMonth(income.created_at)).reduce((total, income) => total + income.amount, 0);
              const ingresosTotales = ingresosProductos + ingresosMonetarios;
              
              const costosFijos = fixedCosts.reduce((acc, cost) => acc + cost.amount, 0);
              const extraccionesSueldos = salaryWithdrawals.filter(w => isInSelectedMonth(w.created_at)).reduce((sum, w) => sum + w.amount, 0);
              const costosPedidos = stockHistory.filter(entry => isInSelectedMonth(entry.created_at)).reduce((acc, entry) => acc + ((entry.cost || 0) * entry.quantity_added), 0);
              const egresosMonetarios = monetaryIncome.filter(income => income.name.startsWith('[EGRESO]') && isInSelectedMonth(income.created_at)).reduce((total, income) => total + income.amount, 0);
              const costosTotales = costosFijos + extraccionesSueldos + costosPedidos + egresosMonetarios;
              
              return [
                { label: 'Ingresos Totales', value: ingresosTotales, isNegative: false },
                { label: 'Costos Totales', value: costosTotales, isNegative: true }
              ];
            })(),
            isExpanded: expandedCards['ganancia'] || false
          },
          {
            id: 'patrimonio-total',
            title: 'Patrimonio Total',
            icon: <Coins className="h-4 w-4" />,
            value: products.reduce((acc, product) => {
              const stock = product.colors.reduce((sum, color) => sum + color.stock, 0);
              return acc + (product.cost * stock);
            }, 0),
            formula: 'SUMA(Costo del producto × Stock)',
            calculations: products.map(product => {
              const stock = product.colors.reduce((sum, color) => sum + color.stock, 0);
              return {
                label: `${unslugify(product.name)} (${stock} × $${product.cost})`,
                value: product.cost * stock,
                isNegative: false
              };
            }),
            isExpanded: expandedCards['patrimonio-total'] || false
          },
          {
            id: 'items-vendidos',
            title: 'Items Vendidos',
            icon: <DollarSign className="h-4 w-4" />,
            value: sales.filter(sale => isInSelectedMonth(sale.created_at)).reduce((acc, sale) => acc + sale.quantity, 0),
            formula: 'SUMA(Cantidad vendida)',
            calculations: sales.filter(sale => isInSelectedMonth(sale.created_at)).map(sale => ({
              label: `${sale.product_name}`,
              value: sale.quantity,
              isNegative: false
            })),
            isExpanded: expandedCards['items-vendidos'] || false
          },
          {
            id: 'tasa-conversion',
            title: 'Tasa de Conversión',
            icon: <TrendingUp className="h-4 w-4" />,
            value: (() => {
              const itemsVendidos = sales.filter(sale => isInSelectedMonth(sale.created_at)).reduce((acc, sale) => acc + sale.quantity, 0);
              const itemsPedidos = customerRequests.filter(request => isInSelectedMonth(request.created_at)).reduce((acc, item) => acc + item.quantity, 0);
              return itemsPedidos > 0 ? (itemsVendidos / itemsPedidos) * 100 : 0;
            })(),
            formula: '(Items vendidos ÷ Items pedidos) × 100',
            calculations: (() => {
              const itemsVendidos = sales.filter(sale => isInSelectedMonth(sale.created_at)).reduce((acc, sale) => acc + sale.quantity, 0);
              const itemsPedidos = customerRequests.filter(request => isInSelectedMonth(request.created_at)).reduce((acc, item) => acc + item.quantity, 0);
              const porcentajeConversion = itemsPedidos > 0 ? (itemsVendidos / itemsPedidos) * 100 : 0;
              
              return [
                { label: 'Total Items Vendidos', value: itemsVendidos, isNegative: false },
                { label: 'Total Items Pedidos', value: itemsPedidos, isNegative: false },
                { label: 'Porcentaje de Conversión', value: porcentajeConversion, isNegative: false }
              ];
            })(),
            isExpanded: expandedCards['tasa-conversion'] || false
          },
          {
            id: 'capital-disponible',
            title: 'Capital Disponible',
            icon: <PiggyBank className="h-4 w-4" />,
            value: (() => {
              // Capital disponible solo cuenta desde julio 2025 en adelante
              const ingresosHistoricos = sales.filter(sale => isFromJulyOnwards(sale.created_at)).reduce((acc, sale) => acc + sale.total_price, 0) + 
                                         monetaryIncome.filter(income => !income.name.startsWith('[EGRESO]') && isFromJulyOnwards(income.created_at)).reduce((total, income) => total + income.amount, 0);
              
              // Calcular meses desde julio 2025 hasta ahora para costos fijos (comenzando el día 2)
              const startDate = new Date(2025, 6, 2); // 2 de julio 2025
              const currentDate = new Date();
              const monthsFromJuly = ((currentDate.getFullYear() - startDate.getFullYear()) * 12) + (currentDate.getMonth() - startDate.getMonth()) + 1;
              const costosHistoricos = fixedCosts.reduce((acc, cost) => acc + cost.amount, 0) * monthsFromJuly + // Costos fijos solo por meses desde julio
                                     salaryWithdrawals.filter(w => isFromJulyOnwards(w.created_at)).reduce((sum, w) => sum + w.amount, 0) +
                                     stockHistory.filter(entry => isFromJulyOnwards(entry.created_at)).reduce((acc, entry) => acc + ((entry.cost || 0) * entry.quantity_added), 0) +
                                     monetaryIncome.filter(income => income.name.startsWith('[EGRESO]') && isFromJulyOnwards(income.created_at)).reduce((total, income) => total + income.amount, 0);
              return ingresosHistoricos - costosHistoricos;
            })(),
            formula: 'Capital acumulado desde julio 2025 (fecha de inicio del negocio)',
            calculations: (() => {
              // Calcular meses desde julio 2025 hasta ahora para mostrar en calculations (comenzando el día 2)
              const startDate = new Date(2025, 6, 2); // 2 de julio 2025
              const currentDate = new Date();
              const monthsFromJuly = ((currentDate.getFullYear() - startDate.getFullYear()) * 12) + (currentDate.getMonth() - startDate.getMonth()) + 1;
              
              // Generar todos los meses desde julio 2025 hasta ahora
              const months = [];
              let currentMonth = new Date(startDate);
              while (currentMonth <= currentDate) {
                const year = currentMonth.getFullYear();
                const month = currentMonth.getMonth() + 1;
                const monthValue = `${year}-${String(month).padStart(2, '0')}`;
                const monthLabel = currentMonth.toLocaleDateString('es-ES', { 
                  month: 'long', 
                  year: 'numeric' 
                });
                months.push({ value: monthValue, label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1) });
                currentMonth.setMonth(currentMonth.getMonth() + 1);
              }

              const calculations = [];
              let totalIngresos = 0;
              let totalCostos = 0;
              const monthlyIngresoBreakdown: string[] = [];
              const monthlyCostoBreakdown: string[] = [];
              
              // Calcular totales históricos y guardar desglose por mes (períodos del 2 al 1)
              months.forEach(month => {
                const [year, monthNum] = month.value.split('-').map(Number);
                
                // Período del mes: del día 2 del mes al día 1 del siguiente
                const periodStart = new Date(year, monthNum - 1, 2);
                const periodEnd = new Date(year, monthNum, 1);
                
                const monthSales = sales.filter(sale => {
                  const saleDate = parseISO(sale.created_at);
                  return saleDate >= periodStart && saleDate <= periodEnd;
                }).reduce((acc, sale) => acc + sale.total_price, 0);
                
                const monthMonetaryIncome = monetaryIncome.filter(income => {
                  if (income.name.startsWith('[EGRESO]')) return false;
                  const incomeDate = parseISO(income.created_at);
                  return incomeDate >= periodStart && incomeDate <= periodEnd;
                }).reduce((total, income) => total + income.amount, 0);
                
                const monthFixedCosts = fixedCosts.reduce((acc, cost) => acc + cost.amount, 0);
                
                const monthSalaryWithdrawals = salaryWithdrawals.filter(w => {
                  const wDate = parseISO(w.created_at);
                  return wDate >= periodStart && wDate <= periodEnd;
                }).reduce((sum, w) => sum + w.amount, 0);
                
                const monthStockCosts = stockHistory.filter(entry => {
                  const entryDate = parseISO(entry.created_at);
                  return entryDate >= periodStart && entryDate <= periodEnd;
                }).reduce((acc, entry) => acc + ((entry.cost || 0) * entry.quantity_added), 0);
                
                const monthEgresos = monetaryIncome.filter(income => {
                  if (!income.name.startsWith('[EGRESO]')) return false;
                  const incomeDate = parseISO(income.created_at);
                  return incomeDate >= periodStart && incomeDate <= periodEnd;
                }).reduce((total, income) => total + income.amount, 0);
                
                const monthIngresoTotal = monthSales + monthMonetaryIncome;
                const monthCostoTotal = monthFixedCosts + monthSalaryWithdrawals + monthStockCosts + monthEgresos;
                
                totalIngresos += monthIngresoTotal;
                totalCostos += monthCostoTotal;
                
                // Obtener nombre corto del mes (JULIO, AGOSTO, etc.)
                const shortMonthName = month.label.split(' ')[0].toUpperCase();
                
                monthlyIngresoBreakdown.push(`${shortMonthName}: $${monthIngresoTotal.toLocaleString()}`);
                monthlyCostoBreakdown.push(`${shortMonthName}: $${monthCostoTotal.toLocaleString()}`);
              });
              
              // Mostrar totales con desglose
              calculations.push({ label: `Total Ingresos Históricos:`, value: totalIngresos, isNegative: false });
              // Agregar cada mes en líneas separadas
              monthlyIngresoBreakdown.forEach(monthBreakdown => {
                calculations.push({ label: monthBreakdown.toLowerCase(), value: 0, isNegative: false, hideValue: true });
              });
              
              calculations.push({ label: `Total Costos Históricos:`, value: totalCostos, isNegative: true });
              // Agregar cada mes en líneas separadas
              monthlyCostoBreakdown.forEach(monthBreakdown => {
                calculations.push({ label: monthBreakdown.toLowerCase(), value: 0, isNegative: true, hideValue: true });
              });
              
              calculations.push({ 
                label: `Capital Disponible (${monthsFromJuly} meses):`, 
                value: totalIngresos - totalCostos, 
                isNegative: totalIngresos - totalCostos < 0 
              });
              
              return calculations;
            })(),
            isExpanded: expandedCards['capital-disponible'] || false
          }
        ].map((card) => (
          <Card key={card.id} className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className="flex items-center gap-2">
                {card.icon}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCard(card.id)}
                  className="h-6 w-6 p-0"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${card.isExpanded ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                (card.id.includes('costos') || card.id === 'extracciones-sueldos') ? "text-red-600" : 
                (card.id === 'ganancia' || card.id === 'capital-disponible' || card.id === 'movimientos-monetarios') && card.value < 0 ? "text-red-600" : "text-green-600"
              }`}>
                {card.id === 'items-vendidos' ? 
                  `${card.value.toLocaleString()} items` : 
                  card.id === 'tasa-conversion' ?
                    `${card.value.toFixed(1)}%` :
                  (card.id.includes('costos') || card.id === 'extracciones-sueldos') ?
                    `-$${card.value.toLocaleString()}` :
                    (card.id === 'ganancia' || card.id === 'capital-disponible' || card.id === 'movimientos-monetarios') && card.value < 0 ?
                      `-$${Math.abs(card.value).toLocaleString()}` :
                      `$${card.value.toLocaleString()}`
                }
              </div>
              
              {/* Mostrar último pedido para Costos de Pedidos */}
              {card.id === 'costos-pedidos' && !card.isExpanded && (() => {
                // Agrupar por fecha para obtener el último pedido completo
                type LastOrderGroup = {
                  date: string;
                  totalCost: number;
                  items: Array<{
                    product: string;
                    quantity: number;
                    cost: number;
                  }>;
                };

                const monthlyStockHistory = stockHistory.filter(entry => isInSelectedMonth(entry.created_at));
                const groupedOrders = monthlyStockHistory.reduce((acc: Record<string, LastOrderGroup>, entry) => {
                  const orderDate = parseISO(entry.created_at).toDateString();
                  if (!acc[orderDate]) {
                    acc[orderDate] = {
                      date: orderDate,
                      totalCost: 0,
                      items: []
                    };
                  }
                  const entryCost = (entry.cost || 0) * entry.quantity_added;
                  acc[orderDate].totalCost += entryCost;
                  acc[orderDate].items.push({
                    product: entry.product_name,
                    quantity: entry.quantity_added,
                    cost: entry.cost || 0
                  });
                  return acc;
                }, {});

                const latestOrder = Object.values(groupedOrders)
                  .sort((a: LastOrderGroup, b: LastOrderGroup) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                
                if (latestOrder) {
                  return (
                    <p className="text-xs text-muted-foreground mt-1">
                      Último: ${latestOrder.totalCost.toLocaleString()} ({format(new Date(latestOrder.date), 'dd/MM/yyyy', { locale: es })})
                    </p>
                  );
                }
                return null;
              })()} 
              
              <Collapsible open={card.isExpanded} onOpenChange={() => toggleCard(card.id)}>
                <CollapsibleContent className="mt-3 space-y-2 text-sm">
                  <div className="text-muted-foreground font-medium">Fórmula:</div>
                  <div className="text-xs bg-muted/30 p-2 rounded-md font-mono">
                    {card.formula}
                  </div>
                  
                  <div className="text-muted-foreground font-medium">Cálculos:</div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {card.calculations.length > 0 ? (
                      card.calculations.map((calc, index) => (
                        <div key={index} className="flex justify-between items-center text-xs">
                          <span className="truncate mr-2">{calc.label}</span>
                          {!(calc as any).hideValue && (
                            <span className={`font-medium whitespace-nowrap ${calc.isNegative ? "text-red-600" : "text-green-600"}`}>
                              {card.id === 'items-vendidos' ? 
                                `${calc.value}` : 
                                card.id === 'tasa-conversion' ?
                                  calc.label === 'Porcentaje de Conversión' ?
                                    `${calc.value.toFixed(1)}%` :
                                    `${calc.value} items` :
                                calc.isNegative ?
                                  `-$${calc.value.toLocaleString()}` :
                                  `$${calc.value.toLocaleString()}`
                              }
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground italic">
                        No hay datos para mostrar
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span>Total:</span>
                      <span className={`${
                        (card.id.includes('costos') || card.id === 'extracciones-sueldos') ? "text-red-600" : 
                        (card.id === 'ganancia' || card.id === 'capital-disponible' || card.id === 'movimientos-monetarios') && card.value < 0 ? "text-red-600" : "text-green-600"
                      }`}>
                        {card.id === 'items-vendidos' ? 
                          `${card.value.toLocaleString()} items` : 
                          card.id === 'tasa-conversion' ?
                            `${card.value.toFixed(1)}%` :
                          (card.id.includes('costos') || card.id === 'extracciones-sueldos') ?
                            `-$${card.value.toLocaleString()}` :
                            (card.id === 'ganancia' || card.id === 'capital-disponible' || card.id === 'movimientos-monetarios') && card.value < 0 ?
                              `-$${Math.abs(card.value).toLocaleString()}` :
                              `$${card.value.toLocaleString()}`
                        }
                      </span>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 mt-6 grid-cols-1">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <CardTitle>Ventas</CardTitle>
            <div className="w-full sm:w-auto sm:min-w-[250px]">
              <Select onValueChange={(value) => setSalesChartView(value as any)} defaultValue={salesChartView}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar vista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diario (Últimos 30 días)</SelectItem>
                  <SelectItem value="monthly">Mensual (Últimos 12 meses)</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={salesChartData}>
                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${Number(value).toLocaleString()}`} />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Fecha
                              </span>
                              <span className="font-bold text-muted-foreground">
                                {payload[0].payload.date}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Ingresos
                              </span>
                              <span className="font-bold">
                                ${Number(payload[0].value).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 mt-6 grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4">
            <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <CardTitle>Resumen de Ganancias y Costos</CardTitle>
                    <CardDescription>Análisis de la rentabilidad a lo largo del tiempo.</CardDescription>
                </div>
                <div className="w-full sm:w-auto sm:min-w-[250px]">
                    <Select onValueChange={(value) => setProfitChartView(value as any)} defaultValue={profitChartView}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar vista de ganancia" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="daily">Diario</SelectItem>
                            <SelectItem value="weekly">Semanal</SelectItem>
                            <SelectItem value="monthly">Mensual</SelectItem>
                            <SelectItem value="by_order">Por Pedido</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={profitChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${Number(value).toLocaleString()}`} />
                        <RechartsTooltip 
                            formatter={(value: number, name: string, props) => {
                                const dataKey = props.dataKey;
                                const label = dataKey === 'profit' ? 'Ganancia' : 'Costo';
                                return [`$${value.toLocaleString()}`, label];
                            }}
                            labelClassName="font-bold"
                            wrapperClassName="!border-border !bg-background !shadow-lg"
                        />
                        <Legend />
                        <Line type="monotone" dataKey="profit" name="Ganancia" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="cost" name="Costo" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>Ingresos por Categoría</CardTitle>
                <CardDescription>Análisis de las ventas por categoría de producto.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                   <PieChart>
                        <Pie data={salesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                            {salesByCategory.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Legend />
                        <RechartsTooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                   </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>

       <div id="popular-products-section" className="mt-6 scroll-mt-24">
         <Card>
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
                <Button variant={sortPopularityBy === 'sales' ? 'default' : 'outline'} size="sm" onClick={() => setSortPopularityBy('sales')}>Ventas</Button>
                <Button variant={sortPopularityBy === 'requests' ? 'default' : 'outline'} size="sm" onClick={() => setSortPopularityBy('requests')}>Pedidos</Button>
                <Button variant={sortPopularityBy === 'views' ? 'default' : 'outline'} size="sm" onClick={() => setSortPopularityBy('views')}>Vistas</Button>
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
            {renderPagination(popularityTotalPages, popularityCurrentPage, handlePopularityPageChange)}
          </CardContent>
         </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div id="fixed-costs-section" className="scroll-mt-24">
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      Gestión de Costos Fijos
                  </CardTitle>
                  <CardDescription>
                      Añade costos operativos para un cálculo de ganancias más preciso.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <form onSubmit={handleSubmitFixedCost(onFixedCostSubmit)} className="flex flex-col sm:flex-row items-end gap-4 mb-6">
                      <div className="flex-grow w-full space-y-2">
                          <Label htmlFor="cost-name">Nombre del Costo</Label>
                          <Input id="cost-name" {...registerFixedCost('name')} placeholder="Ej: Gasolina, Bolsas" />
                          {errorsFixedCost.name && <p className="text-sm text-destructive">{errorsFixedCost.name.message}</p>}
                      </div>
                      <div className="w-full sm:w-auto space-y-2">
                          <Label htmlFor="cost-amount">Monto</Label>
                          <Input id="cost-amount" type="number" {...registerFixedCost('amount')} placeholder="1000" />
                          {errorsFixedCost.amount && <p className="text-sm text-destructive">{errorsFixedCost.amount.message}</p>}
                      </div>
                      <Button type="submit" className="w-full sm:w-auto">
                          <PlusCircle className="mr-2 h-4 w-4" /> Añadir
                      </Button>
                  </form>
                  <div className="border rounded-lg">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Nombre</TableHead>
                                  <TableHead className="text-right">Monto</TableHead>
                                  <TableHead className="text-right w-[100px]">Acción</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {fixedCosts.length > 0 ? fixedCosts.map((cost) => (
                                  <TableRow key={cost.id}>
                                      <TableCell className="font-medium">{cost.name}</TableCell>
                                      <TableCell className="text-right">${cost.amount.toLocaleString()}</TableCell>
                                      <TableCell className="text-right">
                                          <div className="flex items-center justify-end">
                                              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => handleEditCost(cost)}>
                                                  <Edit className="h-4 w-4" />
                                              </Button>
                                              <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive rounded-full">
                                                          <Trash className="h-4 w-4" />
                                                      </Button>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent>
                                                      <AlertDialogHeader>
                                                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                          <AlertDialogDescription>
                                                              Esta acción no se puede deshacer. Esto eliminará permanentemente el costo.
                                                          </AlertDialogDescription>
                                                      </AlertDialogHeader>
                                                      <AlertDialogFooter>
                                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                          <AlertDialogAction onClick={() => deleteFixedCost(cost.id)} className="bg-destructive hover:bg-destructive/90">
                                                              Eliminar
                                                          </AlertDialogAction>
                                                      </AlertDialogFooter>
                                                  </AlertDialogContent>
                                              </AlertDialog>
                                          </div>
                                      </TableCell>
                                  </TableRow>
                              )) : (
                                  <TableRow>
                                      <TableCell colSpan={3} className="h-24 text-center">No hay costos fijos registrados.</TableCell>
                                  </TableRow>
                              )}
                          </TableBody>
                      </Table>
                  </div>
              </CardContent>
          </Card>
        </div>
        <div id="salary-section" className="scroll-mt-24">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-primary" />
                        Gestión de Sueldos
                    </CardTitle>
                    <CardDescription>
                        Registra extracciones de sueldo mensuales.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmitSalary(onSalarySubmit)} className="flex flex-col sm:flex-row items-end gap-4 mb-6">
                        <div className="flex-grow w-full space-y-2">
                            <Label htmlFor="salary-amount">Monto</Label>
                            <Input id="salary-amount" type="number" {...registerSalary('amount')} placeholder="50000" />
                            {errorsSalary.amount && <p className="text-sm text-destructive">{errorsSalary.amount.message}</p>}
                        </div>
                        <div className="flex-grow w-full space-y-2">
                            <Label htmlFor="salary-description">Descripción (Opcional)</Label>
                            <Input id="salary-description" {...registerSalary('description')} placeholder="Sueldo Enero" />
                        </div>
                        <Button type="submit" className="w-full sm:w-auto">
                            <PlusCircle className="mr-2 h-4 w-4" /> Registrar
                        </Button>
                    </form>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead className="text-right">Monto</TableHead>
                                    <TableHead className="text-right w-[100px]">Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {salaryWithdrawals.length > 0 ? salaryWithdrawals.map((s) => (
                                    <TableRow key={s.id}>
                                        <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-muted-foreground">{s.description || 'Sin descripción'}</TableCell>
                                        <TableCell className="text-right font-medium">${s.amount.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end">
                                                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => handleEditSalary(s)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive rounded-full">
                                                            <Trash className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Esto eliminará permanentemente el registro de extracción.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => deleteSalaryWithdrawal(s.id)} className="bg-destructive hover:bg-destructive/90">
                                                                Eliminar
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">No hay extracciones de sueldo registradas.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

       <div id="monetary-income-section" className="mt-6 scroll-mt-24">
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Banknote className="h-5 w-5 text-green-500" />
                            Gestión de Ingresos Monetarios
                        </CardTitle>
                        <CardDescription>
                            Registra ingresos de capital externos al negocio.
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsIncomeHistoryDialogOpen(true)}>
                        <History className="mr-2 h-4 w-4" />
                        Historial
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmitIncome(onIncomeSubmit)} className="flex flex-col sm:flex-row items-end gap-4 mb-6">
                    <div className="flex-grow w-full space-y-2 sm:w-[40%]">
                        <Label htmlFor="income-name">Nombre del Ingreso</Label>
                        <Input id="income-name" {...registerIncome('name')} placeholder="Ej: Aporte de capital" />
                        {errorsIncome.name && <p className="text-sm text-destructive">{errorsIncome.name.message}</p>}
                    </div>
                    <div className="w-full sm:w-[25%] space-y-2">
                        <Label htmlFor="income-amount">Monto</Label>
                        <Input id="income-amount" type="number" {...registerIncome('amount')} placeholder="50000" />
                        {errorsIncome.amount && <p className="text-sm text-destructive">{errorsIncome.amount.message}</p>}
                    </div>
                    <div className="w-full sm:w-[35%] space-y-2">
                        <Label htmlFor="income-description">Descripción (Opcional)</Label>
                        <Input id="income-description" {...registerIncome('description')} placeholder="Detalles del ingreso" />
                    </div>
                    <Button type="submit" className="w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" /> Registrar
                    </Button>
                </form>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                                <TableHead className="text-right w-[100px]">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {monetaryIncome.length > 0 ? monetaryIncome.slice(0, 5).map((income) => (
                                <TableRow key={income.id}>
                                    <TableCell>{new Date(income.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="font-medium">{income.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{income.description || 'Sin descripción'}</TableCell>
                                    <TableCell className="text-right font-medium">${income.amount.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end">
                                            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => handleEditIncome(income)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive rounded-full">
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Esta acción no se puede deshacer. Esto eliminará permanentemente el ingreso.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => deleteMonetaryIncome(income.id)} className="bg-destructive hover:bg-destructive/90">
                                                            Eliminar
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">No hay ingresos registrados.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      </div>


      <div id="rentabilidad-section" className="mt-6 scroll-mt-24">
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        Análisis de Rentabilidad
                        </CardTitle>
                        <CardDescription>
                        Evalúa la rentabilidad para optimizar precios y estrategias.
                        </CardDescription>
                    </div>
                    <div className="w-full sm:w-auto sm:min-w-[250px]">
                        <Select onValueChange={(value) => setRentabilidadPaymentMethod(value as any)} defaultValue={rentabilidadPaymentMethod}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar medio de pago" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(rentabilidadPaymentOptions).map(([key, { label }]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleRentabilidadSort('name')} className="px-0">
                            Nombre
                            {getSortIcon('name')}
                        </Button>
                    </TableHead>
                    <TableHead className="text-right">
                        <Button variant="ghost" onClick={() => handleRentabilidadSort('cost')} className="px-0">
                            Costo
                            {getSortIcon('cost')}
                        </Button>
                    </TableHead>
                    <TableHead className="text-right">
                        <Button variant="ghost" onClick={() => handleRentabilidadSort('price')} className="px-0">
                            Precio (Venta)
                            {getSortIcon('price')}
                        </Button>
                    </TableHead>
                    <TableHead className="text-right">
                        <Button variant="ghost" onClick={() => handleRentabilidadSort('profit')} className="px-0">
                            Ganancia
                            {getSortIcon('profit')}
                        </Button>
                    </TableHead>
                    <TableHead className="text-center">
                        <Button variant="ghost" onClick={() => handleRentabilidadSort('stock')} className="px-0">
                            Stock
                            {getSortIcon('stock')}
                        </Button>
                    </TableHead>
                    <TableHead className="text-right">
                        <Button variant="ghost" onClick={() => handleRentabilidadSort('margin')} className="px-0">
                            Margen
                            {getSortIcon('margin')}
                        </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRentabilidad.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                          <p className="font-medium">{unslugify(product.name)}</p>
                          <p className="text-xs text-muted-foreground">{product.model}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <EditablePriceCell product={product} field="cost" value={product.cost} />
                      </TableCell>
                      <TableCell className="text-right">
                         <EditablePriceCell product={product} field="price" value={product.price} />
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">${product.profit.toLocaleString()}</TableCell>
                      <TableCell className="text-center">{product.stock}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">{product.margin.toFixed(2)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {renderPagination(rentabilidadTotalPages, rentabilidadCurrentPage, handleRentabilidadPageChange)}
          </CardContent>
        </Card>
      </div>
      
      <div id="pedidos-section" className="mt-6 scroll-mt-24">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageSearch className="h-5 w-5 text-primary" />
              Análisis de Pedidos (Inversión)
            </CardTitle>
            <CardDescription>
              Revisa el historial de pedidos de stock para analizar costos e ingresos potenciales.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {paginatedPedidos.length > 0 ? paginatedPedidos.map(({ pedido_id, pedido_num, entries, date, totalCost, totalPrice, profit, margin }) => (
                <Collapsible key={pedido_id} className="border-b last:border-b-0 pb-4">
                  <CollapsibleTrigger className="w-full flex justify-between items-center py-2 font-semibold text-left">
                    <div className="flex-1">
                        <p className="text-base">Pedido #{pedido_num}</p>
                        <p className="text-sm font-normal text-muted-foreground">{date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <ChevronDown className="h-5 w-5 transition-transform data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border rounded-lg mt-2">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Producto</TableHead>
                              <TableHead>Modelo</TableHead>
                              <TableHead>Color</TableHead>
                              <TableHead className="text-right">Costo</TableHead>
                              <TableHead className="text-right">Precio</TableHead>
                              <TableHead className="text-right">Cantidad</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {entries.map((entry) => (
                              <TableRow key={entry.id}>
                                <TableCell>{unslugify(entry.product_name)}</TableCell>
                                <TableCell>{entry.product_model}</TableCell>
                                <TableCell>{entry.color_name}</TableCell>
                                <TableCell className="text-right">${entry.cost || 0}</TableCell>
                                <TableCell className="text-right">${entry.price || 0}</TableCell>
                                <TableCell className="text-right font-medium text-primary">
                                  +{entry.quantity_added}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <div className="p-4 bg-muted/50 rounded-b-lg grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-medium">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Costo Total</p>
                              <p>${totalCost.toLocaleString()}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Ingreso Potencial</p>
                              <p>${totalPrice.toLocaleString()}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Ganancia Potencial</p>
                              <p className="text-green-600">${profit.toLocaleString()}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Margen</p>
                              <p className="text-primary">{margin.toFixed(2)}%</p>
                            </div>
                        </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )) : (
              <p className="text-muted-foreground text-center py-8">No hay pedidos registrados.</p>
            )}
            {renderPagination(pedidosTotalPages, pedidosCurrentPage, handlePedidosPageChange)}
          </CardContent>
        </Card>
      </div>

      {/* DIALOGS */}
      <Dialog open={isEditCostDialogOpen} onOpenChange={setIsEditCostDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Editar Costo Fijo</DialogTitle>
                <DialogDescription>
                    Actualiza el nombre y el monto del costo fijo.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitEditFixedCost(onEditFixedCostSubmit)} className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="edit-cost-name">Nombre del Costo</Label>
                    <Input id="edit-cost-name" {...registerEditFixedCost('name')} />
                    {errorsEditFixedCost.name && <p className="text-sm text-destructive">{errorsEditFixedCost.name.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="edit-cost-amount">Monto</Label>
                    <Input id="edit-cost-amount" type="number" {...registerEditFixedCost('amount')} />
                    {errorsEditFixedCost.amount && <p className="text-sm text-destructive">{errorsEditFixedCost.amount.message}</p>}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit">Guardar Cambios</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isSalaryDialogOpen} onOpenChange={setIsSalaryDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Editar Extracción de Sueldo</DialogTitle>
                <DialogDescription>
                    Actualiza el monto y la descripción de la extracción.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitEditSalary(onEditSalarySubmit)} className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="edit-salary-amount">Monto</Label>
                    <Input id="edit-salary-amount" type="number" {...registerEditSalary('amount')} />
                    {errorsEditSalary.amount && <p className="text-sm text-destructive">{errorsEditSalary.amount.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="edit-salary-description">Descripción</Label>
                      <Textarea id="edit-salary-description" {...registerEditSalary('description')} />
                      {errorsEditSalary.description && <p className="text-sm text-destructive">{errorsEditSalary.description.message}</p>}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit">Guardar Cambios</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isIncomeDialogOpen} onOpenChange={setIsIncomeDialogOpen}>
          <DialogContent className="sm:max-w-md">
              <DialogHeader>
                  <DialogTitle>Editar Ingreso Monetario</DialogTitle>
                  <DialogDescription>
                      Actualiza los detalles del ingreso monetario.
                  </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitEditIncome(onEditIncomeSubmit)} className="space-y-4 py-4">
                  <div className="space-y-2">
                      <Label htmlFor="edit-income-name">Nombre</Label>
                      <Input id="edit-income-name" {...registerEditIncome('name')} />
                      {errorsEditIncome.name && <p className="text-sm text-destructive">{errorsEditIncome.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="edit-income-amount">Monto</Label>
                      <Input id="edit-income-amount" type="number" {...registerEditIncome('amount')} />
                      {errorsEditIncome.amount && <p className="text-sm text-destructive">{errorsEditIncome.amount.message}</p>}
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="edit-income-description">Descripción</Label>
                      <Textarea id="edit-income-description" {...registerEditIncome('description')} />
                      {errorsEditIncome.description && <p className="text-sm text-destructive">{errorsEditIncome.description.message}</p>}
                  </div>
                  <DialogFooter>
                      <DialogClose asChild>
                          <Button type="button" variant="secondary">Cancelar</Button>
                      </DialogClose>
                      <Button type="submit">Guardar Cambios</Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
      <Dialog open={isIncomeHistoryDialogOpen} onOpenChange={setIsIncomeHistoryDialogOpen}>
          <DialogContent className="max-w-4xl">
              <DialogHeader>
                  <DialogTitle>Historial de Ingresos Monetarios</DialogTitle>
                  <DialogDescription>
                      Aquí puedes ver todos los ingresos de capital registrados.
                  </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh] my-4">
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Nombre</TableHead>
                              <TableHead>Descripción</TableHead>
                              <TableHead className="text-right">Monto</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {monetaryIncome.length > 0 ? monetaryIncome.map((income) => (
                              <TableRow key={income.id}>
                                  <TableCell>{new Date(income.created_at).toLocaleString()}</TableCell>
                                  <TableCell className="font-medium">{income.name}</TableCell>
                                  <TableCell className="text-muted-foreground">{income.description || 'N/A'}</TableCell>
                                  <TableCell className="text-right font-semibold text-green-500">${income.amount.toLocaleString()}</TableCell>
                              </TableRow>
                          )) : (
                              <TableRow>
                                  <TableCell colSpan={4} className="h-24 text-center">No hay ingresos registrados.</TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                  </Table>
              </ScrollArea>
              <DialogFooter>
                  <DialogClose asChild>
                      <Button type="button" variant="secondary">Cerrar</Button>
                  </DialogClose>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      <Dialog open={isRevenueBreakdownDialogOpen} onOpenChange={setIsRevenueBreakdownDialogOpen}>
          <DialogContent className="max-w-6xl">
              <DialogHeader>
                  <DialogTitle>Desglose Completo de Ingresos</DialogTitle>
                  <DialogDescription>
                      Detalle de todas las ventas que componen los ingresos totales del período seleccionado.
                  </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh] my-4">
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Producto</TableHead>
                              <TableHead className="text-center">Cantidad</TableHead>
                              <TableHead className="text-right">Precio Unitario</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {(() => {
                            const filteredSales = sales.filter(sale => isInSelectedMonth(sale.created_at));
                            
                            return filteredSales.length > 0 ? filteredSales.map((sale) => {
                              const product = products.find(p => p.id === sale.product_id);
                              const unitPrice = sale.total_price / sale.quantity;
                              
                              return (
                                <TableRow key={sale.id}>
                                    <TableCell>{new Date(sale.created_at).toLocaleDateString('es-ES', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}</TableCell>
                                    <TableCell>
                                      <div>
                                        <p className="font-medium">{product ? unslugify(product.name) : 'Producto no encontrado'}</p>
                                        <p className="text-xs text-muted-foreground">{product?.model || 'N/A'}</p>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center font-medium">{sale.quantity}</TableCell>
                                    <TableCell className="text-right">${unitPrice.toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-semibold text-green-600">${sale.total_price.toLocaleString()}</TableCell>
                                </TableRow>
                              );
                            }) : (
                              <TableRow>
                                  <TableCell colSpan={5} className="h-24 text-center">No hay ventas en el período seleccionado.</TableCell>
                              </TableRow>
                            );
                          })()}
                      </TableBody>
                  </Table>
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-center font-semibold text-lg">
                      <span>Total de Ingresos:</span>
                      <span className="text-green-600">${sales.reduce((acc, sale) => acc + sale.total_price, 0).toLocaleString()}</span>
                    </div>
                  </div>
              </ScrollArea>
              <DialogFooter>
                  <DialogClose asChild>
                      <Button type="button" variant="secondary">Cerrar</Button>
                  </DialogClose>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
