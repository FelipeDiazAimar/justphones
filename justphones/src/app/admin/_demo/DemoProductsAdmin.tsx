'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Edit, History, Minus, Package, Plus, Search, Star, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DEMO_ADMIN_CATEGORIES,
  categoryLabel,
  effectivePrice,
  formatAdminPrice,
  useDemoProducts,
  type DemoCategorySlug,
  type DemoProduct,
  type DemoProductInput,
} from './store';

interface FormState {
  nombre: string;
  descripcion: string;
  precio: string;
  precioOferta: string;
  categoria: DemoCategorySlug;
  modelos: string;
  colores: string;
  stock: string;
  imagen: string;
  destacado: boolean;
}

const EMPTY_FORM: FormState = {
  nombre: '',
  descripcion: '',
  precio: '',
  precioOferta: '',
  categoria: 'fundas',
  modelos: '',
  colores: '',
  stock: '',
  imagen: '',
  destacado: false,
};

function splitList(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function Thumb({ product }: { product: DemoProduct }) {
  const src = product.imagenes && product.imagenes[0];
  if (!src) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border bg-muted">
        <Package className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={product.nombre}
      loading="lazy"
      className="h-12 w-12 shrink-0 rounded-md border object-cover"
    />
  );
}

function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) {
    return <Badge variant="destructive">Sin stock</Badge>;
  }
  if (stock <= 5) {
    return (
      <Badge variant="outline" className="border-amber-400 text-amber-600">
        {stock} u. · Bajo
      </Badge>
    );
  }
  return <Badge variant="secondary">{stock} u.</Badge>;
}

function formToInput(form: FormState): DemoProductInput | { error: string } {
  const nombre = form.nombre.trim();
  if (!nombre) return { error: 'El nombre es requerido.' };
  const precio = Number(form.precio);
  if (!Number.isFinite(precio) || precio <= 0) return { error: 'El precio debe ser mayor a 0.' };
  let precioOferta: number | undefined;
  if (form.precioOferta.trim() !== '') {
    const oferta = Number(form.precioOferta);
    if (!Number.isFinite(oferta) || oferta < 0) {
      return { error: 'El precio de oferta no es válido.' };
    }
    if (oferta > 0 && oferta >= precio) {
      return { error: 'El precio de oferta debe ser menor al precio.' };
    }
    precioOferta = oferta > 0 ? oferta : undefined;
  }
  const stock = Number(form.stock);
  if (!Number.isFinite(stock) || stock < 0) {
    return { error: 'El stock no puede ser negativo.' };
  }
  const imagen = form.imagen.trim();
  if (imagen !== '' && !/^https?:\/\//i.test(imagen)) {
    return { error: 'La imagen debe ser una URL que comience con http.' };
  }
  return {
    nombre,
    descripcion: form.descripcion.trim(),
    precio,
    precioOferta,
    categoria: form.categoria,
    modelos: splitList(form.modelos),
    colores: splitList(form.colores),
    stock: Math.floor(stock),
    imagenes: imagen ? [imagen] : [],
    destacado: form.destacado,
  };
}

