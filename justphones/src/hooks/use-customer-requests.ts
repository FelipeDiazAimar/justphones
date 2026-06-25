'use client';

import React, { useState, createContext, useContext, ReactNode } from 'react';
import type { CustomerRequest } from '@/lib/customer-requests';
import { MOCK_CUSTOMER_REQUESTS } from '@/lib/mock-data';
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
  const { toast } = useToast();
  const [customerRequests, setCustomerRequests] = useState<CustomerRequest[]>(MOCK_CUSTOMER_REQUESTS);
  const [isLoading] = useState(false);

  const addCustomerRequest = async (requestData: Omit<CustomerRequest, 'id' | 'created_at'>[] | Omit<CustomerRequest, 'id' | 'created_at'>): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    const dataArray = Array.isArray(requestData) ? requestData : [requestData];
    if (dataArray.length === 0) return true;
    const newRequests: CustomerRequest[] = dataArray.map((req, i) => ({
      ...req,
      id: `req-new-${Date.now()}-${i}`,
      created_at: new Date().toISOString(),
    }));
    setCustomerRequests(prev => [...newRequests, ...prev]);
    return true;
  };

  const updateCustomerRequest = async (requestId: string, requestData: Partial<Omit<CustomerRequest, 'id' | 'created_at'>>): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    setCustomerRequests(prev => prev.map(r => r.id === requestId ? { ...r, ...requestData } : r));
    toast({ title: 'Pedido actualizado' });
    return true;
  };

  const deleteCustomerRequest = async (requestId: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 300));
    setCustomerRequests(prev => prev.filter(r => r.id !== requestId));
    toast({ title: 'Pedido eliminado' });
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
