
'use client';

import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import type { CustomerRequest } from '@/lib/customer-requests';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './use-toast';

interface CustomerRequestsContextType {
  customerRequests: CustomerRequest[];
  isLoading: boolean;
  addCustomerRequest: (requestData: Omit<CustomerRequest, 'id' | 'created_at'>[] | Omit<CustomerRequest, 'id' | 'created_at'>) => Promise<boolean>;
  updateCustomerRequest: (requestId: string, requestData: Partial<Omit<CustomerRequest, 'id' | 'created_at'>>) => Promise<boolean>;
  deleteCustomerRequest: (requestId: string) => Promise<boolean>;
}

const CustomerRequestsContext = createContext<CustomerRequestsContextType | undefined>(undefined);

export function CustomerRequestsProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const { toast } = useToast();
  const [customerRequests, setCustomerRequests] = useState<CustomerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomerRequests = useCallback(async () => {
    console.log("[useCustomerRequests] Fetching customer requests...");
    setIsLoading(true);
    const { data, error, count } = await supabase
      .from('customer_requests')
      .select('*', { count: 'exact' });

    if (error) {
      console.error('[useCustomerRequests] Error fetching customer requests:', error.message);
      setCustomerRequests([]);
      toast({ 
        variant: 'destructive', 
        title: 'Error de Datos', 
        description: `No se pudieron cargar los pedidos de clientes: ${error.message}` 
      });
    } else {
      console.log(`[useCustomerRequests] Fetch successful. ${data?.length ?? 0} records returned by query. Total count in table: ${count}.`);
      setCustomerRequests(data as CustomerRequest[]);
       if (data.length === 0 && count !== 0) {
        console.warn("[useCustomerRequests] WARNING: Query returned 0 records, but total count in table is non-zero. This strongly suggests an RLS policy issue or an authentication problem.");
        toast({
          variant: 'destructive',
          title: 'Problema de Permisos Detectado',
          description: 'Se detectaron pedidos de clientes pero no se pueden mostrar. Revisa las políticas RLS y la autenticación.'
        });
      }
    }
    setIsLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
    fetchCustomerRequests();
  }, [fetchCustomerRequests]);

  const addCustomerRequest = async (requestData: Omit<CustomerRequest, 'id' | 'created_at'>[] | Omit<CustomerRequest, 'id' | 'created_at'>): Promise<boolean> => {
    const dataToInsert = Array.isArray(requestData) ? requestData : [requestData];
    if (dataToInsert.length === 0) return true;

    const { error } = await supabase.from('customer_requests').insert(dataToInsert);
    if (error) {
      console.error('Error adding customer request:', error.message);
      return false;
    }
    await fetchCustomerRequests();
    return true;
  };
  
  const updateCustomerRequest = async (requestId: string, requestData: Partial<Omit<CustomerRequest, 'id' | 'created_at'>>) => {
    const { error } = await supabase.from('customer_requests').update(requestData).eq('id', requestId);
    if (error) {
      console.error('Error updating customer request:', error.message);
      toast({ variant: 'destructive', title: 'Error', description: `No se pudo actualizar el pedido: ${error.message}` });
      return false;
    }
    await fetchCustomerRequests();
    return true;
  };

  const deleteCustomerRequest = async (requestId: string) => {
    console.log('[useCustomerRequests] deleteCustomerRequest llamado', { requestId });
    try {
      const res = await fetch(`/api/admin/customer-requests?id=${encodeURIComponent(requestId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      const body = await res.json().catch(() => ({}));
      console.log('[useCustomerRequests] API delete response', { status: res.status, body });
      if (!res.ok || body?.success !== true) {
        const msg = body?.error || `Status ${res.status}`;
        console.warn('[useCustomerRequests] Eliminación fallida vía API', { requestId, msg });
        toast({ variant: 'destructive', title: 'Error', description: `No se pudo eliminar el pedido: ${msg}` });
        return false;
      }
      console.log('[useCustomerRequests] Eliminación confirmada por API, realizando refetch...', { requestId });
      await fetchCustomerRequests();
      console.log('[useCustomerRequests] Refetch post-eliminación completado');
      return true;
    } catch (e: any) {
      console.error('[useCustomerRequests] Error llamando API de eliminación', { requestId, error: e?.message });
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el pedido: error de red' });
      return false;
    }
  };

  
  return React.createElement(
    CustomerRequestsContext.Provider,
    { value: { customerRequests, isLoading, addCustomerRequest, updateCustomerRequest, deleteCustomerRequest } },
    children
  );
}

export function useCustomerRequests() {
  const context = useContext(CustomerRequestsContext);
  if (context === undefined) {
    throw new Error('useCustomerRequests must be used within a CustomerRequestsProvider');
  }
  return context;
}
