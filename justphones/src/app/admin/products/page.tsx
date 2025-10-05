
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
import { Trash, Edit, PlusCircle, ShoppingBag, Search, PartyPopper, Star, UploadCloud, X, Tag, History, ChevronDown, Plus, Minus, PackagePlus, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProductsR2 as useProducts } from '@/hooks/use-products-r2';
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
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { Checkbox } from '@/components/ui/checkbox';
import type { DiscountCodeValidationResult } from '@/lib/discount-codes';

const PRODUCT_ASPECT = 3 / 5;

// Opciones de método de pago para ventas
const paymentMethodOptions = {
  cash: { label: 'Efectivo', discount: 0.2 },
  transfer: { label: 'Transferencia', discount: 0.2 },
  card: { label: 'Tarjeta (Lista)', discount: 0 },
};

const imageFieldSchema = z.any().optional().refine(val => 
    val === undefined ||
    val === '' ||
    val instanceof File ||
    (typeof val === 'string' && val.startsWith('http')), {
    message: "Debe ser un archivo válido o una URL que comience con http."
});

const colorSchema = z.object({
  name: z.string().min(1, "El nombre del color es requerido."),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Código hex inválido"),
  image: imageFieldSchema,
  stock: z.coerce.number().min(0, "El stock no puede ser negativo"),
});

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre es requerido."),
  cost: z.coerce.number().min(0, "El costo debe ser positivo"),
  price: z.coerce.number().min(0, "El precio debe ser positivo"),
  discount: z.coerce.number().min(0, "El descuento no puede ser negativo.").default(0).optional(),
  coverImage: imageFieldSchema,
  coverImages: z.array(imageFieldSchema).optional(),
  category: z.enum(['case', 'accessory', 'auriculares'], {
    errorMap: () => ({ message: "Categoría debe ser: case, accessory o auriculares" })
  }),
  model: z.string().min(1, "Debe seleccionar al menos un modelo."),
  featured: z.boolean().nullable().transform(val => val ?? false).optional(),
  is_new: z.boolean().nullable().transform(val => val ?? false).optional(),
  colors: z.array(colorSchema).min(1, "Al menos un color es requerido"),
  created_at: z.string().optional(),
});
const productFormSchema = productSchema.omit({ id: true, created_at: true });

const saleSchema = z.object({
  productId: z.string().min(1, "Debe seleccionar un producto."),
  colorHex: z.string().min(1, "Debe seleccionar un color."),
  quantity: z.coerce.number().min(1, "La cantidad debe ser al menos 1."),
  discount_code: z.string().optional(),
});

function getCroppedImg(image: HTMLImageElement, crop: Crop, fileName: string): Promise<File> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
      return Promise.reject(new Error('Could not get canvas context.'));
  }

  const pixelRatio = window.devicePixelRatio;
  canvas.width = crop.width * pixelRatio;
  canvas.height = crop.height * pixelRatio;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
  );

  return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
          if (!blob) {
              reject(new Error('Canvas to Blob conversion failed.'));
              return;
          }
          const file = new File([blob], fileName, { type: 'image/png' });
          resolve(file);
      }, 'image/png', 1);
  });
}

const ColorImageInput = ({ control, index, errors, onFileSelect, setPreviewDialogUrl, setValue }: { control: any; index: number; errors: any; onFileSelect: (file: File, fieldIndex: number) => void; setPreviewDialogUrl: (url: string) => void; setValue: any }) => {
    const value = useWatch({ control, name: `colors.${index}.image` });
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
    const [urlInputValue, setUrlInputValue] = React.useState('');

    React.useEffect(() => {
        // Clean up previous blob URL
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        
        if (value instanceof File) {
            setPreviewUrl(URL.createObjectURL(value));
            setUrlInputValue('');
        } else if (typeof value === 'string' && value) {
            setPreviewUrl(value);
            setUrlInputValue(value);
        } else {
            setPreviewUrl(null);
            setUrlInputValue('');
        }
        
        // Cleanup function
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [value]);
    
    return (
        <div className="flex flex-col gap-2 mt-1">
            <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">Subir</TabsTrigger>
                    <TabsTrigger value="url">URL</TabsTrigger>
                </TabsList>
                <TabsContent value="upload">
                    <label htmlFor={`color-image-upload-${index}`} className="relative flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-card mt-2">
                        <UploadCloud className="w-6 h-6 mb-1 text-muted-foreground" />
                        <p className="text-xs text-center text-muted-foreground">Click o arrastrar</p>
                        <input
                            id={`color-image-upload-${index}`}
                            type="file"
                            className="hidden"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    onFileSelect(e.target.files[0], index);
                                }
                            }}
                        />
                    </label>
                </TabsContent>
                <TabsContent value="url">
                    <div className="pt-2 space-y-2">
                        <Input
                            id={`color_url_input-${index}`}
                            placeholder="https://ejemplo.com/imagen.png"
                            value={urlInputValue}
                            onChange={(e) => {
                                setUrlInputValue(e.target.value);
                                setValue(`colors.${index}.image`, e.target.value, { shouldValidate: true });
                            }}
                        />
                    </div>
                </TabsContent>
            </Tabs>
            
            {previewUrl && (
                <div className="flex items-center gap-2 mt-2">
                    <div className="relative w-10 h-10 rounded-md overflow-hidden border flex-shrink-0">
                        <Image src={previewUrl} alt={`Thumbnail ${index}`} fill className="object-cover" unoptimized={true} />
                    </div>
                    <Button type="button" variant="outline" size="sm" className="flex-grow" onClick={() => setPreviewDialogUrl(previewUrl)}>Ver Previa</Button>
                    <Button type="button" variant="destructive" size="icon" className="h-9 w-9 flex-shrink-0 rounded-full" onClick={() => setValue(`colors.${index}.image`, '')}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
            
            {errors?.colors?.[index]?.image && <p className="text-red-500 text-xs mt-1">{typeof errors.colors[index].image.message === 'string' ? errors.colors[index].image.message : ''}</p>}
        </div>
    )
}

