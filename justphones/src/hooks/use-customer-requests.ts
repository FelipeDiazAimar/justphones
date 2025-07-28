
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
    const { error } = await supabase.from('customer_requests').delete().eq('id', requestId);
    if (error) {
      console.error('Error deleting customer request:', error.message);
      toast({ variant: 'destructive', title: 'Error', description: `No se pudo eliminar el pedido: ${error.message}` });
      return false;
    }
    await fetchCustomerRequests();
    return true;
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
