'use client';

import { useState } from 'react';
import type { ProductHistory } from '@/lib/product-history';
import { MOCK_PRODUCT_HISTORY } from '@/lib/mock-data';

export function useProductHistory() {
  const [productHistory] = useState<ProductHistory[]>(MOCK_PRODUCT_HISTORY);
  const [isLoading] = useState(false);

  return { productHistory, isLoading };
}
