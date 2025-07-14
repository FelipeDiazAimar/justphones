
'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Product, ProductColor } from '@/lib/products';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Trash, Edit, PlusCircle, ShoppingBag, Search, PartyPopper, Star, UploadCloud, X, Tag, History, ChevronDown, Plus, Minus, PackagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProducts } from '@/hooks/use-products';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { useSubcategories } from '@/hooks/use-subcategories';
import { useModels } from '@/hooks/use-models';
import { unslugify, cn, expandModelString } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Sale } from '@/lib/sales';
import { useSales } from '@/hooks/use-sales';
import { useProductHistory } from '@/hooks/use-product-history';
import type { ProductHistory } from '@/lib/product-history';
import { useStockHistory } from '@/hooks/use-stock-history';
import type { StockHistory } from '@/lib/stock-history';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


const colorSchema = z.object({
  name: z.string().min(1, "El nombre del color es requerido."),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Código hex inválido"),
  image: z.any().optional(),
  stock: z.coerce.number().min(0, "El stock no puede ser negativo"),
});

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre es requerido."),
  cost: z.coerce.number().min(0, "El costo debe ser positivo"),
  price: z.coerce.number().min(0, "El precio debe ser positivo"),
  coverImage: z.any().optional(),
  category: z.enum(['case', 'accessory', 'auriculares'], {
    errorMap: () => ({ message: "Categoría debe ser: case, accessory o auriculares" })
  }),
  model: z.string().min(1, "El modelo es requerido"),
  featured: z.boolean().optional(),
  is_new: z.boolean().optional(),
  colors: z.array(colorSchema).min(1, "Al menos un color es requerido"),
  created_at: z.string().optional(),
});
const productFormSchema = productSchema.omit({ id: true, created_at: true });

const saleSchema = z.object({
  productId: z.string().min(1, "Debe seleccionar un producto."),
  colorHex: z.string().min(1, "Debe seleccionar un color."),
  quantity: z.coerce.number().min(1, "La cantidad debe ser al menos 1."),
});

const ColorImageInput = ({ control, index, errors, setPreviewDialogUrl }: { control: any; index: number; errors: any; setPreviewDialogUrl: (url: string) => void; }) => {
    const value = useWatch({ control, name: `colors.${index}.image` });
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (value instanceof File) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(value);
        } else if (typeof value === 'string' && value) {
            setPreviewUrl(value);
        } else {
            setPreviewUrl(null);
        }
    }, [value]);
    
    return (
        <Controller
            name={`colors.${index}.image`}
            control={control}
            render={({ field: { onChange, name, ref } }) => (
                <div className="flex flex-col gap-2 mt-1">
                    <label htmlFor={`color-image-upload-${index}`} className="relative flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-card">
                        <UploadCloud className="w-6 h-6 mb-1 text-muted-foreground" />
                        <p className="text-xs text-center text-muted-foreground">Click o arrastrar</p>
                        <input
                            id={`color-image-upload-${index}`}
                            type="file"
                            className="hidden"
                            accept="image/png, image/jpeg, image/webp"
                            ref={ref}
                            name={name}
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    onChange(e.target.files[0]);
                                }
                            }}
                        />
                    </label>
                    <div className="relative flex items-center">
                        <div className="flex-grow border-t border-muted"></div>
                        <span className="flex-shrink mx-2 text-muted-foreground text-xs">O</span>
                        <div className="flex-grow border-t border-muted"></div>
                    </div>
                    <Input
                        placeholder="Pega una URL..."
                        value={typeof value === 'string' ? value : ''}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={value instanceof File}
                        className="h-8 text-xs"
                    />
                    
                    {previewUrl && (
                        <div className="flex items-center gap-2 mt-2">
                            <div className="relative w-10 h-10 rounded-md overflow-hidden border flex-shrink-0">
                                <Image src={previewUrl} alt={`Thumbnail ${index}`} fill className="object-cover"/>
                            </div>
                            <Button type="button" variant="outline" size="sm" className="flex-grow" onClick={() => setPreviewDialogUrl(previewUrl)}>Ver Previa</Button>
                            <Button type="button" variant="destructive" size="icon" className="h-9 w-9 flex-shrink-0 rounded-full" onClick={() => onChange('')}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    
                    {errors?.colors?.[index]?.image && <p className="text-red-500 text-xs mt-1">{typeof errors.colors[index].image.message === 'string' ? errors.colors[index].image.message : ''}</p>}
                </div>
            )}
        />
    )
}

