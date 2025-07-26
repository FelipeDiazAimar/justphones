
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useSales } from '@/hooks/use-sales';
import { useProducts } from '@/hooks/use-products';
import { useProductViews } from '@/hooks/use-product-views';
import { useCustomerRequests } from '@/hooks/use-customer-requests';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, ShoppingCart, Package, TrendingUp, AlertTriangle, Eye, HelpCircle, ArrowDownUp, TrendingDown, ChevronsUpDown, Percent, BarChart, PackageSearch, Activity, Coins, Goal, History, PlusCircle, Trash, ChevronDown, Edit, Wallet, Banknote } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip, XAxis, YAxis, CartesianGrid, BarChart as RechartsBarChart, Bar } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { unslugify } from '@/lib/utils';
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
import { getWeek, getYear, format, parseISO, startOfToday, startOfWeek, startOfMonth, startOfYear, isAfter, getDaysInMonth, endOfMonth, endOfYear, getMonth, isWithinInterval } from 'date-fns';
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

  const [statsPeriod, setStatsPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'>('all');

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


  const isLoading = isLoadingSales || isLoadingProducts || isLoadingViews || isLoadingStockHistory || isLoadingRequests || isLoadingFixedCosts || isLoadingSalaryWithdrawals || isLoadingMonetaryIncome;

  const stats = useMemo(() => {
    const productsMap = new Map(products.map(p => [p.id, p]));
    const today = new Date();
    
    const filteredSales = sales.filter(sale => {
      const saleDate = parseISO(sale.created_at);
      switch(statsPeriod) {
        case 'daily': return isAfter(saleDate, startOfToday());
        case 'weekly': return isAfter(saleDate, startOfWeek(today, { weekStartsOn: 1 }));
        case 'monthly': return isAfter(saleDate, startOfMonth(today));
        case 'yearly': return isAfter(saleDate, startOfYear(today));
        case 'all':
        default: return true;
      }
    });

    const totalRevenue = filteredSales.reduce((acc, sale) => acc + sale.total_price, 0);
    
    const totalCostOfGoodsSold = filteredSales.reduce((acc, sale) => {
        const product = productsMap.get(sale.product_id);
        return acc + (product ? (product as any).cost * sale.quantity : 0);
    }, 0);
    
    const monthlyFixedCosts = fixedCosts.reduce((acc, cost) => acc + cost.amount, 0);
    let applicableFixedCosts = 0;
    const daysInMonth = getDaysInMonth(today);

    switch(statsPeriod) {
        case 'daily': 
            applicableFixedCosts = monthlyFixedCosts / daysInMonth;
            break;
        case 'weekly':
            applicableFixedCosts = (monthlyFixedCosts / daysInMonth) * 7;
            break;
        case 'monthly':
            applicableFixedCosts = monthlyFixedCosts;
            break;
        case 'yearly': 
            applicableFixedCosts = monthlyFixedCosts * (getMonth(today) + 1);
            break;
        case 'all':
        default:
            // This is a rough estimation for 'all' time
            if (sales.length > 0) {
              const oldestSaleDate = parseISO(sales[sales.length - 1].created_at);
              const monthsDifference = (today.getFullYear() - oldestSaleDate.getFullYear()) * 12 + (today.getMonth() - oldestSaleDate.getMonth()) + 1;
              applicableFixedCosts = monthlyFixedCosts * monthsDifference;
            }
            break;
    }

    const totalCosts = totalCostOfGoodsSold + applicableFixedCosts;

    let totalSalaryWithdrawn = 0;
    if (salaryWithdrawals.length > 0) {
        const monthlySalaryWithdrawals = salaryWithdrawals
            .filter(w => isWithinInterval(parseISO(w.created_at), { start: startOfMonth(today), end: endOfMonth(today) }))
            .reduce((sum, w) => sum + w.amount, 0);

        switch (statsPeriod) {
            case 'daily': 
                totalSalaryWithdrawn = monthlySalaryWithdrawals / daysInMonth;
                break;
            case 'weekly':
                totalSalaryWithdrawn = (monthlySalaryWithdrawals / daysInMonth) * 7;
                break;
            case 'monthly':
                totalSalaryWithdrawn = monthlySalaryWithdrawals;
                break;
            case 'yearly':
                totalSalaryWithdrawn = salaryWithdrawals
                    .filter(w => isAfter(parseISO(w.created_at), startOfYear(today)))
                    .reduce((sum, w) => sum + w.amount, 0);
                break;
            case 'all':
            default:
                totalSalaryWithdrawn = salaryWithdrawals.reduce((sum, w) => sum + w.amount, 0);
                break;
        }
    }
    
    const totalProfit = totalRevenue - totalCosts - totalSalaryWithdrawn;
    
    const totalCapitalInStock = products.reduce((acc, product) => {
        const stock = (product as any).colors.reduce((sum: number, color: any) => sum + color.stock, 0);
        return acc + ((product as any).cost * stock);
    }, 0);

    const totalMonetaryIncome = monetaryIncome.reduce((acc, income) => acc + income.amount, 0);
    const financialCapital = totalProfit + totalMonetaryIncome;

    const totalItemsSoldCount = sales.reduce((acc, sale) => acc + sale.quantity, 0);
    const totalItemsRequestedCount = customerRequests.reduce((acc, item) => acc + item.quantity, 0);
    
    const conversionRate = totalItemsRequestedCount > 0
      ? (totalItemsSoldCount / totalItemsRequestedCount) * 100 
      : 0;

    return {
      totalRevenue,
      totalProfit,
      totalCosts,
      totalCapitalInStock,
      totalItemsSoldCount,
      conversionRate,
      financialCapital,
    };
  }, [sales, products, customerRequests, statsPeriod, fixedCosts, salaryWithdrawals, monetaryIncome]);

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
            <Select onValueChange={(value) => setStatsPeriod(value as any)} defaultValue={statsPeriod}>
                <SelectTrigger>
                    <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="daily">Hoy</SelectItem>
                    <SelectItem value="weekly">Esta Semana</SelectItem>
                    <SelectItem value="monthly">Este Mes</SelectItem>
                    <SelectItem value="yearly">Este Año</SelectItem>
                    <SelectItem value="all">Total Histórico</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancias Totales</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capital Financiero</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.financialCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
             <p className="text-xs text-muted-foreground">Ganancias + Ingresos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costos Totales</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCosts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capital Total (Stock)</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCapitalInStock.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Vendidos (Total)</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.totalItemsSoldCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
            <Goal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
             <p className="text-xs text-muted-foreground">de pedidos a ventas</p>
          </CardContent>
        </Card>
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
    </>
  );
}