export default function AdminProductsPage() {
  const supabase = createClient();
  const { products, addProduct, updateProduct, deleteProduct, isLoading: isLoadingProducts, fetchProducts, getProductById, uploadCoverImage, uploadColorImage } = useProducts();
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
  const [isSavingStockUpdate, setIsSavingStockUpdate] = useState(false);

  const [mobileStockInputs, setMobileStockInputs] = useState<Record<string, string | number>>({});

  const [saleFilters, setSaleFilters] = useState({
    category: 'all',
    name: 'all',
    model: 'all',
  });

  // Estados para validación de código de descuento
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    name: string;
    percentage: number;
    isApplied: boolean;
  } | null>(null);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [coverImageUrlInput, setCoverImageUrlInput] = useState('');
  const [coverImagesPreviews, setCoverImagesPreviews] = useState<string[]>([]);
  const [previewDialogUrl, setPreviewDialogUrl] = useState<string | null>(null);

  const [isSalesHistoryDialogOpen, setIsSalesHistoryDialogOpen] = useState(false);
  const [isProductHistoryDialogOpen, setIsProductHistoryDialogOpen] = useState(false);
  const [isStockHistoryDialogOpen, setIsStockHistoryDialogOpen] = useState(false);

  // Edit/delete pedido (stock order) state
  const [isEditPedidoOpen, setIsEditPedidoOpen] = useState(false);
  const [pedidoEditingId, setPedidoEditingId] = useState<string | null>(null);
  const [pedidoEditingEntries, setPedidoEditingEntries] = useState<StockHistory[]>([]);
  const [pedidoQuantities, setPedidoQuantities] = useState<Record<string, number>>({}); // key: stock_history.id -> new qty
  const [pedidoCosts, setPedidoCosts] = useState<Record<string, string>>({}); // key: stock_history.id -> new cost (string for controlled input)
  const [isSavingPedidoEdit, setIsSavingPedidoEdit] = useState(false);
  const [isDeletingPedido, setIsDeletingPedido] = useState(false);

  // Cropping state
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [imgSrc, setImgSrc] = useState('');
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [activeCropField, setActiveCropField] = useState<{ type: 'cover' | 'color' | 'coverImage', index?: number } | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);


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
      discount: 0,
      coverImage: '',
      coverImages: [],
      category: 'case',
      model: '',
      colors: [{ name: 'Negro', hex: '#000000', image: '', stock: 0 }],
      featured: false,
      is_new: false,
    },
  });

  const watchedCategory = watch("category");
  const watchedCoverImage = watch('coverImage');
  const watchedCoverImages = watch('coverImages');

  const { fields, append, remove } = useFieldArray({
    control,
    name: "colors",
  });
  
  const { 
    fields: coverImagesFields, 
    append: appendCoverImage, 
    remove: removeCoverImage 
  } = useFieldArray({
    control,
    name: "coverImages",
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
      discount_code: '',
    },
  });


  const watchedSaleProductId = watchSale('productId');
 
  useEffect(() => {
    // Clean up previous blob URL
    if (coverImagePreview && coverImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(coverImagePreview);
    }
    
    if (watchedCoverImage instanceof File) {
        setCoverImagePreview(URL.createObjectURL(watchedCoverImage));
        setCoverImageUrlInput('');
    } else if (typeof watchedCoverImage === 'string' && watchedCoverImage) {
        setCoverImagePreview(watchedCoverImage);
        setCoverImageUrlInput(watchedCoverImage);
    } else {
        setCoverImagePreview(null);
        setCoverImageUrlInput('');
    }
    
    // Cleanup function to revoke blob URL when component unmounts
    return () => {
        if (coverImagePreview && coverImagePreview.startsWith('blob:')) {
            URL.revokeObjectURL(coverImagePreview);
        }
    };
  }, [watchedCoverImage]);

  // Manejar las previews de las múltiples imágenes de portada
  useEffect(() => {
    // Limpiar URLs blob anteriores
    const previousPreviews = coverImagesPreviews.slice(); // Hacer una copia
    previousPreviews.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });

    if (watchedCoverImages && Array.isArray(watchedCoverImages)) {
      const newPreviews = watchedCoverImages.map(image => {
        if (image instanceof File) {
          return URL.createObjectURL(image);
        } else if (typeof image === 'string' && image) {
          return image;
        }
        return '';
      }).filter(Boolean);
      
      setCoverImagesPreviews(newPreviews);
    } else {
      setCoverImagesPreviews([]);
    }

    // Cleanup function
    return () => {
      // No hacer cleanup aquí ya que se hace al inicio del próximo efecto
    };
  }, [watchedCoverImages]);


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

  const cleanupBlobUrls = () => {
    // Clean up cover image blob URL
    if (coverImagePreview && coverImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(coverImagePreview);
    }
    // Clean up cover images blob URLs
    coverImagesPreviews.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  };

  const handleAddNewProduct = () => {
    cleanupBlobUrls();
    reset({
      name: '',
      price: 0,
      cost: 0,
      discount: 0,
      coverImage: '',
      coverImages: [],
      category: 'case',
      model: '',
      colors: [{ name: 'Negro', hex: '#000000', image: '', stock: 0 }],
      featured: false,
      is_new: false,
    });
    setEditingProduct(null);
    setCoverImagePreview(null);
    setCoverImageUrlInput('');
    setCoverImagesPreviews([]);
    setIsProductDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    reset({
      ...product,
      discount: product.discount || 0,
      featured: product.featured ?? false,
      is_new: product.is_new ?? false,
      coverImages: product.coverImages || [],
    });
    setEditingProduct(product);
    setCoverImagePreview(product.coverImage);
    setCoverImageUrlInput(product.coverImage);
    
    // Establecer previews para las imágenes adicionales
    if (product.coverImages && product.coverImages.length > 0) {
      setCoverImagesPreviews(product.coverImages);
    } else {
      setCoverImagesPreviews([]);
    }
    
    setIsProductDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    const success = await deleteProduct(productId);
    if(success) toast({ title: "Producto eliminado", description: "El producto ha sido eliminado exitosamente." });
  };

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
      const { width, height } = e.currentTarget;
      setCrop(centerCrop(
          makeAspectCrop({ unit: '%', width: 90 }, PRODUCT_ASPECT, width, height),
          width,
          height
      ));
  }

  const handleFileSelect = (file: File, type: 'cover' | 'color' | 'coverImage', index?: number) => {
      setCrop(undefined);
      setActiveCropField({ type, index });
      setOriginalFile(file);
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(file);
      setIsCropperOpen(true);
  };

  const handleCropConfirm = async () => {
      if (!completedCrop || !imgRef.current || !originalFile || !activeCropField) {
          toast({ variant: 'destructive', title: 'Error de recorte', description: 'No se pudo procesar la imagen recortada.' });
          return;
      }
      try {
          const croppedImageFile = await getCroppedImg(imgRef.current, completedCrop, originalFile.name);
          if (activeCropField.type === 'cover') {
              setValue('coverImage', croppedImageFile, { shouldValidate: true });
          } else if (activeCropField.type === 'coverImage' && activeCropField.index !== undefined) {
              setValue(`coverImages.${activeCropField.index}`, croppedImageFile, { shouldValidate: true });
          } else if (activeCropField.type === 'color' && activeCropField.index !== undefined) {
              setValue(`colors.${activeCropField.index}.image`, croppedImageFile, { shouldValidate: true });
          }
          setIsCropperOpen(false);
          setImgSrc('');
          setActiveCropField(null);
      } catch (error) {
          console.error('Error cropping image:', error);
          toast({ variant: 'destructive', title: 'Error', description: 'Ocurrió un error al recortar la imagen.' });
      }
  };


  const onProductSubmit = async (formData: z.infer<typeof productFormSchema>) => {
    console.log("🔍 [PRODUCTS] Form submitted. Data:", formData);
    
    const processImage = async (fileOrUrl: any, imageType: 'cover' | 'color'): Promise<string> => {
        if (!fileOrUrl) return '';

        if (typeof fileOrUrl === 'string') {
          if (!fileOrUrl.startsWith('http')) {
            toast({ variant: 'destructive', title: 'URL Inválida', description: `La URL '${fileOrUrl.substring(0,30)}...' no es válida.` });
            throw new Error('Invalid URL');
          }
          return fileOrUrl;
        }

        if (fileOrUrl instanceof File) {
            try {
                console.log(`📁 [PRODUCTS] Processing ${imageType} image:`, fileOrUrl.name);
                
                // Validate File object
                if (!fileOrUrl.name || fileOrUrl.size === 0) {
                    throw new Error(`Invalid file object for ${imageType} image`);
                }
                
                // Create a fresh File object to avoid blob reference issues
                const fileBuffer = await fileOrUrl.arrayBuffer();
                const freshFile = new File([fileBuffer], fileOrUrl.name, {
                    type: fileOrUrl.type || 'image/png',
                    lastModified: fileOrUrl.lastModified || Date.now()
                });
                
                console.log(`📁 [PRODUCTS] Created fresh file object:`, freshFile.name, freshFile.size, 'bytes');
                
                // Usar R2 en lugar de Supabase Storage
                let uploadResult;
                if (imageType === 'cover') {
                  uploadResult = await uploadCoverImage(freshFile);
                } else {
                  uploadResult = await uploadColorImage(freshFile);
                }
                
                if (!uploadResult.success) {
                  // Si R2 falla, mostrar una advertencia pero continuar sin imagen
                  console.warn(`⚠️ [PRODUCTS] ${imageType} upload failed, using fallback`);
                  toast({ 
                    variant: 'destructive', 
                    title: `Error al subir imagen ${imageType}`, 
                    description: 'Por favor, usa URLs directas mientras se corrige la configuración de R2' 
                  });
                  return ''; // Retornar vacío en lugar de fallar
                }
                
                console.log(`✅ [PRODUCTS] ${imageType} image uploaded successfully:`, uploadResult.url);
                return uploadResult.url || '';
            } catch (e: any) {
                console.error(`❌ [PRODUCTS] Error uploading ${imageType} image:`, e);
                toast({ 
                  variant: 'destructive', 
                  title: `Error al subir imagen ${imageType}`, 
                  description: 'Por favor, usa URLs directas mientras se corrige la configuración de R2' 
                });
                return ''; // Retornar vacío en lugar de fallar
            }
        }
        return '';
    };

    try {
        console.log('📁 [PRODUCTS] Processing cover image...');
        const coverImageUrl = await processImage(formData.coverImage, 'cover');

        console.log('📁 [PRODUCTS] Processing additional cover images...');
        const coverImagesUrls = formData.coverImages && formData.coverImages.length > 0 
          ? await Promise.all(
              formData.coverImages.map((image, index) => {
                console.log(`📁 [PRODUCTS] Processing cover image ${index + 1}`);
                return processImage(image, 'cover');
              })
            )
          : [];

        console.log('🎨 [PRODUCTS] Processing color images...');
        const colorImageUrls = await Promise.all(
            formData.colors.map((color, index) => {
                console.log(`🎨 [PRODUCTS] Processing color ${index + 1}:`, color.name);
                return processImage(color.image, 'color');
            })
        );

        const finalProductData = {
            ...formData,
            coverImage: coverImageUrl,
            coverImages: coverImagesUrls.filter(url => url !== ''), // Filtrar URLs vacías
            colors: formData.colors.map((color, index) => ({
                ...color,
                image: colorImageUrls[index],
            })),
        };

        console.log('💾 [PRODUCTS] Final product data:', finalProductData);

        let success;
        if (editingProduct) {
            console.log("🔄 [PRODUCTS] Updating existing product:", editingProduct.id);
            success = await updateProduct(editingProduct.id, finalProductData);
        } else {
            console.log("➕ [PRODUCTS] Adding new product.");
            success = await addProduct(finalProductData);
        }

        if (success) {
            toast({
                title: editingProduct ? "Producto actualizado" : "Producto creado",
                description: `El producto ha sido ${editingProduct ? 'actualizado' : 'creado'} exitosamente con imágenes en Cloudflare R2.`,
            });
            cleanupBlobUrls();
            setIsProductDialogOpen(false);
            setCoverImagePreview(null);
        } else {
           console.log("❌ [PRODUCTS] Submit failed. Success was false.");
           toast({
                variant: 'destructive',
                title: 'Error al Guardar',
                description: 'No se pudo guardar el producto. Revisa la consola para más detalles.',
            });
        }
    } catch (error) {
        console.error("❌ [PRODUCTS] An unexpected error occurred during product submission:", error);
    }
  };

  const handleRegisterSale = () => {
    resetSale({ productId: '', colorHex: '', quantity: 1, discount_code: '' });
    setSaleFilters({ category: 'all', name: 'all', model: 'all' });
    setAppliedDiscount(null);
    setIsSaleDialogOpen(true);
  };

  const handleSellProductClick = (product: Product) => {
    resetSale({
      productId: product.id,
      colorHex: '',
      quantity: 1,
      discount_code: '',
    });
    setAppliedDiscount(null);
    setSaleFilters({
      category: product.category,
      name: product.name,
      model: product.model,
    });
    setIsSaleDialogOpen(true);
  };

  const handleValidateDiscountCode = async () => {
    const discountCode = watchSale('discount_code')?.trim();
    
    if (!discountCode) {
      toast({
        variant: 'destructive',
        title: 'Código requerido',
        description: 'Por favor ingresa un código de descuento.'
      });
      return;
    }

    setIsValidatingDiscount(true);
    
    try {
      // Usar la misma función que el carrito para validar (pero sin aplicar aún)
      const { data: discountData, error: rpcError } = await supabase.rpc('apply_and_increment_discount', { 
        p_code: discountCode.trim().toUpperCase() 
      });
      
      console.log('[DEBUG] Validación de cupón (usando apply_and_increment):', discountData);
      console.log('[DEBUG] Error validación:', rpcError);

      if (rpcError || !discountData || !discountData.success) {
        const errorMessage = discountData?.error || rpcError?.message || 'Código de descuento inválido.';
        toast({ 
          variant: "destructive", 
          title: "Código Inválido", 
          description: errorMessage 
        });
        setAppliedDiscount(null);
      } else {
        setAppliedDiscount({
          code: discountData.code || discountCode.toUpperCase(),
          name: discountData.name || '',
          percentage: discountData.percentage || 0,
          isApplied: true
        });
        
        toast({ 
          title: "¡Código válido!", 
          description: `Se aplicó un ${discountData.percentage}% de descuento. Uso registrado automáticamente.`,
          className: "border-green-500/20 shadow-lg shadow-green-500/10"
        });
      }
    } catch (error: any) {
      console.error('[DEBUG] Error validando cupón:', error);
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Ocurrió un error al validar el código."
      });
      setAppliedDiscount(null);
    } finally {
      setIsValidatingDiscount(false);
    }
  };

  const handleRemoveDiscountCode = () => {
    setAppliedDiscount(null);
    setSaleValue('discount_code', '');
    toast({ description: "Descuento eliminado." });
  };

  const onSaleSubmit = async (data: z.infer<typeof saleSchema>) => {
    console.log('--- [DEBUG] INICIO onSaleSubmit ---');
    console.log('[DEBUG] Datos del formulario de venta:', data);

    const productToUpdate = products.find(p => p.id === data.productId);
    if (!productToUpdate) {
        console.error('[DEBUG] Producto no encontrado. ID:', data.productId);
        toast({ variant: 'destructive', title: 'Error', description: 'Producto no encontrado.' });
        return;
    }

    const colorToUpdate = productToUpdate.colors.find(c => c.hex === data.colorHex);
    if (!colorToUpdate) {
        console.error('[DEBUG] Color no encontrado. HEX:', data.colorHex);
        toast({ variant: 'destructive', title: 'Error', description: 'Color no encontrado.' });
        return;
    }

    if (data.quantity > colorToUpdate.stock) {
        console.error('[DEBUG] Stock insuficiente.');
        toast({
            variant: 'destructive',
            title: 'Error de stock',
            description: `No puedes vender ${data.quantity} unidades. Stock disponible: ${colorToUpdate.stock}.`
        });
        return;
    }

    let finalPrice = productToUpdate.price;
    let discountPercentage = productToUpdate.discount || 0;
    
    // Apply promo discount
    if (productToUpdate.discount && productToUpdate.discount > 0) {
      finalPrice = finalPrice * (1 - (productToUpdate.discount / 100));
      console.log(`[DEBUG] Precio después de descuento por promo (${productToUpdate.discount}%): $${finalPrice}`);
    }
    
    // Apply cash payment discount (always 20% OFF for cash/transfer)
    const cashDiscount = 0.2; // 20% descuento fijo para efectivo
    finalPrice = finalPrice * (1 - cashDiscount);
    discountPercentage += cashDiscount * 100;
    console.log(`[DEBUG] Precio después de descuento de efectivo (20%): $${finalPrice}`);
    
    // Apply discount code
    if (appliedDiscount && appliedDiscount.isApplied) {
        console.log(`[DEBUG] Usando código de descuento ya aplicado: ${appliedDiscount.code}`);
        
        // El código ya fue aplicado e incrementado durante la validación
        console.log('[DEBUG] Cupón ya aplicado durante la validación');
        if (appliedDiscount.percentage) {
          finalPrice = finalPrice * (1 - (appliedDiscount.percentage / 100));
          discountPercentage += appliedDiscount.percentage;
        }
        
        console.log(`[DEBUG] Precio final después del cupón: $${finalPrice}`);
    }

    const updatedColors = productToUpdate.colors.map(c => {
        if (c.hex === data.colorHex) {
            return { ...c, stock: c.stock - data.quantity };
        }
        return c;
    });
    
    const stockUpdateSuccess = await updateProduct(productToUpdate.id, { colors: updatedColors });
    
    if(!stockUpdateSuccess) {
      console.error('[DEBUG] Falló la actualización de stock.');
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
        price_per_unit: finalPrice,
        total_price: finalPrice * data.quantity,
        discount_code: appliedDiscount?.code || undefined,
        discount_percentage: discountPercentage,
    };

    console.log('[DEBUG] Guardando datos de la venta:', saleData);
    const saleAddSuccess = await addSale(saleData);

    if(saleAddSuccess) {
      console.log('[DEBUG] Venta registrada exitosamente.');
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
      setAppliedDiscount(null);
      setIsSaleDialogOpen(false);
    } else {
         console.error('[DEBUG] Falló el registro de la venta en el historial.');
         toast({ variant: 'destructive', title: 'Error de Registro', description: 'La venta actualizó el stock pero no pudo ser guardada en el historial' });
    }
    console.log('--- [DEBUG] FIN onSaleSubmit ---');
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
    setIsSavingStockUpdate(true);
    
    const pedidoId = crypto.randomUUID();
    const historyEntries: Omit<StockHistory, 'id' | 'created_at'>[] = [];
    const productUpdatesMap = new Map<string, Product>();
    const skippedItems: string[] = [];
  
    for (const [key, value] of updatesToProcess) {
      const lastHyphenIndex = key.lastIndexOf('-');
      const productId = key.substring(0, lastHyphenIndex);
      const colorHex = key.substring(lastHyphenIndex + 1);
      const quantityAdded = parseInt(value as string, 10);
      
      const product = productsRef.current.find((p) => p.id === productId);
      
      if (!product) {
        skippedItems.push(`Producto ID: ${productId.substring(0, 8)}...`);
        continue;
      }
      
      const color = product.colors.find((c) => c.hex === colorHex);
      
      if (!color) {
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
      setIsSavingStockUpdate(false);
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
    } finally {
      setIsSavingStockUpdate(false);
    }
  }, [stockUpdates, fetchProducts, fetchStockHistory, supabase, toast]);

  const handleMobileStockInputChange = (key: string, value: string) => {
    setMobileStockInputs(prev => ({ ...prev, [key]: value }));
  };

  const handleMobileStockUpdate = async (product: Product, newStock: number, colorHex: string) => {
    const colorToUpdate = product.colors.find(c => c.hex === colorHex);
    if (!colorToUpdate || newStock === colorToUpdate.stock || newStock < 0) {
      return;
    }

    console.log(`[Mobile Update] Trying to update stock for ${product.name} - ${colorToUpdate.name}. Old: ${colorToUpdate.stock}, New: ${newStock}`);
    
    const updatedColors = product.colors.map(c =>
      c.hex === colorHex ? { ...c, stock: newStock } : c
    );
    
    const success = await updateProduct(product.id, { colors: updatedColors });
    
    if (success) {
      console.log(`[Mobile Update] Success!`);
      toast({
        title: "Stock Actualizado",
        description: `Stock de ${unslugify(product.name)} (${colorToUpdate.name}) ahora es ${newStock}.`,
      });
    } else {
      console.log(`[Mobile Update] Failed!`);
      setMobileStockInputs(prev => ({...prev, [`${product.id}-${colorHex}`]: colorToUpdate.stock}));
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

  const modelOptions = useMemo(() => {
      if (!watchedCategory || !models) return [];
      return models[watchedCategory] || [];
  }, [watchedCategory, models]);

  const groupedStockHistory = useMemo(() => {
  if (!stockHistory || stockHistory.length === 0) return [];
  // Ignorar registros anulados/soft-delete (cantidad 0 o marcados)
  const visible = stockHistory.filter(e => (e.quantity_added ?? 0) > 0 && e.notes !== '__DELETED__');
  
  const grouped = visible.reduce((acc, entry) => {
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

  // Helpers for editing/deleting pedidos
  const openEditPedido = (pedidoId: string, entries: StockHistory[]) => {
    setPedidoEditingId(pedidoId);
    setPedidoEditingEntries(entries);
    const initial: Record<string, number> = {};
    const initialCosts: Record<string, string> = {};
    entries.forEach(e => { initial[e.id] = e.quantity_added; });
    entries.forEach(e => { initialCosts[e.id] = e.cost !== undefined && e.cost !== null ? e.cost.toString() : ''; });
    setPedidoQuantities(initial);
    setPedidoCosts(initialCosts);
    setIsEditPedidoOpen(true);
  };

  const handleSavePedidoEdit = async () => {
    if (!pedidoEditingId) return;
    setIsSavingPedidoEdit(true);

    try {
      // Preflight checks and build update payloads
      const issues: string[] = [];
      const updates: { entry: StockHistory; delta: number; newQty: number; newCost: number }[] = [];

      for (const entry of pedidoEditingEntries) {
        const newQty = Number(pedidoQuantities[entry.id] ?? entry.quantity_added);
        if (!Number.isFinite(newQty) || newQty < 0) {
          issues.push(`${unslugify(entry.product_name)} (${entry.color_name}): cantidad inválida`);
          continue;
        }

        const rawCost = pedidoCosts[entry.id];
        let newCost = entry.cost ?? 0;
        if (rawCost !== undefined) {
          const normalized = rawCost.replace(',', '.');
          if (normalized.trim() === '') {
            newCost = 0;
          } else {
            const parsed = Number(normalized);
            if (!Number.isFinite(parsed) || parsed < 0) {
              issues.push(`${unslugify(entry.product_name)} (${entry.color_name}): costo inválido`);
              continue;
            }
            newCost = Math.round(parsed * 100) / 100;
          }
        } else {
          newCost = Math.round(newCost * 100) / 100;
        }

        const delta = newQty - entry.quantity_added;

        const product = productsRef.current.find(p => p.id === entry.product_id);
        if (!product) {
          issues.push(`${unslugify(entry.product_name)}: producto no encontrado`);
          continue;
        }
        const color = product.colors.find(c => c.name === entry.color_name);
        if (!color) {
          issues.push(`${unslugify(entry.product_name)} (${entry.color_name}): color no encontrado`);
          continue;
        }
        if (delta < 0 && color.stock + delta < 0) {
          issues.push(`${unslugify(entry.product_name)} (${entry.color_name}): stock insuficiente para restar ${Math.abs(delta)} (actual ${color.stock})`);
          continue;
        }

        updates.push({ entry, delta, newQty, newCost });
      }

      if (issues.length > 0) {
        toast({
          variant: 'destructive',
          title: 'No se puede guardar cambios',
          description: issues.join(' | '),
        });
        setIsSavingPedidoEdit(false);
        return;
      }

      const deltas = updates.filter(update => update.delta !== 0);
      const costChanges = updates.filter(update => update.newCost !== (update.entry.cost ?? 0));

      // Nothing to change
      if (deltas.length === 0 && costChanges.length === 0) {
        toast({ title: 'Sin cambios', description: 'No se modificó ninguna cantidad ni costo.' });
        setIsSavingPedidoEdit(false);
        setIsEditPedidoOpen(false);
        return;
      }

      // Build product updates
      const productUpdates = new Map<string, Product>();
      for (const { entry, delta } of deltas) {
        const base = productsRef.current.find(p => p.id === entry.product_id);
        if (!base) continue;
        const clone: Product = productUpdates.get(base.id) || JSON.parse(JSON.stringify(base));
        const color = clone.colors.find(c => c.name === entry.color_name);
        if (color) color.stock += delta;
        productUpdates.set(clone.id, clone);
      }

      // Apply product updates without refetch each time
      for (const [productId, updatedProduct] of productUpdates.entries()) {
        const ok = await updateProduct(productId, { colors: updatedProduct.colors }, false);
        if (!ok) throw new Error(`Error actualizando producto ${productId}`);
      }

      // Update stock_history rows (quantities and/or costs) using admin API
      const stockHistoryUpdates = updates
        .map(update => {
          const quantityChanged = update.delta !== 0;
          const costChanged = update.newCost !== (update.entry.cost ?? 0);
          if (!quantityChanged && !costChanged) return null;
          const payload: { id: string; quantity_added?: number; cost?: number } = { id: update.entry.id };
          if (quantityChanged) payload.quantity_added = update.newQty;
          if (costChanged) payload.cost = update.newCost;
          return payload;
        })
        .filter((payload): payload is { id: string; quantity_added?: number; cost?: number } => Boolean(payload));

      if (stockHistoryUpdates.length > 0) {
        const response = await fetch('/api/admin/stock-history/update', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates: stockHistoryUpdates }),
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result?.success) {
          const message = typeof result?.error === 'string' ? result.error : 'No se pudieron actualizar los registros del historial.';
          throw new Error(message);
        }
      }

      await fetchProducts();
      await fetchStockHistory();
      toast({ title: 'Pedido actualizado', description: `Se guardaron los cambios del pedido #${pedidoEditingId.substring(0,4)}.` });
      setIsEditPedidoOpen(false);
    } catch (e: any) {
      console.error('Error saving pedido edit:', e);
      toast({ variant: 'destructive', title: 'Error', description: e.message || 'No se pudo guardar los cambios del pedido.' });
    } finally {
      setIsSavingPedidoEdit(false);
    }
  };

  const handleDeletePedido = async (pedidoId: string, entries: StockHistory[]) => {
    setIsDeletingPedido(true);
    try {
      console.log('[PEDIDOS][DELETE] Inicio eliminación de pedido:', {
        pedidoId,
        entriesCount: entries.length,
        entryIds: entries.map(e => e.id)
      });
      // Verificación previa: ¿existen aún las filas objetivo?
      const idsToDeletePre = entries.map(e => e.id);
      const { data: preRowsByIds, error: preErrIds } = await supabase
        .from('stock_history')
        .select('id, pedido_id')
        .in('id', idsToDeletePre);
      const { data: preRowsByPedido, error: preErrPedido } = await supabase
        .from('stock_history')
        .select('id')
        .eq('pedido_id', pedidoId);
      console.log('[PEDIDOS][DELETE] Preselect filas existentes:', {
        preErrIds,
        preErrPedido,
        countByIds: preRowsByIds?.length ?? 0,
        idsFound: preRowsByIds?.map(r => r.id) ?? [],
        countByPedido: preRowsByPedido?.length ?? 0,
      });
      // Preflight checks (ensure we can subtract the quantities)
      const issues: string[] = [];
      for (const entry of entries) {
        const product = productsRef.current.find(p => p.id === entry.product_id);
        if (!product) { issues.push(`${unslugify(entry.product_name)}: producto no encontrado`); continue; }
        const color = product.colors.find(c => c.name === entry.color_name);
        if (!color) { issues.push(`${unslugify(entry.product_name)} (${entry.color_name}): color no encontrado`); continue; }
        if (color.stock - entry.quantity_added < 0) {
          issues.push(`${unslugify(entry.product_name)} (${entry.color_name}): stock insuficiente para revertir (${entry.quantity_added} > ${color.stock})`);
        }
      }

      if (issues.length > 0) {
        toast({ variant: 'destructive', title: 'No se puede eliminar el pedido', description: issues.join(' | ') });
        console.warn('[PEDIDOS][DELETE] Preflight falló, abortando:', issues);
        setIsDeletingPedido(false);
        return;
      }

      // Prepare product updates and originals for potential rollback
      const productUpdates = new Map<string, Product>();
      const originalSnapshots = new Map<string, Product>();
      for (const entry of entries) {
        const base = productsRef.current.find(p => p.id === entry.product_id);
        if (!base) continue;
        if (!originalSnapshots.has(base.id)) {
          originalSnapshots.set(base.id, JSON.parse(JSON.stringify(base)) as Product);
        }
        const clone: Product = productUpdates.get(base.id) || JSON.parse(JSON.stringify(base));
        const color = clone.colors.find(c => c.name === entry.color_name);
        if (color) color.stock -= entry.quantity_added;
        productUpdates.set(clone.id, clone);
      }

      // Apply product updates without refetch each time
      for (const [productId, updatedProduct] of productUpdates.entries()) {
        const ok = await updateProduct(productId, { colors: updatedProduct.colors }, false);
        console.log('[PEDIDOS][DELETE] Actualización de stock aplicada a producto', productId, 'ok:', ok);
        if (!ok) throw new Error(`Error actualizando producto ${productId}`);
      }

      // Intentar borrar usando endpoint con service role (evita RLS)
      const idsToDelete = entries.map(e => e.id);
      console.log('[PEDIDOS][DELETE] Intentando borrar vía API admin (service role)...');
      let adminDeleted = 0;
      try {
        const resp = await fetch('/api/admin/stock-history/delete-pedido', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pedidoId, entryIds: idsToDelete }),
        });
        const json = await resp.json();
        console.log('[PEDIDOS][DELETE] Respuesta API admin:', json);
        if (resp.ok && json?.success) {
          adminDeleted = json.deleted || 0;
        } else {
          console.warn('[PEDIDOS][DELETE] API admin no pudo eliminar, se intentará client-side. Error:', json?.error);
        }
      } catch (apiErr) {
        console.warn('[PEDIDOS][DELETE] Error llamando API admin, se intentará client-side:', apiErr);
      }

      let deletedCount = 0;
      if (adminDeleted > 0) {
        deletedCount = adminDeleted;
      } else {
        console.log('[PEDIDOS][DELETE] Intentando borrar stock_history por IDs (client-side):', idsToDelete);
        const { data: deletedByIds, error: delErr } = await supabase
          .from('stock_history')
          .delete()
          .in('id', idsToDelete)
          .select('id');

        deletedCount = Array.isArray(deletedByIds) ? deletedByIds.length : 0;
        console.log('[PEDIDOS][DELETE] Resultado borrado por IDs:', { delErr, deletedCount, deletedByIds });

        if (delErr) {
          // Rollback product stock changes
          for (const [productId, original] of originalSnapshots.entries()) {
            console.warn('[PEDIDOS][DELETE] Error borrando por IDs. Revirtiendo stock de producto', productId);
            await updateProduct(productId, { colors: original.colors }, false);
          }
          // Refrescar UI tras rollback
          try {
            await fetchProducts();
            await fetchStockHistory();
          } catch (_) {}
          throw new Error(`Error eliminando historial: ${delErr.message}`);
        }
      }

      // Si no se borró nada por IDs, intentar por pedido_id (fallback) o cancelar y revertir stocks
      if (deletedCount === 0) {
        console.warn('[PEDIDOS][DELETE] 0 filas eliminadas por IDs. Intentando borrar por pedido_id:', pedidoId);
        const { data: deletedByPedido, error: delErr2 } = await supabase
          .from('stock_history')
          .delete()
          .eq('pedido_id', pedidoId)
          .select('id');
        const deletedByPedidoCount = Array.isArray(deletedByPedido) ? deletedByPedido.length : 0;
        console.log('[PEDIDOS][DELETE] Resultado borrado por pedido_id:', { delErr2, deletedByPedidoCount, deletedByPedido });

        if (delErr2 || deletedByPedidoCount === 0) {
          console.warn('[PEDIDOS][DELETE] Hard delete falló o eliminó 0. Intentando soft-delete (set quantity=0, notes=__DELETED__).');
          const { data: softData, error: softErr } = await supabase
            .from('stock_history')
            .update({ quantity_added: 0, notes: '__DELETED__' })
            .eq('pedido_id', pedidoId)
            .select('id');
          console.log('[PEDIDOS][DELETE] Soft-delete resultado:', { softErr, softCount: softData?.length ?? 0, softIds: softData?.map(r => r.id) });

          if (softErr || (softData?.length ?? 0) === 0) {
            for (const [productId, original] of originalSnapshots.entries()) {
              console.warn('[PEDIDOS][DELETE] Soft-delete también falló. Revirtiendo stock de producto', productId);
              await updateProduct(productId, { colors: original.colors }, false);
            }
            // Refrescar UI tras rollback
            try {
              await fetchProducts();
              await fetchStockHistory();
            } catch (_) {}
            throw new Error(softErr ? `Error soft-deleting historial: ${softErr.message}` : 'No se eliminaron registros del historial. Verifica RLS o filtros.');
          }
        }
      }

      await fetchProducts();
      await fetchStockHistory();
      console.log('[PEDIDOS][DELETE] Eliminación completada. Refrescos ejecutados.');
      toast({ title: 'Pedido eliminado', description: `Se revirtió el stock y se eliminó el pedido #${pedidoId.substring(0,4)}.` });
    } catch (e: any) {
      console.error('Error deleting pedido:', e);
      toast({ variant: 'destructive', title: 'Error', description: e.message || 'No se pudo eliminar el pedido.' });
    } finally {
      setIsDeletingPedido(false);
    }
  };

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
                              {product.colors.map(color => {
                                const key = `${product.id}-${color.hex}`;
                                const currentStock = Number(mobileStockInputs[key] || 0);

                                return (
                                <div key={key} className="flex items-center justify-between text-sm p-2 rounded-md bg-background">
                                  <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: color.hex }} />
                                    <span>{color.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <Button variant="default" size="icon" className="h-8 w-8 rounded-full bg-primary hover:bg-accent"
                                          onClick={() => {
                                              const newStock = Math.max(0, currentStock - 1);
                                              handleMobileStockInputChange(key, String(newStock));
                                              handleMobileStockUpdate(product, newStock, color.hex);
                                          }}>
                                          <Minus className="h-4 w-4" />
                                      </Button>
                                      <Input
                                          type="number"
                                          value={mobileStockInputs[key] ?? ''}
                                          onChange={(e) => handleMobileStockInputChange(key, e.target.value)}
                                          onBlur={(e) => {
                                              const newStock = parseInt(e.target.value, 10);
                                              if (!isNaN(newStock)) {
                                                  handleMobileStockUpdate(product, newStock, color.hex);
                                              } else {
                                                  handleMobileStockInputChange(key, String(color.stock));
                                              }
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              const newStock = parseInt(e.currentTarget.value, 10);
                                              if (!isNaN(newStock)) {
                                                  handleMobileStockUpdate(product, newStock, color.hex);
                                              }
                                            }
                                          }}
                                          className="w-16 h-8 text-center font-medium"
                                      />
                                      <Button variant="default" size="icon" className="h-8 w-8 rounded-full bg-primary hover:bg-accent"
                                        onClick={() => {
                                            const newStock = currentStock + 1;
                                            handleMobileStockInputChange(key, String(newStock));
                                            handleMobileStockUpdate(product, newStock, color.hex);
                                        }}>
                                          <Plus className="h-4 w-4" />
                                      </Button>
                                  </div>
                                </div>
                              )})}
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
      
      <Dialog open={isProductDialogOpen} onOpenChange={(open) => {
        if (!open) {
          cleanupBlobUrls();
        }
        setIsProductDialogOpen(open);
      }}>
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
                              setValue('model', '');
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                 <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-2">
                    <Label htmlFor="discount" className="md:text-right">Descuento (%)</Label>
                    <Input id="discount" type="number" step="1" {...register('discount')} />
                    {errors.discount && <p className="md:col-span-2 text-red-500 text-sm">{errors.discount.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-4">
                <Label className="md:text-right pt-2">Imagen de Portada</Label>
                <div className="md:col-span-3">
                    <Tabs defaultValue="upload" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="upload">Subir Archivo</TabsTrigger>
                            <TabsTrigger value="url">Usar URL</TabsTrigger>
                        </TabsList>
                        <TabsContent value="upload">
                            <label
                                htmlFor="cover-image-upload-input"
                                className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-card mt-4"
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click para subir</span></p>
                                    <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (recorte 3:5)</p>
                                </div>
                                <input
                                    id="cover-image-upload-input"
                                    type="file"
                                    className="hidden"
                                    accept="image/png, image/jpeg, image/webp"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            handleFileSelect(e.target.files[0], 'cover');
                                        }
                                    }}
                                />
                            </label>
                        </TabsContent>
                        <TabsContent value="url">
                            <div className="pt-4 space-y-2">
                                <Input
                                    id="cover_image_url_input"
                                    placeholder="https://ejemplo.com/imagen.png"
                                    value={coverImageUrlInput}
                                    onChange={(e) => {
                                        setCoverImageUrlInput(e.target.value);
                                        setValue('coverImage', e.target.value, { shouldValidate: true });
                                    }}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>

                    {coverImagePreview && (
                      <div className="flex items-center gap-2 mt-4">
                        <div className="relative w-10 h-10 rounded-md overflow-hidden border flex-shrink-0">
                            <Image src={coverImagePreview} alt="Thumbnail de portada" fill className="object-cover" unoptimized={true} />
                        </div>
                        <Button type="button" variant="outline" size="sm" className="flex-grow" onClick={() => setPreviewDialogUrl(coverImagePreview)}>Ver Previa</Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-9 w-9 flex-shrink-0 rounded-full"
                            onClick={() => {
                                setValue('coverImage', '');
                            }}
                        >
                            <X className="h-4 w-4"/>
                        </Button>
                      </div>
                    )}
                    {errors.coverImage && <p className="text-red-500 text-sm mt-1">{typeof errors.coverImage.message === 'string' ? errors.coverImage.message : ''}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-4">
                <Label className="md:text-right pt-2">Imágenes Adicionales</Label>
                <div className="md:col-span-3 space-y-4">
                    <p className="text-sm text-muted-foreground">Añade más imágenes para el carousel de la product card (opcional)</p>
                    
                    {coverImagesFields.map((field, index) => (
                        <div key={field.id} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">Imagen {index + 1}</h4>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeCoverImage(index)}
                                >
                                    <X className="h-4 w-4" />
                                    Eliminar
                                </Button>
                            </div>
                            
                            <Tabs defaultValue="upload" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="upload">Subir Archivo</TabsTrigger>
                                    <TabsTrigger value="url">Usar URL</TabsTrigger>
                                </TabsList>
                                <TabsContent value="upload">
                                    <label
                                        htmlFor={`cover-image-${index}-upload-input`}
                                        className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-card mt-4"
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click para subir</span></p>
                                            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (recorte 3:5)</p>
                                        </div>
                                        <input
                                            id={`cover-image-${index}-upload-input`}
                                            type="file"
                                            className="hidden"
                                            accept="image/png, image/jpeg, image/webp"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    handleFileSelect(e.target.files[0], 'coverImage', index);
                                                }
                                            }}
                                        />
                                    </label>
                                </TabsContent>
                                <TabsContent value="url">
                                    <div className="pt-4 space-y-2">
                                        <Input
                                            placeholder="https://ejemplo.com/imagen.png"
                                            value={typeof watch(`coverImages.${index}`) === 'string' ? watch(`coverImages.${index}`) : ''}
                                            onChange={(e) => {
                                                setValue(`coverImages.${index}`, e.target.value, { shouldValidate: true });
                                            }}
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>

                            {coverImagesPreviews[index] && (
                                <div className="flex items-center gap-2 mt-4">
                                    <div className="relative w-10 h-10 rounded-md overflow-hidden border flex-shrink-0">
                                        <Image src={coverImagesPreviews[index]} alt={`Thumbnail ${index + 1}`} fill className="object-cover" unoptimized={true} />
                                    </div>
                                    <Button type="button" variant="outline" size="sm" className="flex-grow" onClick={() => setPreviewDialogUrl(coverImagesPreviews[index])}>Ver Previa</Button>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="h-9 w-9 flex-shrink-0 rounded-full"
                                        onClick={() => {
                                            setValue(`coverImages.${index}`, '');
                                        }}
                                    >
                                        <X className="h-4 w-4"/>
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                    
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendCoverImage('')}
                        className="w-full"
                    >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Añadir Imagen
                    </Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-4">
                <Label className="md:text-right pt-2">Modelo(s)</Label>
                <div className="md:col-span-3">
                    <Controller
                        name="model"
                        control={control}
                        render={({ field }) => (
                            <div className="space-y-2 border p-2 rounded-md max-h-40 overflow-y-auto">
                                {modelOptions.map((modelItem) => (
                                    <div key={modelItem} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`model-${modelItem}`}
                                            checked={field.value?.split(' / ').includes(modelItem)}
                                            onCheckedChange={(checked) => {
                                                const currentModels = field.value ? field.value.split(' / ') : [];
                                                const newModels = checked
                                                    ? [...currentModels, modelItem]
                                                    : currentModels.filter((m) => m !== modelItem);
                                                field.onChange(newModels.join(' / '));
                                            }}
                                        />
                                        <Label htmlFor={`model-${modelItem}`} className="font-normal">{modelItem}</Label>
                                    </div>
                                ))}
                            </div>
                        )}
                    />
                     {errors.model && <p className="text-red-500 text-sm mt-1">{errors.model.message}</p>}
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
                          <ColorImageInput control={control} index={index} errors={errors} onFileSelect={(file) => handleFileSelect(file, 'color', index)} setPreviewDialogUrl={setPreviewDialogUrl} setValue={setValue} />
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
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ name: 'Nuevo Color', hex: '#FFFFFF', image: '', stock: 0 })}>
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
              <ScrollArea className="max-h-[60vh] -mx-6 px-6">
                <form onSubmit={handleSubmitSale(onSaleSubmit)} className="space-y-4 py-4 px-1">
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
                    
                    <div className="space-y-2">
                        <Label htmlFor="discount_code">Código de Descuento (Opcional)</Label>
                        {!appliedDiscount ? (
                            <div className="flex gap-2">
                                <Input 
                                    id="discount_code"
                                    {...registerSale('discount_code')}
                                    placeholder="Ej: VERANO2025"
                                    className="flex-1"
                                />
                                <Button 
                                    type="button"
                                    variant="outline"
                                    onClick={handleValidateDiscountCode}
                                    disabled={isValidatingDiscount || !watchSale('discount_code')?.trim()}
                                    className="px-3"
                                >
                                    {isValidatingDiscount ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        'Aplicar'
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-green-900">
                                        {appliedDiscount.name}
                                    </p>
                                    <p className="text-xs text-green-700">
                                        {appliedDiscount.percentage}% de descuento aplicado
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRemoveDiscountCode}
                                    className="h-8 w-8 p-0 text-green-700 hover:text-green-900"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </form>
              </ScrollArea>
               <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancelar</Button>
                    </DialogClose>
                    <Button onClick={handleSubmitSale(onSaleSubmit)} type="button" disabled={!saleProduct || !watchSale('colorHex')}>Confirmar Venta</Button>
                </DialogFooter>
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
                <div className="hidden md:block">
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
                </div>
                <div className="md:hidden space-y-3">
                  {sales.length > 0 ? sales.map(sale => (
                    <Card key={sale.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold">{unslugify(sale.product_name)}</p>
                          <p className="text-sm text-muted-foreground">{sale.product_model}</p>
                          <p className="text-sm text-muted-foreground">Color: {sale.color_name}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{new Date(sale.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex justify-between items-end mt-2 pt-2 border-t">
                        <p className="text-sm">Cantidad: <span className="font-medium">{sale.quantity}</span></p>
                        <p className="text-lg font-bold text-primary">${sale.total_price}</p>
                      </div>
                    </Card>
                  )) : (
                    <p className="text-center text-muted-foreground py-8">No hay ventas registradas.</p>
                  )}
                </div>
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
              <div className="hidden md:block">
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
                </div>
                <div className="md:hidden space-y-3">
                  {productHistory.length > 0 ? productHistory.map(entry => (
                    <Card key={entry.id} className="p-4">
                       <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold">{unslugify(entry.product_name)}</p>
                          <p className="text-sm text-muted-foreground">{entry.product_model}</p>
                          <p className="text-sm text-muted-foreground">Categoría: {entry.product_category}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{new Date(entry.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex justify-between items-end mt-2 pt-2 border-t">
                        <p className="text-sm">Stock Inicial: <span className="font-medium">{entry.initial_stock}</span></p>
                        <p className="text-lg font-bold text-primary">${entry.price}</p>
                      </div>
                    </Card>
                  )) : (
                    <p className="text-center text-muted-foreground py-8">No hay productos creados.</p>
                  )}
                </div>
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
                    <Image src={previewDialogUrl} alt="Vista previa" fill className="object-cover" unoptimized={true} />
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
                      <Button type="button" variant="secondary" disabled={isSavingStockUpdate}>Cancelar</Button>
                  </DialogClose>
                  <Button onClick={handleBulkStockUpdate} disabled={isSavingStockUpdate}>
                    {isSavingStockUpdate ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar Cambios'}
                  </Button>
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
                                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                  <Button variant="outline" size="sm" onClick={() => openEditPedido(pedido_id, entries)}>
                                    <Edit className="h-4 w-4 mr-1" /> Editar pedido
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="sm">
                                        <Trash className="h-4 w-4 mr-1" /> Eliminar pedido
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Eliminar pedido</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta acción revertirá el stock agregado por este pedido y eliminará sus registros. ¿Deseas continuar?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeletePedido(pedido_id, entries)} disabled={isDeletingPedido} className="bg-destructive hover:bg-destructive/90">
                                          {isDeletingPedido ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Eliminar'}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                    </div>
                    <div className="border rounded-lg">
                      <div className="hidden md:block">
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
                      </div>
                      <div className="md:hidden p-4 space-y-3">
                          {entries.map((entry) => (
                            <div key={entry.id} className="text-sm border-b pb-2 last:border-b-0">
                              <p className="font-semibold">{unslugify(entry.product_name)} ({entry.color_name})</p>
                              <p className="text-xs text-muted-foreground">{entry.product_model}</p>
                              <div className="flex justify-between items-center mt-1">
                                <div>
                                  <p>Costo: ${entry.cost || 0}</p>
                                  <p>Precio: ${entry.price || 0}</p>
                                </div>
                                <p className="font-bold text-lg text-primary">+{entry.quantity_added}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                      <div className="p-4 bg-muted/50 rounded-b-lg grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-medium">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Costo Total</p>
                            <p>${totalCost.toLocaleString()}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Ingreso Potencial</p>
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
      <Dialog open={isCropperOpen} onOpenChange={setIsCropperOpen}>
          <DialogContent className="max-w-4xl">
              <DialogHeader>
                  <DialogTitle>Recortar Imagen de Producto</DialogTitle>
                  <DialogDescription>Ajusta la imagen para que encaje perfectamente. La relación de aspecto es 3:5.</DialogDescription>
              </DialogHeader>
              <div className="mt-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  {imgSrc && (
                      <ReactCrop
                          crop={crop}
                          onChange={(_, percentCrop) => setCrop(percentCrop)}
                          onComplete={(c) => setCompletedCrop(c)}
                          aspect={PRODUCT_ASPECT}
                          className="w-full"
                      >
                          <img
                              ref={imgRef}
                              alt="Crop me"
                              src={imgSrc}
                              onLoad={onImageLoad}
                              className="w-full"
                          />
                      </ReactCrop>
                  )}
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCropperOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCropConfirm}>Confirmar Recorte</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* Edit Pedido Dialog */}
      <Dialog open={isEditPedidoOpen} onOpenChange={setIsEditPedidoOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar Pedido</DialogTitle>
            <DialogDescription>Modifica las cantidades ingresadas por color. Se ajustará el stock según los cambios.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] -mx-6 px-6">
            <div className="space-y-3 py-2">
              {pedidoEditingEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No hay items para este pedido.</p>
              ) : (
                pedidoEditingEntries.map((e) => {
                  const product = products.find(p => p.id === e.product_id);
                  const color = product?.colors.find(c => c.name === e.color_name);
                  const currentStock = color?.stock ?? 0;
                  const newQty = pedidoQuantities[e.id] ?? e.quantity_added;
                  const costValue = pedidoCosts[e.id] ?? (e.cost !== undefined && e.cost !== null ? e.cost.toString() : '0');
                  const quantityInputId = `pedido-qty-${e.id}`;
                  const costInputId = `pedido-cost-${e.id}`;
                  return (
                    <div key={e.id} className="grid grid-cols-1 md:grid-cols-5 items-center gap-2 border rounded-md p-2">
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium">{unslugify(e.product_name)}</p>
                        <p className="text-xs text-muted-foreground">{e.product_model} • {e.color_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={quantityInputId} className="text-xs text-muted-foreground">Cantidad</Label>
                        <Input
                          id={quantityInputId}
                          type="number"
                          min={0}
                          value={newQty}
                          onChange={(ev) => setPedidoQuantities(prev => ({ ...prev, [e.id]: Number(ev.target.value) }))}
                          className="w-24"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Stock actual: <span className="font-medium">{currentStock}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={costInputId} className="text-xs text-muted-foreground">Costo</Label>
                        <Input
                          id={costInputId}
                          type="number"
                          min={0}
                          step="0.01"
                          value={costValue}
                          onChange={(ev) => setPedidoCosts(prev => ({ ...prev, [e.id]: ev.target.value }))}
                          className="w-28"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSavePedidoEdit} disabled={isSavingPedidoEdit}>
              {isSavingPedidoEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}




