'use client';

import { useState } from 'react';
import type { StockHistory } from '@/lib/stock-history';
import { MOCK_STOCK_HISTORY } from '@/lib/mock-data';

export function useStockHistory() {
  const [stockHistory, setStockHistory] = useState<StockHistory[]>(MOCK_STOCK_HISTORY);
  const [isLoading] = useState(false);

  const fetchStockHistory = async () => {
    // No-op in mock mode
  };

  return { stockHistory, isLoading, fetchStockHistory };
}
