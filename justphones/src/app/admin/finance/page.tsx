
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useSales } from '@/hooks/use-sales';
import { useProducts } from '@/hooks/use-products';
import { useProductViews } from '@/hooks/use-product-views';
import { useCustomerRequests } from '@/hooks/use-customer-requests';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, ShoppingCart, Package, ArrowRight, TrendingUp, AlertTriangle, Eye, HelpCircle, ArrowDownUp, TrendingDown, ChevronsUpDown, Percent, BarChart, ChevronDown, PackageSearch, Activity, Coins, Goal, ShoppingBasket, History, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip, XAxis, YAxis, CartesianGrid, BarChart as RechartsBarChart, Bar } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { unslugify } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { Product } from '@/lib/products';
import { useStockHistory } from '@/hooks/use-stock-history';
import type { StockHistory } from '@/lib/stock-history';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getWeek, getYear, format, startOfWeek, endOfWeek, parseISO, startOfToday, startOfYesterday, startOfMonth, startOfYear, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';


const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const ITEMS_PER_PAGE = 5;

const rentabilidadPaymentOptions = {
    list: { label: 'Precio de Lista', discount: 0 },
    cash: { label: 'Efectivo/Transferencia (20% OFF)', discount: 0.2 },
    debit: { label: 'Tarjeta de Débito (10% OFF)', discount: 0.1 },
};

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
  const { toast } = useToast();
  
  const [sortPopularityBy, setSortPopularityBy] = useState<'sales' | 'requests' | 'views'>('sales');
  
  const [popularityCurrentPage, setPopularityCurrentPage] = useState(1);
  const [rentabilidadCurrentPage, setRentabilidadCurrentPage] = useState(1);
  const [pedidosCurrentPage, setPedidosCurrentPage] = useState(1);
  const [demandCurrentPage, setDemandCurrentPage] = useState(1);
  const [fulfilledDemandCurrentPage, setFulfilledDemandCurrentPage] = useState(1);
  const [allRequestsCurrentPage, setAllRequestsCurrentPage] = useState(1);
  const [lowStockCurrentPage, setLowStockCurrentPage] = useState(1);


  const [rentabilidadPaymentMethod, setRentabilidadPaymentMethod] = useState<keyof typeof rentabilidadPaymentOptions>('list');
  const [salesChartView, setSalesChartView] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [profitChartView, setProfitChartView] = useState<'daily' | 'weekly' | 'monthly' | 'by_order'>('monthly');

  const [statsPeriod, setStatsPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'>('all');

  const [rentabilidadSort, setRentabilidadSort] = useState<{
    column: 'name' | 'cost' | 'price' | 'profit' | 'stock' | 'margin';
    direction: 'asc' | 'desc';
  }>({ column: 'profit', direction: 'desc' });

  const isLoading = isLoadingSales || isLoadingProducts || isLoadingViews || isLoadingStockHistory || isLoadingRequests;

  const stats = useMemo(() => {
    const productsMap = new Map(products.map(p => [p.id, p]));
    
    const filteredSales = sales.filter(sale => {
      const saleDate = parseISO(sale.created_at);
      switch(statsPeriod) {
        case 'daily': return isAfter(saleDate, startOfToday());
        case 'weekly': return isAfter(saleDate, startOfWeek(new Date(), { weekStartsOn: 1 }));
        case 'monthly': return isAfter(saleDate, startOfMonth(new Date()));
        case 'yearly': return isAfter(saleDate, startOfYear(new Date()));
        case 'all':
        default: return true;
      }
    });

    const totalRevenue = filteredSales.reduce((acc, sale) => acc + sale.total_price, 0);
    
    const totalCostOfGoodsSold = filteredSales.reduce((acc, sale) => {
        const product = productsMap.get(sale.product_id);
        return acc + (product ? (product as any).cost * sale.quantity : 0);
    }, 0);

    const totalProfit = totalRevenue - totalCostOfGoodsSold;
    
    const totalCapitalInStock = products.reduce((acc, product) => {
        const stock = (product as any).colors.reduce((sum: number, color: any) => sum + color.stock, 0);
        return acc + ((product as any).cost * stock);
    }, 0);

    const totalItemsSoldCount = sales.reduce((acc, sale) => acc + sale.quantity, 0);
    const totalItemsRequestedCount = customerRequests.reduce((acc, item) => acc + item.quantity, 0);
    
    const conversionRate = totalItemsRequestedCount > 0
      ? (totalItemsSoldCount / totalItemsRequestedCount) * 100 
      : 0;

    return {
      totalRevenue,
      totalProfit,
      totalCostOfGoodsSold,
      totalCapitalInStock,
      totalItemsSoldCount,
      conversionRate,
    };
  }, [sales, products, customerRequests, statsPeriod]);

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
        const [aMonth, aYear] = aTyped.date.split(' ');
        const [bMonth, bYear] = bTyped.date.split(' ');
        const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        return (Number(aYear) * 100 + months.indexOf(aMonth)) - (Number(bYear) * 100 + months.indexOf(bMonth));
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

  const lowStockProducts = useMemo(() => {
    const lowStockItems: any[] = [];
    products.forEach(product => {
      product.colors.forEach(color => {
        if (color.stock <= 5 && color.stock > 0) {
          lowStockItems.push({
            productId: product.id,
            productName: unslugify(product.name),
            productModel: product.model,
            colorName: color.name,
            colorHex: color.hex,
            stock: color.stock
          });
        }
      });
    });
    return lowStockItems.sort((a, b) => a.stock - b.stock);
  }, [products]);

  const paginatedLowStockProducts = useMemo(() => {
    return lowStockProducts.slice(
      (lowStockCurrentPage - 1) * ITEMS_PER_PAGE,
      lowStockCurrentPage * ITEMS_PER_PAGE
    );
  }, [lowStockProducts, lowStockCurrentPage]);

  const lowStockTotalPages = Math.ceil(lowStockProducts.length / ITEMS_PER_PAGE);

  const handleLowStockPageChange = (page: number) => {
    if (page < 1 || page > lowStockTotalPages) return;
    setLowStockCurrentPage(page);
    const lowStockSection = document.getElementById('low-stock-section');
    if (lowStockSection) {
        lowStockSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    type ChartDataPoint = { date: string; profit: number; cost: number };
  
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

  const unfulfilledDemand = useMemo(() => {
    const requestedQuantities: Record<string, { data: any, requested: number }> = {};
    customerRequests.forEach(req => {
        const key = `${req.product_id}-${req.color_hex}`;
        if (!requestedQuantities[key]) {
            requestedQuantities[key] = {
                data: req,
                requested: 0,
            };
        }
        requestedQuantities[key].requested += req.quantity;
    });

    const soldQuantities: Record<string, number> = {};
    sales.forEach(sale => {
        const key = `${sale.product_id}-${sale.color_hex}`;
        if (!soldQuantities[key]) {
            soldQuantities[key] = 0;
        }
        soldQuantities[key] += sale.quantity;
    });

    return Object.values(requestedQuantities)
        .map(({ data, requested }) => {
            const key = `${data.product_id}-${data.color_hex}`;
            const sold = soldQuantities[key] || 0;
            const pending = requested - sold;
            if (pending > 0) {
                return {
                    id: key,
                    ...data,
                    requested,
                    sold,
                    pending,
                };
            }
            return null;
        })
        .filter(item => item !== null)
        .sort((a,b) => b!.pending - a!.pending);
  }, [customerRequests, sales]);

  const paginatedDemand = useMemo(() => {
    return unfulfilledDemand.slice(
      (demandCurrentPage - 1) * ITEMS_PER_PAGE,
      demandCurrentPage * ITEMS_PER_PAGE
    );
  }, [unfulfilledDemand, demandCurrentPage]);

  const demandTotalPages = Math.ceil(unfulfilledDemand.length / ITEMS_PER_PAGE);

  const handleDemandPageChange = (page: number) => {
    if (page < 1 || page > demandTotalPages) return;
    setDemandCurrentPage(page);
    const demandSection = document.getElementById('unfulfilled-demand-section');
    if (demandSection) {
      demandSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const paginatedFulfilledDemand = useMemo(() => {
    return sales.slice(
      (fulfilledDemandCurrentPage - 1) * ITEMS_PER_PAGE,
      fulfilledDemandCurrentPage * ITEMS_PER_PAGE
    );
  }, [sales, fulfilledDemandCurrentPage]);
  
  const fulfilledDemandTotalPages = Math.ceil(sales.length / ITEMS_PER_PAGE);

  const handleFulfilledDemandPageChange = (page: number) => {
    if (page < 1 || page > fulfilledDemandTotalPages) return;
    setFulfilledDemandCurrentPage(page);
    const section = document.getElementById('fulfilled-demand-section');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  
  const paginatedAllRequests = useMemo(() => {
    const sortedRequests = [...customerRequests].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return sortedRequests.slice(
      (allRequestsCurrentPage - 1) * ITEMS_PER_PAGE,
      allRequestsCurrentPage * ITEMS_PER_PAGE
    );
  }, [customerRequests, allRequestsCurrentPage]);
  
  const allRequestsTotalPages = Math.ceil(customerRequests.length / ITEMS_PER_PAGE);
  
  const handleAllRequestsPageChange = (page: number) => {
    if (page < 1 || page > allRequestsTotalPages) return;
    setAllRequestsCurrentPage(page);
    const section = document.getElementById('all-requests-section');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };


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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
            <div className="text-2xl font-bold">${stats.totalProfit.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costos Totales (Ventas)</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCostOfGoodsSold.toLocaleString()}</div>
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
                            formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name === 'profit' ? 'Ganancia' : 'Costo']}
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
                        <Pie data={salesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
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

      <div id="low-stock-section" className="grid gap-4 mt-6 scroll-mt-24">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Alerta de Stock
                </CardTitle>
                <CardDescription>Productos con 5 o menos unidades por color.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {paginatedLowStockProducts.length > 0 ? paginatedLowStockProducts.map((item, index) => (
                        <div key={`${item.productId}-${item.colorName}-${index}`} className="flex items-center">
                            <div
                                className="h-4 w-4 rounded-full border mr-3"
                                style={{ backgroundColor: item.colorHex }}
                             />
                            <div>
                                <p className="text-sm font-medium leading-none">{item.productName} ({item.colorName})</p>
                                <p className="text-sm text-muted-foreground">{item.productModel}</p>
                            </div>
                            <div className="ml-auto text-right">
                                <p className="font-bold text-destructive">{item.stock}</p>
                                <p className="text-xs text-muted-foreground">unidades</p>
                            </div>
                            <Link href={`/admin/products`} className="ml-4">
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </Link>
                        </div>
                    )) : (
                      <p className="text-sm text-muted-foreground text-center py-4">¡Todo en orden! No hay productos con bajo stock.</p>
                    )}
                </div>
                {renderPagination(lowStockTotalPages, lowStockCurrentPage, handleLowStockPageChange)}
            </CardContent>
        </Card>
      </div>

      <div id="unfulfilled-demand-section" className="grid gap-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBasket className="h-5 w-5 text-primary" />
              Demanda No Satisfecha
            </CardTitle>
            <CardDescription>
              Productos pedidos por clientes que aún no se han convertido en ventas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop Table */}
            <div className="hidden md:block border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead className="text-center">Pedido</TableHead>
                    <TableHead className="text-center">Vendido</TableHead>
                    <TableHead className="text-center">Pendiente</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDemand.length > 0 ? paginatedDemand.map((item) => (
                    <TableRow key={item!.id}>
                      <TableCell>
                        <p className="font-medium">{unslugify(item!.product_name)}</p>
                        <p className="text-xs text-muted-foreground">{item!.product_model}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: item!.color_hex }}/>
                          {item!.color_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{item!.requested}</TableCell>
                      <TableCell className="text-center">{item!.sold}</TableCell>
                      <TableCell className="text-center font-bold text-destructive">{item!.pending}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href="/admin/products">Vender</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">
                        ¡Felicidades! No hay pedidos pendientes.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
             {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {paginatedDemand.length > 0 ? paginatedDemand.map((item) => (
                    <Card key={item!.id}>
                        <Collapsible>
                            <CollapsibleTrigger className="w-full p-4 text-left">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium">{unslugify(item!.product_name)}</p>
                                        <p className="text-xs text-muted-foreground">{item!.product_model}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: item!.color_hex }}/>
                                            <span className="text-sm">{item!.color_name}</span>
                                        </div>
                                    </div>
                                    <ChevronDown className="h-5 w-5 transition-transform data-[state=open]:rotate-180" />
                                </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="px-4 pb-4">
                                <div className="grid grid-cols-3 gap-2 text-center text-sm mt-2 pt-2 border-t">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Pedido</p>
                                        <p className="font-medium">{item!.requested}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Vendido</p>
                                        <p className="font-medium">{item!.sold}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Pendiente</p>
                                        <p className="font-bold text-destructive">{item!.pending}</p>
                                    </div>
                                </div>
                                <Button asChild variant="outline" size="sm" className="w-full mt-4">
                                    <Link href="/admin/products">Vender</Link>
                                </Button>
                            </CollapsibleContent>
                        </Collapsible>
                    </Card>
                )) : (
                    <p className="text-center h-24 flex items-center justify-center text-muted-foreground">¡Felicidades! No hay pedidos pendientes.</p>
                )}
            </div>
            {renderPagination(demandTotalPages, demandCurrentPage, handleDemandPageChange)}
          </CardContent>
        </Card>
      </div>
      
      <div id="fulfilled-demand-section" className="grid gap-4 mt-6 scroll-mt-24">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Demanda Satisfecha (Ventas Concretadas)
            </CardTitle>
            <CardDescription>
              Historial de todas las ventas completadas exitosamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {/* Desktop Table */}
            <div className="hidden md:block border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-right">Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedFulfilledDemand.length > 0 ? paginatedFulfilledDemand.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <p className="font-medium">{unslugify(sale.product_name)}</p>
                        <p className="text-xs text-muted-foreground">{sale.product_model}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: sale.color_hex }} />
                          {sale.color_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{sale.quantity}</TableCell>
                      <TableCell className="text-center font-bold text-primary">${sale.total_price.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{new Date(sale.created_at).toLocaleDateString('es-ES')}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">No hay ventas registradas.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {paginatedFulfilledDemand.length > 0 ? paginatedFulfilledDemand.map((sale) => (
                    <Card key={sale.id} className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-medium">{unslugify(sale.product_name)}</p>
                                <p className="text-xs text-muted-foreground">{sale.product_model}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: sale.color_hex }} />
                                    <span className="text-sm">{sale.color_name}</span>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                                <p className="font-bold text-primary">${sale.total_price.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">Cant: {sale.quantity}</p>
                                <p className="text-xs text-muted-foreground mt-1">{new Date(sale.created_at).toLocaleDateString('es-ES')}</p>
                            </div>
                        </div>
                    </Card>
                )) : (
                    <p className="text-center h-24 flex items-center justify-center text-muted-foreground">No hay ventas registradas.</p>
                )}
            </div>
            {renderPagination(fulfilledDemandTotalPages, fulfilledDemandCurrentPage, handleFulfilledDemandPageChange)}
          </CardContent>
        </Card>
      </div>
      
      <div id="all-requests-section" className="grid gap-4 mt-6 scroll-mt-24">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-500" />
              Historial de Pedidos de Clientes
            </CardTitle>
            <CardDescription>
              Todos los productos que los clientes han añadido al carrito, independientemente de si la venta se completó.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop Table */}
            <div className="hidden md:block border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead className="text-center">Cantidad Pedida</TableHead>
                    <TableHead className="text-right">Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAllRequests.length > 0 ? paginatedAllRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <p className="font-medium">{unslugify(request.product_name)}</p>
                        <p className="text-xs text-muted-foreground">{request.product_model}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: request.color_hex }} />
                          {request.color_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{request.quantity}</TableCell>
                      <TableCell className="text-right">{new Date(request.created_at).toLocaleDateString('es-ES')}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">No hay pedidos de clientes registrados.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {paginatedAllRequests.length > 0 ? paginatedAllRequests.map((request) => (
                    <Card key={request.id} className="p-4">
                        <div className="flex justify-between items-start">
                             <div>
                                <p className="font-medium">{unslugify(request.product_name)}</p>
                                <p className="text-xs text-muted-foreground">{request.product_model}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: request.color_hex }} />
                                    <span className="text-sm">{request.color_name}</span>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                                <p className="font-bold text-primary">Cant: {request.quantity}</p>
                                <p className="text-xs text-muted-foreground mt-1">{new Date(request.created_at).toLocaleDateString('es-ES')}</p>
                            </div>
                        </div>
                    </Card>
                )) : (
                    <p className="text-center h-24 flex items-center justify-center text-muted-foreground">No hay pedidos de clientes registrados.</p>
                )}
            </div>
            {renderPagination(allRequestsTotalPages, allRequestsCurrentPage, handleAllRequestsPageChange)}
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
                            <TableHead className={cn('text-center transition-colors', sortPopularityBy === 'views' && 'text-primary')}>Vistas</TableHead>
                            <TableHead className={cn('text-center transition-colors', sortPopularityBy === 'requests' && 'text-primary')}>Pedidos</TableHead>
                            <TableHead className={cn('text-center transition-colors', sortPopularityBy === 'sales' && 'text-primary')}>Ventas</TableHead>
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
                                <TableCell className={cn('text-center font-medium transition-colors', sortPopularityBy === 'views' && 'bg-primary/10 text-primary')}>
                                  {product.views}
                                </TableCell>
                                <TableCell className={cn('text-center font-medium transition-colors', sortPopularityBy === 'requests' && 'bg-primary/10 text-primary')}>
                                  {product.requests}
                                </TableCell>
                                <TableCell className={cn('text-center font-bold transition-colors', sortPopularityBy === 'sales' ? 'bg-primary/10 text-primary' : 'text-primary')}>
                                  {product.sales}
                                </TableCell>
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
    </>
  );
}
