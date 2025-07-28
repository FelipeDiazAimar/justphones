
export type DiscountCode = {
  id: string;
  created_at: string;
  code: string;
  name: string;
  description?: string;
  percentage: number;
  expires_at?: string;
  conditions?: string;
  usage_limit?: number;
  usage_count: number;
  is_active: boolean;
};

export type DiscountCodeValidationResult = {
    success: boolean;
    error?: string;
    percentage?: number;
    code?: string;
    name?: string;
};

    