export function DemoProductsAdmin() {
  const { toast } = useToast();
  const {
    products,
    hydrated,
    createProduct,
    updateProduct,
    removeProduct,
    adjustStock,
    resetProducts,
  } = useDemoProducts();

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'todas' | DemoCategorySlug>('todas');
  const [sortBy, setSortBy] = useState('nombre-asc');
  const [lowOnly, setLowOnly] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [pendingDelete, setPendingDelete] = useState<DemoProduct | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const stats = useMemo(() => {
    const units = products.reduce((acc, p) => acc + p.stock, 0);
    const value = products.reduce((acc, p) => acc + effectivePrice(p) * p.stock, 0);
    const out = products.filter((p) => p.stock <= 0).length;
    return { total: products.length, units, value, out };
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (categoryFilter !== 'todas') {
      list = list.filter((p) => p.categoria === categoryFilter);
    }
    if (lowOnly) {
      list = list.filter((p) => p.stock <= 5);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.descripcion.toLowerCase().includes(q) ||
          p.modelos.some((m) => m.toLowerCase().includes(q)),
      );
    }
    switch (sortBy) {
      case 'nombre-desc':
        list.sort((a, b) => b.nombre.localeCompare(a.nombre));
        break;
      case 'precio-asc':
        list.sort((a, b) => effectivePrice(a) - effectivePrice(b));
        break;
      case 'precio-desc':
        list.sort((a, b) => effectivePrice(b) - effectivePrice(a));
        break;
      case 'stock-asc':
        list.sort((a, b) => a.stock - b.stock);
        break;
      case 'stock-desc':
        list.sort((a, b) => b.stock - a.stock);
        break;
      default:
        list.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
    }
    return list;
  }, [products, categoryFilter, lowOnly, query, sortBy]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (product: DemoProduct) => {
    setEditingId(product.id);
    setForm({
      nombre: product.nombre,
      descripcion: product.descripcion,
      precio: String(product.precio),
      precioOferta:
        typeof product.precioOferta === 'number' && product.precioOferta > 0
          ? String(product.precioOferta)
          : '',
      categoria: product.categoria,
      modelos: product.modelos.join(', '),
      colores: product.colores.join(', '),
      stock: String(product.stock),
      imagen: product.imagenes && product.imagenes[0] ? product.imagenes[0] : '',
      destacado: Boolean(product.destacado),
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const parsed = formToInput(form);
    if ('error' in parsed) {
      toast({ variant: 'destructive', title: 'Revisá el formulario', description: parsed.error });
      return;
    }
    if (editingId) {
      updateProduct(editingId, parsed);
      toast({ title: 'Producto actualizado', description: `"${parsed.nombre}" se guardó correctamente.` });
    } else {
      createProduct(parsed);
      toast({ title: 'Producto creado', description: `"${parsed.nombre}" se añadió al catálogo.` });
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!pendingDelete) return;
    removeProduct(pendingDelete.id);
    toast({ title: 'Producto eliminado', description: `"${pendingDelete.nombre}" fue eliminado.` });
    setPendingDelete(null);
  };

  const handleReset = () => {
    resetProducts();
    setConfirmReset(false);
    toast({ title: 'Datos restablecidos', description: 'Se restauraron los productos de ejemplo.' });
  };

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Productos</h2>
          <p className="text-sm text-muted-foreground">
            {stats.total} productos · {stats.units} unidades en stock
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => setConfirmReset(true)}>
            <History className="mr-2 h-4 w-4" />
            Restablecer
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo producto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Productos</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Unidades en stock</p>
            <p className="text-2xl font-bold">{stats.units}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Valor del stock</p>
            <p className="text-2xl font-bold">{formatAdminPrice(stats.value)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Sin stock</p>
            <p className={cn('text-2xl font-bold', stats.out > 0 && 'text-destructive')}>
              {stats.out}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, descripción o modelo…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter(v as 'todas' | DemoCategorySlug)}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las categorías</SelectItem>
              {DEMO_ADMIN_CATEGORIES.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nombre-asc">Nombre (A-Z)</SelectItem>
              <SelectItem value="nombre-desc">Nombre (Z-A)</SelectItem>
              <SelectItem value="precio-asc">Precio (menor)</SelectItem>
              <SelectItem value="precio-desc">Precio (mayor)</SelectItem>
              <SelectItem value="stock-asc">Stock (menor)</SelectItem>
              <SelectItem value="stock-desc">Stock (mayor)</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={lowOnly}
              onCheckedChange={(v) => setLowOnly(v === true)}
            />
            Stock bajo
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Package className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No se encontraron productos</p>
            <p className="text-sm text-muted-foreground">
              Probá con otra búsqueda o creá un producto nuevo.
            </p>
            <Button variant="outline" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo producto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Thumb product={p} />
                        <div>
                          <p className="flex items-center gap-1.5 font-medium">
                            {p.nombre}
                            {p.destacado && (
                              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {categoryLabel(p.categoria)}
                            {p.modelos.length > 0 && ` · ${p.modelos.slice(0, 2).join(', ')}`}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {typeof p.precioOferta === 'number' && p.precioOferta > 0 ? (
                        <span>
                          <span className="mr-2 text-xs text-muted-foreground line-through">
                            {formatAdminPrice(p.precio)}
                          </span>
                          <span className="font-medium text-primary">
                            {formatAdminPrice(p.precioOferta)}
                          </span>
                        </span>
                      ) : (
                        <span className="font-medium">{formatAdminPrice(p.precio)}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded-full"
                          onClick={() => adjustStock(p.id, -1)}
                          disabled={p.stock <= 0}
                          aria-label="Quitar una unidad"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-10 text-center text-sm font-medium">{p.stock}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded-full"
                          onClick={() => adjustStock(p.id, 1)}
                          aria-label="Agregar una unidad"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StockBadge stock={p.stock} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full"
                          onClick={() => openEdit(p)}
                          aria-label="Editar producto"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full text-destructive hover:text-destructive"
                          onClick={() => setPendingDelete(p)}
                          aria-label="Eliminar producto"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {filtered.map((p) => (
              <Card key={p.id}>
                <CardContent className="flex gap-3 p-4">
                  <img
                    src={p.imagenes && p.imagenes[0] ? p.imagenes[0] : undefined}
                    alt={p.nombre}
                    loading="lazy"
                    className={cn(
                      'h-16 w-16 shrink-0 rounded-md border object-cover',
                      (!p.imagenes || !p.imagenes[0]) && 'hidden',
                    )}
                  />
                  {(!p.imagenes || !p.imagenes[0]) && (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border bg-muted">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate font-medium">
                      <span className="truncate">{p.nombre}</span>
                      {p.destacado && (
                        <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{categoryLabel(p.categoria)}</p>
                    <p className="mt-1 text-sm font-medium text-primary">
                      {formatAdminPrice(effectivePrice(p))}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded-full"
                          onClick={() => adjustStock(p.id, -1)}
                          disabled={p.stock <= 0}
                          aria-label="Quitar una unidad"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{p.stock}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded-full"
                          onClick={() => adjustStock(p.id, 1)}
                          aria-label="Agregar una unidad"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-1">
                        <StockBadge stock={p.stock} />
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end gap-1 border-t pt-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => openEdit(p)}
                        aria-label="Editar producto"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-destructive hover:text-destructive"
                        onClick={() => setPendingDelete(p)}
                        aria-label="Eliminar producto"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <p className="text-xs text-muted-foreground">
        Los cambios se guardan solo en este navegador.
      </p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Modificá los datos del producto.'
                : 'Completá los datos para agregar un producto al catálogo.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="demo-nombre">Nombre</Label>
              <Input
                id="demo-nombre"
                value={form.nombre}
                onChange={(e) => setField('nombre', e.target.value)}
                placeholder="Ej: Funda MagSafe Transparente iPhone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-descripcion">Descripción</Label>
              <Textarea
                id="demo-descripcion"
                value={form.descripcion}
                onChange={(e) => setField('descripcion', e.target.value)}
                placeholder="Descripción del producto…"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="demo-precio">Precio</Label>
                <Input
                  id="demo-precio"
                  type="number"
                  min={0}
                  value={form.precio}
                  onChange={(e) => setField('precio', e.target.value)}
                  placeholder="8900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="demo-oferta">Precio oferta</Label>
                <Input
                  id="demo-oferta"
                  type="number"
                  min={0}
                  value={form.precioOferta}
                  onChange={(e) => setField('precioOferta', e.target.value)}
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="demo-stock">Stock</Label>
                <Input
                  id="demo-stock"
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => setField('stock', e.target.value)}
                  placeholder="20"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select
                  value={form.categoria}
                  onValueChange={(v) => setField('categoria', v as DemoCategorySlug)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEMO_ADMIN_CATEGORIES.map((c) => (
                      <SelectItem key={c.slug} value={c.slug}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="demo-imagen">Imagen (URL)</Label>
                <Input
                  id="demo-imagen"
                  value={form.imagen}
                  onChange={(e) => setField('imagen', e.target.value)}
                  placeholder="https://…"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="demo-modelos">Modelos (separados por coma)</Label>
                <Input
                  id="demo-modelos"
                  value={form.modelos}
                  onChange={(e) => setField('modelos', e.target.value)}
                  placeholder="iPhone 16, iPhone 15"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="demo-colores">Colores (separados por coma)</Label>
                <Input
                  id="demo-colores"
                  value={form.colores}
                  onChange={(e) => setField('colores', e.target.value)}
                  placeholder="Negro, Blanco"
                />
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={form.destacado}
                onCheckedChange={(v) => setField('destacado', v === true)}
              />
              Producto destacado
            </label>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleSave}>
              {editingId ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `Esta acción eliminará "${pendingDelete.nombre}" del catálogo demo.`
                : 'Esta acción no se puede deshacer.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Restablecer productos?</AlertDialogTitle>
            <AlertDialogDescription>
              Se descartarán los cambios guardados en este navegador y volverán los productos de
              ejemplo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Restablecer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
