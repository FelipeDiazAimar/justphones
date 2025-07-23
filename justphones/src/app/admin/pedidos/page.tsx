
'use client';

import React, { useMemo, useState } from 'react';
import { useSales } from '@/hooks/use-sales';
import { useProducts } from '@/hooks/use-products';
import { useCustomerRequests } from '@/hooks/use-customer-requests';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, ArrowRight, ShoppingBasket, History, CheckCircle2, ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { unslugify } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const ITEMS_PER_PAGE = 5;

export default function AdminPedidosPage() {
  const { sales, isLoading: isLoadingSales } = useSales();
  const { products, isLoading: isLoadingProducts } = useProducts();
  const { customerRequests, isLoading: isLoadingRequests } = useCustomerRequests();
  
  const [allRequestsCurrentPage, setAllRequestsCurrentPage] = useState(1);
  const [lowStockCurrentPage, setLowStockCurrentPage] = useState(1);
  const [demandCurrentPage, setDemandCurrentPage] = useState(1);
  const [fulfilledDemandCurrentPage, setFulfilledDemandCurrentPage] = useState(1);

  const isLoading = isLoadingSales || isLoadingProducts || isLoadingRequests;

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
    <div className="space-y-6">
      <div id="low-stock-section" className="scroll-mt-24">
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
    </div>
  );
}