export default function AdminProductsPage() {
  const supabase = createClient();
  const { products, addProduct, updateProduct, deleteProduct, isLoading: isLoadingProducts, fetchProducts, getProductById } = useProducts();
  const { subcategories, isLoading: isLoadingSubcategories } = useSubcategories();
  const { models, allModels, isLoading: isLoadingModels } = useModels();
  const { sales, addSale, isLoading: isLoadingSales } = useSales();
  const { productHistory, isLoading: isLoadingProductHistory } = useProductHistory();
  const { stockHistory, isLoading: isLoadingStockHistory, fetchStockHistory } = useStockHistory();

  const productsRef = useRef(products);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);


  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filterCategory, setFilterCategory] = useState<'all' | 'case' | 'accessory' | 'auriculares'>('all');
  const [filterModel, setFilterModel] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [isStockUpdateDialogOpen, setIsStockUpdateDialogOpen] = useState(false);
  const [stockUpdates, setStockUpdates] = useState<Record<string, string>>({});
  const [stockUpdateSearchQuery, setStockUpdateSearchQuery] = useState('');

  const [mobileStockInputs, setMobileStockInputs] = useState<Record<string, string | number>>({});

  const [saleFilters, setSaleFilters] = useState({
    category: 'all',
    name: 'all',
    model: 'all',
  });
  
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [previewDialogUrl, setPreviewDialogUrl] = useState<string | null>(null);

  const [isSalesHistoryDialogOpen, setIsSalesHistoryDialogOpen] = useState(false);
  const [isProductHistoryDialogOpen, setIsProductHistoryDialogOpen] = useState(false);
  const [isStockHistoryDialogOpen, setIsStockHistoryDialogOpen] = useState(false);


  const { toast } = useToast();

  const handleStorageError = (error: { message: string }, title: string) => {
    let description = error.message;
    if (error.message.includes('violates row-level security policy')) {
        description = 'Acción bloqueada por la seguridad de la base de datos. Por favor, revisa las políticas de Row-Level Security (RLS) para el bucket de almacenamiento en tu panel de Supabase.';
    }
    toast({ variant: 'destructive', title, description });
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      price: 0,
      cost: 0,
      coverImage: '/Cover.png?v=3',
      category: 'case',
      model: 'iPhone 15',
      colors: [{ name: 'Negro', hex: '#000000', image: '/Cover.png?v=3', stock: 0 }],
      featured: false,
      is_new: false,
    },
  });

  const watchedCategory = watch("category");
  const watchedCoverImage = watch('coverImage');

  const { fields, append, remove } = useFieldArray({
    control,
    name: "colors",
  });
  
  const {
    register: registerSale,
    handleSubmit: handleSubmitSale,
    control: controlSale,
    watch: watchSale,
    reset: resetSale,
    setValue: setSaleValue,
    formState: { errors: errorsSale },
  } = useForm<z.infer<typeof saleSchema>>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      productId: '',
      colorHex: '',
      quantity: 1,
    },
  });


  const watchedSaleProductId = watchSale('productId');
 
  useEffect(() => {
    if (watchedCoverImage instanceof File) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setCoverImagePreview(reader.result as string);
        };
        reader.readAsDataURL(watchedCoverImage);
    } else if (typeof watchedCoverImage === 'string' && watchedCoverImage) {
        setCoverImagePreview(watchedCoverImage);
    } else {
        setCoverImagePreview(null);
    }
  }, [watchedCoverImage]);


  const saleProduct = useMemo(() => {
    return products.find(p => p.id === watchedSaleProductId) || null;
  }, [watchedSaleProductId, products]);

  const saleCategoryOptions = ['case', 'accessory', 'auriculares'];
  const caseModels = useMemo(() => models.case || [], [models]);
  const accessoryModels = useMemo(() => models.accessory || [], [models]);
  const auricularesModels = useMemo(() => models.auriculares || [], [models]);
  
  const saleNameOptions = useMemo(() => {
    if (saleFilters.category === 'all') {
        return [];
    }
    const names = products
        .filter(p => p.category === saleFilters.category)
        .map(p => p.name);
    return [...new Set(names)].sort();
  }, [products, saleFilters.category]);

  const saleModelOptions = useMemo(() => {
    if (saleFilters.category === 'all' || saleFilters.name === 'all') {
        if (saleFilters.category === 'case') return caseModels;
        if (saleFilters.category === 'accessory') return accessoryModels;
        if (saleFilters.category === 'auriculares') return auricularesModels;
        return [];
    }
    
    const availableModelsForName = products
        .filter(p => p.category === saleFilters.category && p.name === saleFilters.name)
        .map(p => p.model);

    return [...new Set(availableModelsForName)].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
}, [products, saleFilters, caseModels, accessoryModels, auricularesModels]);

  const saleDialogProducts = useMemo(() => {
      if (saleFilters.category === 'all') {
          return [];
      }
      let tempProducts = products.filter(p => p.category === saleFilters.category);

      if (saleFilters.name !== 'all') {
          tempProducts = tempProducts.filter(p => p.name === saleFilters.name);
      }
      if (saleFilters.model !== 'all') {
          tempProducts = tempProducts.filter(p => p.model === saleFilters.model);
      }
      return tempProducts
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, saleFilters]);


  useEffect(() => {
    if (watchedSaleProductId) {
        setSaleValue('colorHex', '');
    }
  }, [watchedSaleProductId, setSaleValue]);
  
  const filteredProducts = useMemo(() => {
    let tempProducts = [...products];
    
    if (filterCategory !== 'all') {
      tempProducts = tempProducts.filter(p => p.category === filterCategory);
    }
    
    if (filterModel !== 'all') {
      tempProducts = tempProducts.filter(p => expandModelString(p.model).includes(filterModel));
    }

    if (searchQuery) {
        tempProducts = tempProducts.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    switch (sortBy) {
      case 'name-asc':
        tempProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        tempProducts.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        tempProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        tempProducts.sort((a, b) => b.price - a.price);
        break;
      case 'stock-asc':
        tempProducts.sort((a, b) => {
          const stockA = a.colors.reduce((sum, c) => sum + c.stock, 0);
          const stockB = b.colors.reduce((sum, c) => sum + c.stock, 0);
          return stockA - stockB;
        });
        break;
      case 'stock-desc':
        tempProducts.sort((a, b) => {
          const stockA = a.colors.reduce((sum, c) => sum + c.stock, 0);
          const stockB = b.colors.reduce((sum, c) => sum + c.stock, 0);
          return stockB - a.colors.reduce((sum, c) => sum + c.stock, 0);
        });
        break;
      case 'date-desc':
        tempProducts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'date-asc':
        tempProducts.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      default:
        break;
    }

    return tempProducts;
  }, [products, filterCategory, filterModel, sortBy, searchQuery]);

  const handleAddNewProduct = () => {
    reset({
      name: '',
      price: 0,
      cost: 0,
      coverImage: '/Cover.png?v=3',
      category: 'case',
      model: 'iPhone 15',
      colors: [{ name: 'Negro', hex: '#000000', image: '/Cover.png?v=3', stock: 0 }],
      featured: false,
      is_new: false,
    });
    setEditingProduct(null);
    setCoverImagePreview('/Cover.png?v=3');
    setIsProductDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    reset(product);
    setEditingProduct(product);
    setCoverImagePreview(product.coverImage);
    setIsProductDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    const success = await deleteProduct(productId);
    if(success) toast({ title: "Producto eliminado", description: "El producto ha sido eliminado exitosamente." });
  };

  const onProductSubmit = async (formData: z.infer<typeof productFormSchema>) => {
    console.log("[Submit] Form data received:", formData);
    
    // Validar que hay al menos un color con imagen
    const hasValidColors = formData.colors.every(color => 
      color.name && 
      color.hex && 
      color.hex.match(/^#[0-9a-fA-F]{6}$/) && 
      color.stock >= 0
    );
    
    if (!hasValidColors) {
        toast({ 
          variant: 'destructive', 
          title: "Error de Validación", 
          description: "Todos los colores deben tener nombre, código hex válido y stock no negativo."
        });
        return;
    }

    const processImage = async (fileOrUrl: any, pathPrefix: string): Promise<string> => {
        if (!fileOrUrl || typeof fileOrUrl === 'string') {
            return fileOrUrl || '';
        }

        if (fileOrUrl instanceof File) {
            try {
                const filePath = `${pathPrefix}/${Date.now()}_${fileOrUrl.name.replace(/\s/g, '_')}`;
                const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, fileOrUrl);
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
                return urlData.publicUrl;
            } catch (e: any) {
                handleStorageError(e, 'Error al subir imagen');
                throw e;
            }
        }
        return '';
    };

    try {
        const coverImageUrl = await processImage(formData.coverImage, 'public');
        console.log("[Submit] Cover image processed. URL:", coverImageUrl);

        const colorImageUrls = await Promise.all(
            formData.colors.map(color => processImage(color.image, 'public/colors'))
        );
        console.log("[Submit] Color images processed. URLs:", colorImageUrls);

        const finalProductData = {
            ...formData,
            coverImage: coverImageUrl,
            colors: formData.colors.map((color, index) => ({
                ...color,
                image: colorImageUrls[index],
            })),
        };
        console.log("[Submit] Final data for submission:", finalProductData);

        let success;
        if (editingProduct) {
            console.log(`[Submit] Calling updateProduct for ID: ${editingProduct.id}`);
            success = await updateProduct(editingProduct.id, finalProductData);
        } else {
            console.log("[Submit] Calling addProduct for new product.");
            success = await addProduct(finalProductData);
        }

        console.log("[Submit] Submission success status:", success);
        if (success) {
            toast({
                title: editingProduct ? "Producto actualizado" : "Producto creado",
                description: `El producto ha sido ${editingProduct ? 'actualizado' : 'creado'} exitosamente.`,
            });
            setIsProductDialogOpen(false);
            setCoverImagePreview(null);
        }
    } catch (error) {
        console.error("[Submit] An unexpected error occurred during product submission:", error);
        toast({ variant: 'destructive', title: 'Error Inesperado', description: `Ocurrió un error al guardar el producto.` });
    }
  };

  const handleRegisterSale = () => {
    resetSale({ productId: '', colorHex: '', quantity: 1 });
    setSaleFilters({ category: 'all', name: 'all', model: 'all' });
    setIsSaleDialogOpen(true);
  };

  const handleSellProductClick = (product: Product) => {
    resetSale({
      productId: product.id,
      colorHex: '',
      quantity: 1,
    });
    setSaleFilters({
      category: product.category,
      name: product.name,
      model: product.model,
    });
    setIsSaleDialogOpen(true);
  };

  const onSaleSubmit = async (data: z.infer<typeof saleSchema>) => {
    const productToUpdate = products.find(p => p.id === data.productId);
    if (!productToUpdate) {
        toast({ variant: 'destructive', title: 'Error', description: 'Producto no encontrado.' });
        return;
    }

    const colorToUpdate = productToUpdate.colors.find(c => c.hex === data.colorHex);
    if (!colorToUpdate) {
        toast({ variant: 'destructive', title: 'Error', description: 'Color no encontrado.' });
        return;
    }

    if (data.quantity > colorToUpdate.stock) {
        toast({
            variant: 'destructive',
            title: 'Error de stock',
            description: `No puedes vender ${data.quantity} unidades. Stock disponible: ${colorToUpdate.stock}.`
        });
        return;
    }

    const updatedColors = productToUpdate.colors.map(c => {
        if (c.hex === data.colorHex) {
            return { ...c, stock: c.stock - data.quantity };
        }
        return c;
    });
    
    const stockUpdateSuccess = await updateProduct(productToUpdate.id, { colors: updatedColors });
    
    if(!stockUpdateSuccess) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el stock del producto.' });
      return;
    }

    const saleData: Omit<Sale, 'id' | 'created_at'> = {
        product_id: productToUpdate.id,
        product_name: productToUpdate.name,
        product_model: productToUpdate.model,
        color_name: colorToUpdate.name,
        color_hex: colorToUpdate.hex,
        quantity: data.quantity,
        price_per_unit: productToUpdate.price,
        total_price: productToUpdate.price * data.quantity,
    };
    
    const saleAddSuccess = await addSale(saleData);

    if(saleAddSuccess) {
      toast({
        className: "border-primary/20 shadow-lg shadow-primary/10",
        title: "¡Venta Exitosa!",
        description: (
          <div className="flex w-full items-center gap-4">
             <PartyPopper className="h-8 w-8 flex-shrink-0 text-primary" />
             <div className="flex flex-col">
                <p className="text-sm">
                  Vendiste {data.quantity}x {unslugify(productToUpdate.name)} ({productToUpdate.model}). ¡Sigue así!
                </p>
             </div>
          </div>
        ),
      });
      setIsSaleDialogOpen(false);
    } else {
         toast({ variant: 'destructive', title: 'Error de Registro', description: 'La venta actualizó el stock pero no pudo ser guardada en el historial' });
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    const success = await updateProduct(product.id, { featured: !product.featured });
    if (success) {
      toast({
        title: "Producto Destacado",
        description: `El producto "${unslugify(product.name)}" ahora está ${!product.featured ? 'destacado' : 'oculto de destacados'}.`,
      });
    }
  };

  const handleToggleNew = async (product: Product) => {
    const success = await updateProduct(product.id, { is_new: !product.is_new });
    if (success) {
      toast({
        title: "Etiqueta 'Nuevo' Actualizada",
        description: `El producto "${unslugify(product.name)}" ${!product.is_new ? 'ahora es nuevo' : 'ya no es nuevo'}.`,
      });
    }
  };

  const handleStockUpdateChange = (key: string, value: string) => {
      setStockUpdates(prev => ({ ...prev, [key]: value }));
  };

  const handleBulkStockUpdate = useCallback(async () => {
    console.log("Starting bulk stock update...");
    console.log("Current stockUpdates state:", stockUpdates);
    console.log("Current products list:", productsRef.current);

    const updatesToProcess = Object.entries(stockUpdates).filter(
      ([, value]) => value && parseInt(value, 10) > 0
    );

    if (updatesToProcess.length === 0) {
      toast({
        title: 'Sin cambios',
        description: 'No se ingresaron cantidades para actualizar.',
      });
      return;
    }
    
    const pedidoId = crypto.randomUUID();
    const historyEntries: Omit<StockHistory, 'id' | 'created_at'>[] = [];
    const productUpdatesMap = new Map<string, Product>();
    const skippedItems: string[] = [];
  
    for (const [key, value] of updatesToProcess) {
      const lastHyphenIndex = key.lastIndexOf('-');
      const productId = key.substring(0, lastHyphenIndex);
      const colorHex = key.substring(lastHyphenIndex + 1);
      const quantityAdded = parseInt(value as string, 10);
      
      console.log(`Processing key: ${key}, productId: ${productId}, colorHex: ${colorHex}`);
      
      const product = productsRef.current.find((p) => p.id === productId);
      
      if (!product) {
        console.error(`Could not find product for key: ${key}`);
        skippedItems.push(`Producto ID: ${productId.substring(0, 8)}...`);
        continue;
      }
      
      const color = product.colors.find((c) => c.hex === colorHex);
      
      if (!color) {
        console.error(`Could not find color for key: ${key}`);
        skippedItems.push(`${product.name} - Color ${colorHex}`);
        continue;
      }
  
      historyEntries.push({
        pedido_id: pedidoId,
        product_id: product.id,
        product_name: product.name,
        product_model: product.model,
        color_name: color.name,
        quantity_added: quantityAdded,
        cost: product.cost,
        price: product.price,
      });
  
      const updatedProduct = productUpdatesMap.get(productId) || JSON.parse(JSON.stringify(product));
      
      const colorToUpdate = updatedProduct.colors.find((c: ProductColor) => c.hex === colorHex);
      if (colorToUpdate) {
        colorToUpdate.stock += quantityAdded;
      }
      productUpdatesMap.set(productId, updatedProduct);
    }

    if (historyEntries.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No se pudo actualizar el stock',
        description: `Todos los productos seleccionados no existen o han sido eliminados. Items omitidos: ${skippedItems.join(', ')}`,
      });
      setStockUpdates({});
      return;
    }
    
    try {
      const { error: historyError } = await supabase
        .from('stock_history')
        .insert(historyEntries);
  
      if (historyError) {
        throw new Error(`Error al guardar el historial: ${historyError.message}`);
      }
  
      for (const [productId, updatedProduct] of productUpdatesMap.entries()) {
        const { error: productError } = await supabase
          .from('products')
          .update({ colors: updatedProduct.colors })
          .eq('id', productId);
  
        if (productError) {
          throw new Error(`Error al actualizar el producto ${productId}: ${productError.message}`);
        }
      }

      const successMessage = `Se actualizó el stock de ${historyEntries.length} item(s) en el pedido #${pedidoId.substring(0, 4)}.`;
      const warningMessage = skippedItems.length > 0 ? ` ${skippedItems.length} item(s) fueron omitidos.` : '';
  
      toast({
        title: 'Stock actualizado',
        description: successMessage + warningMessage,
      });
  
      await fetchProducts();
      await fetchStockHistory();
      setIsStockUpdateDialogOpen(false);
      setStockUpdates({});
    } catch (error: any) {
      console.error('Error during bulk stock update:', error);
      toast({
        variant: 'destructive',
        title: 'Error al Actualizar Stock',
        description: `Ocurrió un error: ${error.message}`,
      });
    }
  }, [stockUpdates, fetchProducts, fetchStockHistory, supabase, toast]);

  const handleMobileStockInputChange = (key: string, value: string) => {
    setMobileStockInputs(prev => ({ ...prev, [key]: value }));
  };

  const handleMobileStockUpdate = async (product: Product, color: ProductColor) => {
    const key = `${product.id}-${color.hex}`;
    const newStockValue = mobileStockInputs[key];
    const newStock = typeof newStockValue === 'string' ? parseInt(newStockValue, 10) : newStockValue;

    if (typeof newStock === 'number' && !isNaN(newStock) && newStock >= 0 && newStock !== color.stock) {
        const updatedColors = product.colors.map(c =>
            c.hex === color.hex ? { ...c, stock: newStock } : c
        );
        const success = await updateProduct(product.id, { colors: updatedColors });
        if (success) {
            toast({
                title: "Stock Actualizado",
                description: `Stock de ${unslugify(product.name)} (${color.name}) ahora es ${newStock}.`,
            });
        }
    } else {
        setMobileStockInputs(prev => ({...prev, [key]: color.stock}));
    }
  };

  useEffect(() => {
    const newStockInputs: Record<string, number> = {};
    products.forEach(p => {
        p.colors.forEach(c => {
            newStockInputs[`${p.id}-${c.hex}`] = c.stock;
        });
    });
    setMobileStockInputs(newStockInputs);
  }, [products]);

  useEffect(() => {
    if (products.length === 0) return;

    const validKeys = new Set<string>();
    products.forEach(product => {
      product.colors.forEach(color => {
        validKeys.add(`${product.id}-${color.hex}`);
      });
    });

    const staleKeys = Object.keys(stockUpdates).filter(key => !validKeys.has(key));
    
    if (staleKeys.length > 0) {
      console.log('Cleaning up stale stock updates:', staleKeys);
      setStockUpdates(prevUpdates => {
        const cleanedUpdates = { ...prevUpdates };
        staleKeys.forEach(key => delete cleanedUpdates[key]);
        return cleanedUpdates;
      });
    }
  }, [products, stockUpdates]);

  const categories = productSchema.shape.category.options;
  
  const nameOptions = useMemo(() => {
    if (!watchedCategory || !subcategories) return [];
    return subcategories[watchedCategory] || [];
  }, [watchedCategory, subcategories]);

  const groupedStockHistory = useMemo(() => {
    if (!stockHistory || stockHistory.length === 0) return [];
  
    const grouped = stockHistory.reduce((acc, entry) => {
      const pedidoId = entry.pedido_id;
      if (!acc[pedidoId]) {
        acc[pedidoId] = {
          entries: [],
          date: new Date(entry.created_at),
          totalCost: 0,
          totalPrice: 0,
        };
      }
      acc[pedidoId].entries.push(entry);
      acc[pedidoId].totalCost += (entry.cost || 0) * entry.quantity_added;
      acc[pedidoId].totalPrice += (entry.price || 0) * entry.quantity_added;
      return acc;
    }, {} as Record<string, { entries: StockHistory[], date: Date, totalCost: number, totalPrice: number }>);
  
    return Object.entries(grouped)
      .sort(([, a], [, b]) => b.date.getTime() - a.date.getTime())
      .map(([pedido_id, { entries, date, totalCost, totalPrice }]) => {
        const profit = totalPrice - totalCost;
        const margin = totalCost > 0 ? (profit / totalCost) * 100 : 0;
        return {
            pedido_id,
            entries,
            date,
            totalCost,
            totalPrice,
            profit,
            margin
        }
      });
  }, [stockHistory]);

  const filteredStockUpdateProducts = useMemo(() => {
    if (!stockUpdateSearchQuery) {
        return products;
    }
    const query = stockUpdateSearchQuery.toLowerCase();
    return products.filter(product => 
        unslugify(product.name).toLowerCase().includes(query) || 
        product.model.toLowerCase().includes(query)
    );
  }, [products, stockUpdateSearchQuery]);

  const isLoading = isLoadingProducts || isLoadingSubcategories || isLoadingModels || isLoadingSales || isLoadingProductHistory || isLoadingStockHistory;

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-9 w-1/4" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-56" />
          </div>
          <div className="border rounded-lg p-4">
            <Skeleton className="h-96 w-full" />
          </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-center mt-8 mb-6 gap-4">
          <h2 className="text-2xl font-bold">Gestión de Productos</h2>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <div className="flex w-full sm:w-auto items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => { setIsProductHistoryDialogOpen(true); }} className="rounded-full">
                    <History className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={handleAddNewProduct} className="flex-grow">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Crear Producto
                </Button>
              </div>
              <div className="flex w-full sm:w-auto items-center gap-2">
                 <Button variant="outline" size="icon" onClick={() => { setIsStockHistoryDialogOpen(true); }} className="rounded-full">
                    <History className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => setIsStockUpdateDialogOpen(true)} className="flex-grow">
                    <PackagePlus className="mr-2 h-4 w-4" />
                    Registrar Pedido
                </Button>
              </div>
              <div className="flex w-full sm:w-auto items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setIsSalesHistoryDialogOpen(true)} className="rounded-full">
                    <History className="h-4 w-4" />
                </Button>
                <Button onClick={handleRegisterSale} className="flex-grow">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Registrar Venta
                </Button>
              </div>
          </div>
      </div>

      <div className="flex flex-col gap-4 mb-4">
        <div className="w-full overflow-x-auto pb-2">
          <Tabs defaultValue="all" onValueChange={(value) => setFilterCategory(value as any)}>
            <TabsList className="min-w-max">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="case">Fundas (iPhone)</TabsTrigger>
              <TabsTrigger value="accessory">Accesorios</TabsTrigger>
              <TabsTrigger value="auriculares">Auriculares</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex flex-col md:flex-row w-full items-center gap-2">
          <div className="relative flex-grow w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9"
            />
          </div>
          <div className="flex w-full md:w-auto gap-2">
            <Select onValueChange={setFilterModel} defaultValue={filterModel}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filtrar por modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los modelos</SelectItem>
                {allModels.map(model => (
                  <SelectItem key={model} value={model}>{model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={setSortBy} defaultValue={sortBy}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
                <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
                <SelectItem value="price-asc">Precio (Menor)</SelectItem>
                <SelectItem value="price-desc">Precio (Mayor)</SelectItem>
                <SelectItem value="stock-asc">Stock (Menor)</SelectItem>
                <SelectItem value="stock-desc">Stock (Mayor)</SelectItem>
                <SelectItem value="date-desc">Fecha (Más nuevo)</SelectItem>
                <SelectItem value="date-asc">Fecha (Más viejo)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="border rounded-lg">
        <div className="hidden md:block">
          <Table>
          <TableHeader>
              <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Colores</TableHead>
              <TableHead>Stock Total</TableHead>
              <TableHead>Fecha de Creación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
          </TableHeader>
          <TableBody>
              {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                  <TableCell className="font-medium py-2 px-4">{unslugify(product.name)}</TableCell>
                  <TableCell className="py-2 px-4">${product.price}</TableCell>
                  <TableCell className="py-2 px-4">{product.category}</TableCell>
                  <TableCell className="py-2 px-4">{product.model}</TableCell>
                  <TableCell className="py-2 px-4">{product.colors.map(c => c.name).join(', ')}</TableCell>
                  <TableCell className="py-2 px-4">{product.colors.reduce((sum, c) => sum + c.stock, 0)}</TableCell>
                  <TableCell className="py-2 px-4">{new Date(product.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right py-2 px-4">
                  <div className="flex items-center justify-end space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleSellProductClick(product)} className="rounded-full">
                          <ShoppingBag className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleToggleNew(product)} className="rounded-full">
                        <Tag className={cn("h-4 w-4", product.is_new ? "text-blue-500 fill-blue-500" : "text-muted-foreground")} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleToggleFeatured(product)} className="rounded-full">
                        <Star className={cn("h-4 w-4", product.featured ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)} className="rounded-full">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive rounded-full">
                          <Trash className="h-4 w-4" />
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                              Esta acción no se puede deshacer. Esto eliminará permanentemente el producto.
                          </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteProduct(product.id)} className="bg-destructive hover:bg-destructive/90">
                              Eliminar
                          </AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                      </AlertDialog>
                  </div>
                  </TableCell>
              </TableRow>
              ))}
          </TableBody>
          </Table>
        </div>
        <div className="md:hidden p-2 space-y-3">
            {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                <Collapsible asChild key={product.id}>
                    <Card className="w-full data-[state=open]:bg-muted/50">
                      <CollapsibleTrigger asChild>
                        <div className="p-4 flex items-start justify-between cursor-pointer">
                            <div className="space-y-1.5 flex-1">
                                <p className="font-bold text-base leading-tight">{unslugify(product.name)}</p>
                                <p className="text-sm text-muted-foreground">{product.model}</p>
                                <div className="flex items-center gap-4 text-sm">
                                    <p className="font-medium text-primary">${product.price}</p>
                                    <p className="text-muted-foreground">Stock: {product.colors.reduce((sum, c) => sum + c.stock, 0)}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full -mt-2 -mr-2 flex-shrink-0 data-[state=open]:rotate-180 transition-transform">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-4 space-y-3">
                            <p className="text-sm font-medium">Inventario por Color:</p>
                            <div className="space-y-2">
                              {product.colors.map(color => (
                                <div key={color.hex} className="flex items-center justify-between text-sm p-2 rounded-md bg-background">
                                  <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: color.hex }} />
                                    <span>{color.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <Button variant="default" size="icon" className="h-8 w-8 rounded-full bg-primary hover:bg-accent"
                                          onClick={() => {
                                              const key = `${product.id}-${color.hex}`;
                                              const currentStock = Number(mobileStockInputs[key] || 0);
                                              handleMobileStockInputChange(key, String(Math.max(0, currentStock - 1)));
                                              handleMobileStockUpdate(product, {...color, stock: Math.max(0, currentStock - 1)});
                                          }}>
                                          <Minus className="h-4 w-4" />
                                      </Button>
                                      <Input
                                          type="number"
                                          value={mobileStockInputs[`${product.id}-${color.hex}`] ?? ''}
                                          onChange={(e) => handleMobileStockInputChange(`${product.id}-${color.hex}`, e.target.value)}
                                          onBlur={() => handleMobileStockUpdate(product, color)}
                                          onKeyDown={(e) => e.key === 'Enter' && handleMobileStockUpdate(product, color)}
                                          className="w-16 h-8 text-center font-medium"
                                      />
                                      <Button variant="default" size="icon" className="h-8 w-8 rounded-full bg-primary hover:bg-accent"
                                        onClick={() => {
                                            const key = `${product.id}-${color.hex}`;
                                            const currentStock = Number(mobileStockInputs[key] || 0);
                                            handleMobileStockInputChange(key, String(currentStock + 1));
                                            handleMobileStockUpdate(product, {...color, stock: currentStock + 1});
                                        }}>
                                          <Plus className="h-4 w-4" />
                                      </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                        </div>
                      </CollapsibleContent>
                      <CardContent className="p-3 border-t flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleSellProductClick(product)} className="rounded-full h-8 w-8">
                                <ShoppingBag className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleToggleNew(product)} className="rounded-full h-8 w-8">
                                <Tag className={cn("h-4 w-4", product.is_new ? "text-blue-500 fill-blue-500" : "text-muted-foreground")} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleToggleFeatured(product)} className="rounded-full h-8 w-8">
                                <Star className={cn("h-4 w-4", product.featured ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)} className="rounded-full h-8 w-8">
                                <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive rounded-full h-8 w-8">
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción no se puede deshacer. Esto eliminará permanentemente el producto.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteProduct(product.id)} className="bg-destructive hover:bg-destructive/90">
                                        Eliminar
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                      </CardContent>
                    </Card>
                </Collapsible>
            )) : (
                <p className="text-muted-foreground text-center p-8">No se encontraron productos.</p>
            )}
        </div>
      </div>
      
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Producto' : 'Crear Producto'}</DialogTitle>
            <DialogDescription>
                {editingProduct ? 'Modifica los detalles del producto.' : 'Completa el formulario para agregar un nuevo producto.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onProductSubmit, (formErrors) => {
            console.error("Form validation errors:", formErrors);
            toast({ 
              variant: 'destructive', 
              title: "Error de Validación", 
              description: "Por favor, revisa los campos marcados en rojo."
            });
          })} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                <Label className="md:text-right">Categoría</Label>
                <div className="md:col-span-3">
                  <Controller
                      control={control}
                      name="category"
                      render={({ field }) => (
                          <Select
                            onValueChange={(value) => {
                              const newCategory = value as 'case' | 'accessory' | 'auriculares';
                              field.onChange(newCategory);
                              setValue('name', '');
                              if (newCategory === 'case') {
                                  setValue('model', 'iPhone 15');
                              } else { 
                                  setValue('model', 'Universal');
                              }
                            }}
                            value={field.value}
                          >
                              <SelectTrigger>
                                  <SelectValue placeholder="Selecciona categoría" />
                              </SelectTrigger>
                              <SelectContent>
                                  {categories.map(cat => <SelectItem key={cat} value={cat}>{unslugify(cat)}</SelectItem>)}
                              </SelectContent>
                          </Select>
                      )}
                  />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
              <Label htmlFor="name" className="md:text-right">Nombre</Label>
              <div className="md:col-span-3">
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!watchedCategory || nameOptions.length === 0}
                    >
                      <SelectTrigger id="name">
                        <SelectValue placeholder="Seleccionar nombre" />
                      </SelectTrigger>
                      <SelectContent>
                        {nameOptions.map(sub => <SelectItem key={sub} value={sub}>{unslugify(sub)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              {errors.name && <p className="md:col-span-3 md:col-start-2 text-red-500 text-sm">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-2">
                    <Label htmlFor="cost" className="md:text-right">Costo</Label>
                    <Input id="cost" type="number" step="1" {...register('cost')} />
                    {errors.cost && <p className="md:col-span-2 text-red-500 text-sm">{errors.cost.message}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-2">
                    <Label htmlFor="price" className="md:text-right">Precio</Label>
                    <Input id="price" type="number" step="1" {...register('price')} />
                    {errors.price && <p className="md:col-span-2 text-red-500 text-sm">{errors.price.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-4">
                <Label className="md:text-right pt-2">Imagen de Portada</Label>
                <div className="md:col-span-3">
                    <Controller
                        name="coverImage"
                        control={control}
                        render={({ field: { onChange, value, name, ref } }) => (
                            <div className="flex flex-col gap-3">
                                <label
                                    htmlFor="cover-image-upload-input"
                                    className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-card"
                                >
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-muted-foreground">
                                            <span className="font-semibold">Click para subir</span> o arrastra y suelta
                                        </p>
                                        <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (MAX. 5MB)</p>
                                    </div>
                                    <input
                                        id="cover-image-upload-input"
                                        type="file"
                                        className="hidden"
                                        accept="image/png, image/jpeg, image/webp"
                                        ref={ref}
                                        name={name}
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                onChange(e.target.files[0]);
                                            }
                                        }}
                                    />
                                </label>

                                <div className="relative flex items-center">
                                    <div className="flex-grow border-t border-muted"></div>
                                    <span className="flex-shrink mx-2 text-muted-foreground text-xs">O</span>
                                    <div className="flex-grow border-t border-muted"></div>
                                </div>

                                <Input
                                    placeholder="Pega una URL de imagen aquí..."
                                    value={typeof value === 'string' ? value : ''}
                                    onChange={(e) => onChange(e.target.value)}
                                    disabled={value instanceof File}
                                />
                                {coverImagePreview && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <div className="relative w-10 h-10 rounded-md overflow-hidden border flex-shrink-0">
                                        <Image src={coverImagePreview} alt="Thumbnail de portada" fill className="object-cover"/>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" className="flex-grow" onClick={() => setPreviewDialogUrl(coverImagePreview)}>Ver Previa</Button>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="h-9 w-9 flex-shrink-0 rounded-full"
                                        onClick={() => {
                                            onChange('');
                                            setCoverImagePreview(null);
                                        }}
                                    >
                                        <X className="h-4 w-4"/>
                                    </Button>
                                  </div>
                                )}
                            </div>
                        )}
                    />
                    {errors.coverImage && <p className="text-red-500 text-sm mt-1">{typeof errors.coverImage.message === 'string' ? errors.coverImage.message : ''}</p>}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                <Label className="md:text-right">Modelo</Label>
                <div className="md:col-span-3">
                  <Controller
                      control={control}
                      name="model"
                      render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                  <SelectValue placeholder="Selecciona modelo" />
                              </SelectTrigger>
                              <SelectContent>
                                  {(() => {
                                      if (watchedCategory === 'case') return caseModels.map(mod => <SelectItem key={mod} value={mod}>{mod}</SelectItem>);
                                      if (watchedCategory === 'accessory') return accessoryModels.map(mod => <SelectItem key={mod} value={mod}>{mod}</SelectItem>);
                                      if (watchedCategory === 'auriculares') return auricularesModels.map(mod => <SelectItem key={mod} value={mod}>{mod}</SelectItem>);
                                      return [];
                                  })()}
                              </SelectContent>
                          </Select>
                      )}
                  />
                </div>
            </div>
            
            <div>
              <Label>Colores</Label>
              {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-y-2 gap-x-2 items-start mt-2 p-2 border rounded-md">
                      <div className="md:col-span-3">
                        <Label htmlFor={`colors.${index}.name`} className="text-xs text-muted-foreground">Nombre</Label>
                        <Input id={`colors.${index}.name`} {...register(`colors.${index}.name`)} placeholder="Ej: Azul Sierra" className="mt-1" />
                        {errors.colors?.[index]?.name && <p className="text-red-500 text-xs mt-1">{errors.colors[index].name.message}</p>}
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor={`colors.${index}.hex`} className="text-xs text-muted-foreground">Hex</Label>
                        <Input id={`colors.${index}.hex`} {...register(`colors.${index}.hex`)} placeholder="#000000" className="mt-1"/>
                        {errors.colors?.[index]?.hex && <p className="text-red-500 text-xs mt-1">{errors.colors[index].hex.message}</p>}
                      </div>
                      <div className="md:col-span-4">
                          <Label className="text-xs text-muted-foreground">Imagen</Label>
                          <ColorImageInput control={control} index={index} errors={errors} setPreviewDialogUrl={setPreviewDialogUrl} />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                          <Label htmlFor={`colors.${index}.stock`} className="text-xs text-muted-foreground">Stock</Label>
                          <Input id={`colors.${index}.stock`} type="number" {...register(`colors.${index}.stock`)} placeholder="Stock" />
                          {errors.colors?.[index]?.stock && <p className="text-red-500 text-xs mt-1">{errors.colors[index].stock.message}</p>}
                      </div>
                      <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="md:col-span-1 justify-self-center self-center rounded-full">
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                      </Button>
                  </div>
              ))}
                {errors.colors && <p className="text-red-500 text-sm mt-1">{errors.colors.message || errors.colors.root?.message}</p>}
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ name: 'Nuevo Color', hex: '#FFFFFF', image: '/Cover.png?v=3', stock: 0 })}>
                  <PlusCircle className="mr-2 h-4 w-4"/> Añadir Color
              </Button>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancelar</Button>
              </DialogClose>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isSaleDialogOpen} onOpenChange={setIsSaleDialogOpen}>
          <DialogContent className="sm:max-w-md">
              <DialogHeader>
                  <DialogTitle>Registrar Venta de Producto</DialogTitle>
                  <DialogDescription>
                      Filtra para encontrar el producto y luego registra la venta para actualizar el stock.
                  </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitSale(onSaleSubmit)} className="grid gap-4 py-4">
                  <div className="space-y-2">
                      <Label htmlFor="sale-category">Categoría</Label>
                      <Select
                          value={saleFilters.category}
                          onValueChange={(value) => {
                              setSaleFilters({ category: value, name: 'all', model: 'all' });
                              setSaleValue('productId', '');
                          }}
                      >
                          <SelectTrigger id="sale-category">
                              <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">Todas las categorías</SelectItem>
                              {saleCategoryOptions.map(cat => (
                                  <SelectItem key={cat} value={cat}>{unslugify(cat)}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>

                  <div className="space-y-2">
                      <Label htmlFor="sale-name">Nombre</Label>
                      <Select
                          value={saleFilters.name}
                          onValueChange={(value) => {
                              setSaleFilters(f => ({ ...f, name: value, model: 'all' }));
                              setSaleValue('productId', '');
                          }}
                          disabled={saleFilters.category === 'all'}
                      >
                          <SelectTrigger id="sale-name">
                              <SelectValue placeholder="Seleccionar nombre" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">Todos los nombres</SelectItem>
                              {saleNameOptions.map(name => (
                                  <SelectItem key={name} value={name}>{unslugify(name)}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
                  
                  <div className="space-y-2">
                      <Label htmlFor="sale-model">Modelo</Label>
                      <Select
                          value={saleFilters.model}
                          onValueChange={(value) => {
                              setSaleFilters(f => ({ ...f, model: value }));
                              setSaleValue('productId', '');
                          }}
                          disabled={saleFilters.name === 'all'}
                      >
                          <SelectTrigger id="sale-model">
                              <SelectValue placeholder="Seleccionar modelo" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">Todos los modelos</SelectItem>
                              {saleModelOptions.map(model => (
                                  <SelectItem key={model} value={model}>{model}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>

                  <hr className="my-2" />
                  
                  <div className="space-y-2">
                      <Label htmlFor="productId">Seleccionar Producto Final</Label>
                      <Controller
                          name="productId"
                          control={controlSale}
                          render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value} disabled={saleDialogProducts.length === 0}>
                                  <SelectTrigger id="productId">
                                      <SelectValue placeholder="Seleccionar producto de la lista" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {saleDialogProducts.map(p => (
                                          <SelectItem key={p.id} value={p.id}>{`${unslugify(p.name)} (${p.model})`}</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          )}
                      />
                      {saleDialogProducts.length === 0 && saleFilters.category !== 'all' && (
                          <p className="text-sm text-muted-foreground">No hay productos con los filtros seleccionados.</p>
                      )}
                      {errorsSale.productId && <p className="text-red-500 text-sm">{errorsSale.productId.message}</p>}
                  </div>

                  {saleProduct && (
                      <div className="space-y-2">
                          <Label htmlFor="colorHex">Color</Label>
                          <Controller
                              name="colorHex"
                              control={controlSale}
                              render={({ field }) => (
                                  <Select onValueChange={field.onChange} value={field.value}>
                                      <SelectTrigger id="colorHex">
                                          <SelectValue placeholder="Seleccionar color" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          {saleProduct.colors.map(c => (
                                              <SelectItem key={c.hex} value={c.hex} disabled={c.stock === 0}>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: c.hex }} />
                                                    <span>{c.name} (Stock: {c.stock})</span>
                                                </div>
                                              </SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                              )}
                          />
                          {errorsSale.colorHex && <p className="text-red-500 text-sm">{errorsSale.colorHex.message}</p>}
                      </div>
                  )}
              
                  <div className="space-y-2">
                      <Label htmlFor="quantity">Cantidad</Label>
                      <Input 
                          id="quantity" 
                          type="number" 
                          min="1"
                          {...registerSale('quantity')} 
                          disabled={!watchSale('colorHex')}
                      />
                      {errorsSale.quantity && <p className="text-red-500 text-sm">{errorsSale.quantity.message}</p>}
                  </div>
                  
                  <DialogFooter>
                      <DialogClose asChild>
                          <Button type="button" variant="secondary">Cancelar</Button>
                      </DialogClose>
                      <Button type="submit" disabled={!saleProduct || !watchSale('colorHex')}>Confirmar Venta</Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
      <Dialog open={isSalesHistoryDialogOpen} onOpenChange={setIsSalesHistoryDialogOpen}>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>Historial de Ventas</DialogTitle>
                <DialogDescription>
                    Aquí puedes ver todas las ventas registradas.
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Producto</TableHead>
                            <TableHead>Modelo</TableHead>
                            <TableHead>Color</TableHead>
                            <TableHead className="text-center">Cantidad</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sales.length > 0 ? sales.map(sale => (
                            <TableRow key={sale.id}>
                                <TableCell>{new Date(sale.created_at).toLocaleString()}</TableCell>
                                <TableCell>{unslugify(sale.product_name)}</TableCell>
                                <TableCell>{sale.product_model}</TableCell>
                                <TableCell>{sale.color_name}</TableCell>
                                <TableCell className="text-center">{sale.quantity}</TableCell>
                                <TableCell className="text-right">${sale.total_price}</TableCell>
                            </TableRow>
                        )) : (
                          <TableRow>
                              <TableCell colSpan={6} className="text-center h-24">No hay ventas registradas.</TableCell>
                          </TableRow>
                        )}
                    </TableBody>
                </Table>
            </ScrollArea>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cerrar</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isProductHistoryDialogOpen} onOpenChange={setIsProductHistoryDialogOpen}>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>Historial de Ingresos de Productos</DialogTitle>
                <DialogDescription>
                    Aquí puedes ver todos los productos que has creado.
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Producto</TableHead>
                            <TableHead>Modelo</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="text-center">Stock Inicial</TableHead>
                            <TableHead className="text-right">Precio</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {productHistory.length > 0 ? productHistory.map(entry => (
                            <TableRow key={entry.id}>
                                <TableCell>{new Date(entry.created_at).toLocaleString()}</TableCell>
                                <TableCell>{unslugify(entry.product_name)}</TableCell>
                                <TableCell>{entry.product_model}</TableCell>
                                <TableCell>{entry.product_category}</TableCell>
                                <TableCell className="text-center">{entry.initial_stock}</TableCell>
                                <TableCell className="text-right">${entry.price}</TableCell>
                            </TableRow>
                        )) : (
                          <TableRow>
                              <TableCell colSpan={6} className="text-center h-24">No hay productos creados.</TableCell>
                          </TableRow>
                        )}
                    </TableBody>
                </Table>
            </ScrollArea>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cerrar</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>
       <Dialog open={!!previewDialogUrl} onOpenChange={(open) => !open && setPreviewDialogUrl(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Vista Previa de Imagen</DialogTitle>
            </DialogHeader>
            {previewDialogUrl &&
                <div className="relative w-full aspect-[3/5] rounded-md overflow-hidden border">
                    <Image src={previewDialogUrl} alt="Vista previa" fill className="object-cover"/>
                </div>
            }
        </DialogContent>
      </Dialog>
      <Dialog open={isStockUpdateDialogOpen} onOpenChange={(isOpen) => { setIsStockUpdateDialogOpen(isOpen); if (!isOpen) setStockUpdateSearchQuery(''); }}>
          <DialogContent className="max-w-4xl">
              <DialogHeader>
                  <DialogTitle>Registrar Ingreso de Pedido</DialogTitle>
                  <DialogDescription>
                      Añade la cantidad de unidades nuevas que ingresaron para cada color. El número se sumará al stock actual.
                  </DialogDescription>
                  <div className="relative pt-4">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar producto por nombre o modelo..."
                      value={stockUpdateSearchQuery}
                      onChange={(e) => setStockUpdateSearchQuery(e.target.value)}
                      className="w-full pl-9"
                    />
                  </div>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] -mx-6 px-6">
                  <div className="space-y-4 py-4">
                      {filteredStockUpdateProducts.map(product => (
                          <Collapsible key={product.id} className="border-b pb-4">
                              <CollapsibleTrigger className="w-full flex justify-between items-center py-2 font-semibold">
                                  <span>{unslugify(product.name)} ({product.model})</span>
                                  <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180"/>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="space-y-3 pt-2">
                                  {product.colors.map(color => (
                                      <div key={color.hex} className="grid grid-cols-3 items-center gap-4">
                                          <div className="flex items-center gap-2">
                                              <div className="h-5 w-5 rounded-full border" style={{ backgroundColor: color.hex }}/>
                                              <Label htmlFor={`${product.id}-${color.hex}`}>{color.name} (Actual: {color.stock})</Label>
                                          </div>
                                          <div className="flex items-center gap-2">
                                                <Button 
                                                    variant="outline"
                                                    size="icon" 
                                                    className="h-8 w-8 rounded-full"
                                                    onClick={() => {
                                                        const key = `${product.id}-${color.hex}`;
                                                        const currentValue = parseInt(stockUpdates[key] || '0', 10);
                                                        handleStockUpdateChange(key, String(Math.max(0, currentValue - 1)));
                                                    }}
                                                >
                                                  <Minus className="h-4 w-4" />
                                                </Button>
                                                <Input
                                                  id={`${product.id}-${color.hex}`}
                                                  type="number"
                                                  placeholder="0"
                                                  className="w-20 text-center"
                                                  value={stockUpdates[`${product.id}-${color.hex}`] || ''}
                                                  onChange={(e) => handleStockUpdateChange(`${product.id}-${color.hex}`, e.target.value)}
                                                />
                                                <Button 
                                                    variant="outline"
                                                    size="icon" 
                                                    className="h-8 w-8 rounded-full"
                                                    onClick={() => {
                                                        const key = `${product.id}-${color.hex}`;
                                                        const currentValue = parseInt(stockUpdates[key] || '0', 10);
                                                        handleStockUpdateChange(key, String(currentValue + 1));
                                                    }}
                                                >
                                                  <Plus className="h-4 w-4" />
                                                </Button>
                                          </div>
                                      </div>
                                  ))}
                              </CollapsibleContent>
                          </Collapsible>
                      ))}
                  </div>
              </ScrollArea>
              <DialogFooter>
                  <DialogClose asChild>
                      <Button type="button" variant="secondary">Cancelar</Button>
                  </DialogClose>
                  <Button onClick={handleBulkStockUpdate}>Guardar Cambios</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      <Dialog open={isStockHistoryDialogOpen} onOpenChange={setIsStockHistoryDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Historial de Pedidos</DialogTitle>
            <DialogDescription>
              Aquí puedes ver todos los ingresos de stock, agrupados por pedido.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] my-4">
            <div className="space-y-6">
              {groupedStockHistory.length > 0 ? (
                groupedStockHistory.map(({ pedido_id, entries, date, totalCost, totalPrice, profit, margin }, index) => (
                  <div key={pedido_id}>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                        <h3 className="font-semibold text-base">
                        Pedido #{groupedStockHistory.length - index}
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                            ({date.toLocaleString()})
                        </span>
                        </h3>
                    </div>
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead>Modelo</TableHead>
                            <TableHead>Color</TableHead>
                            <TableHead className="text-right">Costo</TableHead>
                            <TableHead className="text-right">Precio</TableHead>
                            <TableHead className="text-right">Cantidad</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {entries.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell>{unslugify(entry.product_name)}</TableCell>
                              <TableCell>{entry.product_model}</TableCell>
                              <TableCell>{entry.color_name}</TableCell>
                              <TableCell className="text-right">${entry.cost || 0}</TableCell>
                              <TableCell className="text-right">${entry.price || 0}</TableCell>
                              <TableCell className="text-right font-medium text-primary">
                                +{entry.quantity_added}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="p-4 bg-muted/50 rounded-b-lg grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-medium">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Costo Total</p>
                            <p>${totalCost.toLocaleString()}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Ingreso Total</p>
                            <p>${totalPrice.toLocaleString()}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Ganancia</p>
                            <p className="text-green-600">${profit.toLocaleString()}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Margen</p>
                            <p className="text-primary">{margin.toFixed(2)}%</p>
                          </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-16">
                  No hay pedidos registrados en el historial.
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cerrar
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
