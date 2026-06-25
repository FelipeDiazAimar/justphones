'use client';

import { useState } from 'react';
import { MOCK_SALES } from '@/lib/mock-data';

export type ProductView = {
  product_id: string;
  view_count: number;
};

export function useProductViews() {
  const productViews: ProductView[] = Object.values(
    MOCK_SALES.reduce((acc: Record<string, ProductView>, sale) => {
      if (!acc[sale.product_id]) {
        acc[sale.product_id] = { product_id: sale.product_id, view_count: 0 };
      }
      acc[sale.product_id].view_count += sale.quantity;
      return acc;
    }, {})
  ).sort((a, b) => b.view_count - a.view_count);

  const [isLoading] = useState(false);
  const fetchProductViews = async () => {};

  return { productViews, isLoading, fetchProductViews };
}
