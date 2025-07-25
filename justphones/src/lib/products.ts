
export type ProductColor = {
  name: string;
  hex: string;
  image: string;
  stock: number;
};

export type Product = {
  id: string;
  created_at: string;
  name: string;
  cost: number;
  price: number;
  discount?: number;
  coverImage: string;
  colors: ProductColor[];
  category: 'case' | 'accessory' | 'auriculares';
  model: string;
  featured?: boolean;
  is_new?: boolean;
  subCategory?: string;
};
