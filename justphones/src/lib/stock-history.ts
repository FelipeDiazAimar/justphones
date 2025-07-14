
export type StockHistory = {
  id: string;
  created_at: string;
  product_id: string;
  product_name: string;
  product_model: string;
  color_name: string;
  quantity_added: number;
  cost: number;
  price: number;
  pedido_id: string;
  notes?: string;
};
