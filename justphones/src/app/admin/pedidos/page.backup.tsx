
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useSales } from '@/hooks/use-sales';
import type { Sale } from '@/lib/sales';
import { useProducts } from '@/hooks/use-products';
import { useCustomerRequests } from '@/hooks/use-customer-requests';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, ArrowRight, ShoppingBasket, History, CheckCircle2, ChevronDown, Edit, Trash, Plus, Minus, PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { unslugify } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { CustomerRequest } from '@/lib/customer-requests';


const ITEMS_PER_PAGE = 5;

const editRequestSchema = z.object({
  id: z.string(),
  product_id: z.string().min(1, "Debe seleccionar un producto."),
  color_hex: z.string().min(1, "Debe seleccionar un color."),
  quantity: z.coerce.number().min(1, "La cantidad debe ser al menos 1."),
});

const saleSchema = z.object({
  id: z.string().optional(),
  product_id: z.string().min(1, "Debe seleccionar un producto."),
  product_name: z.string().min(1, "El nombre del producto es requerido."),
  product_model: z.string().min(1, "El modelo del producto es requerido."),
  color_name: z.string().min(1, "El nombre del color es requerido."),
  color_hex: z.string().min(1, "Debe seleccionar un color."),
  quantity: z.coerce.number().min(1, "La cantidad debe ser al menos 1."),
  price_per_unit: z.coerce.number().min(0.01, "El precio por unidad debe ser mayor a 0."),
  total_price: z.coerce.number().min(0.01, "El precio total debe ser mayor a 0."),
  discount_code: z.string().optional(),
  discount_percentage: z.coerce.number().min(0).max(100).optional(),
});


export default function AdminPedidosPage() {
  const { sales, addSale, updateSale, deleteSale, isLoading: isLoadingSales } = useSales();
  const { products, isLoading: isLoadingProducts } = useProducts();
  const { customerRequests, updateCustomerRequest, deleteCustomerRequest, isLoading: isLoadingRequests } = useCustomerRequests();
  const { toast } = useToast();
  
  const [allRequestsCurrentPage, setAllRequestsCurrentPage] = useState(1);
  const [lowStockCurrentPage, setLowStockCurrentPage] = useState(1);
  const [demandCurrentPage, setDemandCurrentPage] = useState(1);
  const [fulfilledDemandCurrentPage, setFulfilledDemandCurrentPage] = useState(1);
  const [isEditRequestDialogOpen, setIsEditRequestDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<CustomerRequest | null>(null);

  // Estados para la gestión de ventas
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const {
    control: controlEditRequest,
    handleSubmit: handleSubmitEditRequest,
    reset: resetEditRequest,
    watch: watchEditRequest,
    setValue: setEditRequestValue,
    formState: { errors: errorsEditRequest },
  } = useForm<z.infer<typeof editRequestSchema>>({
    resolver: zodResolver(editRequestSchema),
  });

  const {
    control: controlSale,
    handleSubmit: handleSubmitSale,
    reset: resetSale,
    watch: watchSale,
    setValue: setSaleValue,
    formState: { errors: errorsSale },
  } = useForm<z.infer<typeof saleSchema>>({
    resolver: zodResolver(saleSchema.omit({ id: true })),
    defaultValues: {
      product_id: '',
      product_name: '',
      product_model: '',
      color_name: '',
      color_hex: '',
      quantity: 1,
      price_per_unit: 0,
      total_price: 0,
      discount_code: '',
      discount_percentage: 0,
    },
  });

  const {
    control: controlEditSale,
    handleSubmit: handleSubmitEditSale,
    reset: resetEditSale,
    watch: watchEditSale,
    setValue: setEditSaleValue,
    formState: { errors: errorsEditSale },
  } = useForm<z.infer<typeof saleSchema>>({
    resolver: zodResolver(saleSchema),
  });

  const watchedEditProductId = watchEditRequest('product_id');
  const selectedEditProduct = useMemo(() => {
    return products.find(p => p.id === watchedEditProductId);
  }, [products, watchedEditProductId]);

  const watchedSaleProductId = watchSale('product_id');
  const selectedSaleProduct = useMemo(() => {
    return products.find(p => p.id === watchedSaleProductId);
  }, [products, watchedSaleProductId]);

  const watchedEditSaleProductId = watchEditSale('product_id');
  const selectedEditSaleProduct = useMemo(() => {
    return products.find(p => p.id === watchedEditSaleProductId);
  }, [products, watchedEditSaleProductId]);

  const handleEditRequest = (request: CustomerRequest) => {
    setEditingRequest(request);
    resetEditRequest({
      id: request.id,
      product_id: request.product_id,
      color_hex: request.color_hex,
      quantity: request.quantity,
    });
    setIsEditRequestDialogOpen(true);
  };

  const handleDeleteRequest = async (requestId: string) => {
    const success = await deleteCustomerRequest(requestId);
    if(success) toast({ title: "Pedido de cliente eliminado" });
  };
  
  const onEditRequestSubmit = async (data: z.infer<typeof editRequestSchema>) => {
    if (!editingRequest || !selectedEditProduct) return;
    
    const selectedColor = selectedEditProduct.colors.find(c => c.hex === data.color_hex);
    if (!selectedColor) {
      toast({ variant: 'destructive', title: 'Error', description: 'El color seleccionado no es válido para este producto.' });
      return;
    }
    
    const updateData = {
      product_id: data.product_id,
      product_name: selectedEditProduct.name,
      product_model: selectedEditProduct.model,
      color_name: selectedColor.name,
      color_hex: selectedColor.hex,
      quantity: data.quantity,
    };

    const success = await updateCustomerRequest(editingRequest.id, updateData);
    if (success) {
      toast({ title: 'Pedido de cliente actualizado'});
      setIsEditRequestDialogOpen(false);
      setEditingRequest(null);
    }
  };

  const onSaleSubmit = async (data: z.infer<typeof saleSchema>) => {
    const saleData: Omit<Sale, 'id' | 'created_at'> = {
      product_id: data.product_id,
      product_name: data.product_name,
      product_model: data.product_model,
      color_name: data.color_name,
      color_hex: data.color_hex,
      quantity: data.quantity,
      price_per_unit: data.price_per_unit,
      total_price: data.total_price,
      discount_code: data.discount_code,
      discount_percentage: data.discount_percentage,
    };

    const success = await addSale(saleData);
    if (success) {
      toast({ title: "Venta Registrada" });
      resetSale();
      setIsSaleDialogOpen(false);
    }
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    resetEditSale(sale);
    setIsSaleDialogOpen(true);
  };

  const onEditSaleSubmit = async (data: z.infer<typeof saleSchema>) => {
    if (!editingSale) return;
    const success = await updateSale(editingSale.id, {
      product_id: data.product_id,
      product_name: data.product_name,
      product_model: data.product_model,
      color_name: data.color_name,
      color_hex: data.color_hex,
      quantity: data.quantity,
      price_per_unit: data.price_per_unit,
      total_price: data.total_price,
      discount_code: data.discount_code,
      discount_percentage: data.discount_percentage,
    });
    if (success) {
      toast({ title: "Venta Actualizada" });
      setIsSaleDialogOpen(false);
      setEditingSale(null);
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    const success = await deleteSale(saleId);
    if (success) {
      toast({ title: "Venta eliminada", description: "La venta ha sido eliminada exitosamente." });
    }
  };

  const handleAddNewSale = () => {
    resetSale({
      product_id: '',
      product_name: '',
      product_model: '',
      color_name: '',
      color_hex: '',
      quantity: 1,
      price_per_unit: 0,
      total_price: 0,
      discount_code: '',
      discount_percentage: 0,
    });
    setEditingSale(null);
    setIsSaleDialogOpen(true);
  };

  // Calcular precio total automáticamente
  useEffect(() => {
    const quantity = watchSale('quantity');
    const pricePerUnit = watchSale('price_per_unit');
    if (quantity && pricePerUnit) {
      setSaleValue('total_price', quantity * pricePerUnit);
    }
  }, [watchSale('quantity'), watchSale('price_per_unit'), setSaleValue]);

  useEffect(() => {
    const quantity = watchEditSale('quantity');
    const pricePerUnit = watchEditSale('price_per_unit');
    if (quantity && pricePerUnit) {
      setEditSaleValue('total_price', quantity * pricePerUnit);
    }
  }, [watchEditSale('quantity'), watchEditSale('price_per_unit'), setEditSaleValue]);

  const isLoading = isLoadingSales || isLoadingProducts || isLoadingRequests;

  const lowStockProducts = useMemo(() => {
    const lowStockItems: any[] = [];
    products.forEach(product => {
        const totalStock = product.colors.reduce((sum, color) => sum + color.stock, 0);
        if (totalStock <= 5 && totalStock > 0) {
            lowStockItems.push({
                productId: product.id,
                productName: unslugify(product.name),
                productModel: product.model,
                stock: totalStock
            });
        }
    });
    return lowStockItems.sort((a, b) => a.stock - b.stock);
  }, [products]);

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
    const sortedSales = [...sales].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return sortedSales.slice(
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
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

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
    <div className="space-y-6">
      <div id="low-stock-section" className="scroll-mt-24">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Alerta de Stock
                </CardTitle>
                <CardDescription>Productos con 5 o menos unidades en total.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {paginatedLowStockProducts.length > 0 ? paginatedLowStockProducts.map((item, index) => (
                        <div key={`${item.productId}-${index}`} className="flex items-center">
                            <div>
                                <p className="text-sm font-medium leading-none">{item.productName}</p>
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

      <div id="unfulfilled-demand-section">
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
      
      <div id="fulfilled-demand-section" className="scroll-mt-24">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Demanda Satisfecha (Ventas Concretadas)
            </CardTitle>
            <CardDescription>
              Historial de todas las ventas completadas exitosamente.
            </CardDescription>
            <div className="flex justify-end">
              <Button onClick={handleAddNewSale} className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Registrar Venta
              </Button>
            </div>
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
                    <TableHead className="text-right">Acciones</TableHead>
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
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditSale(sale)} className="rounded-full">
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
                                  Esta acción no se puede deshacer. Esto eliminará permanentemente la venta.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteSale(sale.id)} className="bg-destructive hover:bg-destructive/90">
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
                      <TableCell colSpan={6} className="text-center h-24">No hay ventas registradas.</TableCell>
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
                        <div className="flex justify-end items-center gap-2 mt-3 pt-3 border-t">
                          <Button variant="ghost" size="icon" onClick={() => handleEditSale(sale)} className="rounded-full">
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
                                  Esta acción no se puede deshacer. Esto eliminará permanentemente la venta.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteSale(sale.id)} className="bg-destructive hover:bg-destructive/90">
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
      
      <div id="all-requests-section" className="scroll-mt-24">
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
                    <TableHead className="text-right">Acciones</TableHead>
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
                      <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEditRequest(request)} className="rounded-full">
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
                                              Esta acción no se puede deshacer. Esto eliminará permanentemente el pedido del cliente.
                                          </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteRequest(request.id)} className="bg-destructive hover:bg-destructive/90">
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
                      <TableCell colSpan={5} className="text-center h-24">No hay pedidos de clientes registrados.</TableCell>
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
                        <div className="flex justify-end items-center gap-2 mt-2 pt-2 border-t">
                             <Button variant="ghost" size="icon" onClick={() => handleEditRequest(request)} className="rounded-full">
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
                                              Esta acción no se puede deshacer. Esto eliminará permanentemente el pedido del cliente.
                                          </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteRequest(request.id)} className="bg-destructive hover:bg-destructive/90">
                                              Eliminar
                                          </AlertDialogAction>
                                      </AlertDialogFooter>
                                  </AlertDialogContent>
                              </AlertDialog>
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
    </div>
    <Dialog open={isEditRequestDialogOpen} onOpenChange={setIsEditRequestDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Editar Pedido de Cliente</DialogTitle>
                <DialogDescription>
                    Modifica los detalles del pedido registrado.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitEditRequest(onEditRequestSubmit)} className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="product_id">Producto</Label>
                    <Controller
                        name="product_id"
                        control={controlEditRequest}
                        render={({ field }) => (
                            <Select onValueChange={(value) => {
                                field.onChange(value);
                                setEditRequestValue('color_hex', '');
                            }} value={field.value}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar producto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{unslugify(p.name)} ({p.model})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errorsEditRequest.product_id && <p className="text-red-500 text-sm">{errorsEditRequest.product_id.message}</p>}
                </div>
                {selectedEditProduct && (
                    <div className="space-y-2">
                        <Label htmlFor="color_hex">Color</Label>
                        <Controller
                            name="color_hex"
                            control={controlEditRequest}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar color" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedEditProduct.colors.map(c => (
                                            <SelectItem key={c.hex} value={c.hex}>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-4 w-4 rounded-full border" style={{backgroundColor: c.hex}}/>
                                                    {c.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errorsEditRequest.color_hex && <p className="text-red-500 text-sm">{errorsEditRequest.color_hex.message}</p>}
                    </div>
                )}
                 <div className="space-y-2">
                    <Label htmlFor="quantity">Cantidad</Label>
                    <Input id="quantity" type="number" {...controlEditRequest.register('quantity')} />
                    {errorsEditRequest.quantity && <p className="text-red-500 text-sm">{errorsEditRequest.quantity.message}</p>}
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
    
    <Dialog open={isSaleDialogOpen} onOpenChange={setIsSaleDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>{editingSale ? 'Editar Venta' : 'Registrar Nueva Venta'}</DialogTitle>
                <DialogDescription>
                    {editingSale ? 'Modifica los detalles de la venta registrada.' : 'Completa los datos para registrar una nueva venta.'}
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={editingSale ? handleSubmitEditSale(onEditSaleSubmit) : handleSubmitSale(onSaleSubmit)} className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="sale-product">Producto</Label>
                    <Controller
                        name="product_id"
                        control={editingSale ? controlEditSale : controlSale}
                        render={({ field }) => (
                            <Select 
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    const product = products.find(p => p.id === value);
                                    if (product) {
                                        if (editingSale) {
                                            setEditSaleValue('product_name', product.name);
                                            setEditSaleValue('product_model', product.model);
                                            setEditSaleValue('original_price', product.price);
                                            setEditSaleValue('price_per_unit', product.price);
                                            setEditSaleValue('color_hex', '');
                                            setEditSaleValue('color_name', '');
                                        } else {
                                            setSaleValue('product_name', product.name);
                                            setSaleValue('product_model', product.model);
                                            setSaleValue('original_price', product.price);
                                            setSaleValue('price_per_unit', product.price);
                                            setSaleValue('color_hex', '');
                                            setSaleValue('color_name', '');
                                        }
                                    }
                                }} 
                                value={field.value}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar producto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {unslugify(p.name)} - {p.model}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {(editingSale ? errorsEditSale.product_id : errorsSale.product_id) && (
                        <p className="text-sm text-destructive">
                            {(editingSale ? errorsEditSale.product_id : errorsSale.product_id)?.message}
                        </p>
                    )}
                </div>

                {(editingSale ? selectedEditSaleProduct : selectedSaleProduct) && (
                    <div className="space-y-2">
                        <Label htmlFor="sale-color">Color</Label>
                        <Controller
                            name="color_hex"
                            control={editingSale ? controlEditSale : controlSale}
                            render={({ field }) => (
                                <Select 
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        const product = editingSale ? selectedEditSaleProduct : selectedSaleProduct;
                                        const color = product?.colors.find(c => c.hex === value);
                                        if (color) {
                                            if (editingSale) {
                                                setEditSaleValue('color_name', color.name);
                                            } else {
                                                setSaleValue('color_name', color.name);
                                            }
                                        }
                                    }} 
                                    value={field.value}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar color" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(editingSale ? selectedEditSaleProduct : selectedSaleProduct)?.colors.map(c => (
                                            <SelectItem key={c.hex} value={c.hex}>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-4 w-4 rounded-full border" style={{backgroundColor: c.hex}}/>
                                                    {c.name} (Stock: {c.stock})
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {(editingSale ? errorsEditSale.color_hex : errorsSale.color_hex) && (
                            <p className="text-sm text-destructive">
                                {(editingSale ? errorsEditSale.color_hex : errorsSale.color_hex)?.message}
                            </p>
                        )}
                    </div>
                )}
                                            const product = editingSale ? selectedEditSaleProduct : selectedSaleProduct;
                                            const color = product?.colors.find(c => c.hex === value);
                                            if (color) {
                                                if (editingSale) {
                                                    setEditSaleValue('color_name', color.name);
                                                } else {
                                                    setSaleValue('color_name', color.name);
                                                }
                                            }
                                        }} 
                                        value={field.value}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar color" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(editingSale ? selectedEditSaleProduct : selectedSaleProduct)?.colors.map(c => (
                                                <SelectItem key={c.hex} value={c.hex}>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-4 w-4 rounded-full border" style={{backgroundColor: c.hex}}/>
                                                        {c.name} (Stock: {c.stock})
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {(editingSale ? errorsEditSale.color_hex : errorsSale.color_hex) && (
                                <p className="text-red-500 text-sm">
                                    {(editingSale ? errorsEditSale.color_hex : errorsSale.color_hex)?.message}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="sale-quantity">Cantidad</Label>
                        <Input 
                            id="sale-quantity" 
                            type="number" 
                            min="1"
                            {...(editingSale ? controlEditSale : controlSale).register('quantity')} 
                        />
                        {(editingSale ? errorsEditSale.quantity : errorsSale.quantity) && (
                            <p className="text-red-500 text-sm">
                                {(editingSale ? errorsEditSale.quantity : errorsSale.quantity)?.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="sale-price-per-unit">Precio por Unidad</Label>
                        <Input 
                            id="sale-price-per-unit" 
                            type="number" 
                            step="0.01"
                            min="0.01"
                            {...(editingSale ? controlEditSale : controlSale).register('price_per_unit')} 
                        />
                        {(editingSale ? errorsEditSale.price_per_unit : errorsSale.price_per_unit) && (
                            <p className="text-red-500 text-sm">
                                {(editingSale ? errorsEditSale.price_per_unit : errorsSale.price_per_unit)?.message}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">Este es el precio final cobrado al cliente (ya incluye descuentos si los hay)</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="sale-total-price">Precio Total</Label>
                        <Input 
                            id="sale-total-price" 
                            type="number" 
                            step="0.01"
                            readOnly
                            className="bg-muted"
                            {...(editingSale ? controlEditSale : controlSale).register('total_price')} 
                        />
                        <p className="text-xs text-muted-foreground">Se calcula automáticamente</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="sale-discount-percentage">Descuento (%)</Label>
                        <Input 
                            id="sale-discount-percentage" 
                            type="number" 
                            min="0"
                            max="100"
                            step="0.1"
                            {...(editingSale ? controlEditSale : controlSale).register('discount_percentage')} 
                        />
                        <p className="text-xs text-muted-foreground">Porcentaje total de descuento aplicado en esta venta (solo informativo)</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="sale-discount-code">Código de Descuento (Opcional)</Label>
                    <Input 
                        id="sale-discount-code" 
                        {...(editingSale ? controlEditSale : controlSale).register('discount_code')} 
                        placeholder="Ej: PROMO20"
                    />
                    <p className="text-xs text-muted-foreground">Código promocional usado para aplicar el descuento (solo informativo)</p>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit">
                        {editingSale ? 'Guardar Cambios' : 'Registrar Venta'}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
    </>
  );
}
