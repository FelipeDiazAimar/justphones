
'use client';

import React, { useState, useCallback, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Trash, Edit, PlusCircle, Tag, Check, Copy, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import type { DiscountCode } from '@/lib/discount-codes';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

const codeSchema = z.object({
  id: z.string().optional(),
  code: z.string().optional().refine(val => !val || !/\s/.test(val), {
    message: "El código no puede contener espacios."
  }),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  percentage: z.coerce.number().int().min(1, "El porcentaje debe ser al menos 1%").max(100, "El porcentaje no puede ser mayor a 100%"),
  description: z.string().optional(),
  expires_at: z.date().optional().nullable(),
  conditions: z.string().optional(),
  usage_limit: z.coerce.number().int().min(0, "El límite de usos no puede ser negativo.").optional().nullable(),
  is_active: z.boolean().default(true),
});

export default function AdminCodigosPage() {
  const supabase = createClient();
  const { toast } = useToast();
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);

  const fetchCodes = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching codes:', error.message);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los códigos de descuento.' });
    } else {
      setCodes(data as DiscountCode[]);
    }
    setIsLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);
  
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof codeSchema>>({
    resolver: zodResolver(codeSchema),
  });

  const expiresAtValue = watch('expires_at');

  const handleAddNewCode = () => {
    reset({
      code: '',
      name: '',
      percentage: 10,
      description: '',
      expires_at: null,
      conditions: '',
      usage_limit: null,
      is_active: true,
    });
    setEditingCode(null);
    setIsDialogOpen(true);
  };

  const handleEditCode = (code: DiscountCode) => {
    reset({
      ...code,
      expires_at: code.expires_at ? new Date(code.expires_at) : null,
      usage_limit: code.usage_limit ?? null,
    });
    setEditingCode(code);
    setIsDialogOpen(true);
  };
  
  const handleDeleteCode = async (codeId: string) => {
    const { error } = await supabase.from('discount_codes').delete().eq('id', codeId);
    if (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el código.' });
    } else {
        toast({ title: 'Código eliminado' });
        fetchCodes();
    }
  };

  const onCodeSubmit = async (data: z.infer<typeof codeSchema>) => {
    let success = false;
    
    const submissionData: Partial<DiscountCode> = {
        name: data.name,
        percentage: data.percentage,
        description: data.description,
        expires_at: data.expires_at ? data.expires_at.toISOString() : null,
        conditions: data.conditions,
        usage_limit: data.usage_limit || null,
        is_active: data.is_active,
    };
    
    // Solo incluir el código si se proporciona
    if (data.code) {
        submissionData.code = data.code.toUpperCase();
    }

    if (editingCode) {
      // Al editar, no se cambia el código, pero se actualiza el resto
      delete submissionData.code;
      const { error } = await supabase.from('discount_codes').update(submissionData).eq('id', editingCode.id);
      if (error) {
        toast({ variant: 'destructive', title: 'Error', description: `No se pudo actualizar el código: ${error.message}` });
      } else {
        toast({ title: 'Código actualizado' });
        success = true;
      }
    } else {
      const { error } = await supabase.from('discount_codes').insert([submissionData]);
      if (error) {
        const description = error.message.includes('duplicate key value violates unique constraint "discount_codes_code_key"')
          ? 'Ya existe un código con ese nombre. Por favor, elige otro.'
          : `No se pudo crear el código: ${error.message}`;
        toast({ variant: 'destructive', title: 'Error', description });
      } else {
        toast({ title: 'Código creado' });
        success = true;
      }
    }

    if (success) {
      setIsDialogOpen(false);
      fetchCodes();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ description: "Código copiado al portapapeles." });
  };
  
  const handleCopyMessage = (code: DiscountCode) => {
    let message = `¡Hola! 👋 Tenemos un cupón de descuento especial para vos:\n\n`;
    message += `🎉 *${code.name}* 🎉\n\n`;

    if (code.description) {
        message += `> ${code.description}\n\n`;
    }

    message += `Con este cupón, obtenés un *${code.percentage}% de descuento* en tu próxima compra.\n\n`;
    message += `🏷️ Tu código es: *${code.code}*\n\n`;
    
    if (code.conditions) {
        message += `Condiciones: ${code.conditions}\n\n`;
    }

    if (code.expires_at) {
        message += `¡No te lo pierdas! Válido hasta el ${new Date(code.expires_at).toLocaleDateString()}.\n`;
    } else {
        message += `¡No te lo pierdas!\n`;
    }

    navigator.clipboard.writeText(message);
    toast({
        title: "Mensaje Copiado",
        description: "El mensaje de marketing para el cupón se ha copiado al portapapeles."
    });
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-9 w-1/4" />
            <Skeleton className="h-10 w-40" />
        </div>
        <div className="border rounded-lg p-4">
            <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mt-8 mb-6">
        <h2 className="text-2xl font-bold">Gestión de Códigos de Descuento</h2>
        <Button onClick={handleAddNewCode}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Código
        </Button>
      </div>
      <div className="border rounded-lg hidden md:block">
          <Table>
              <TableHeader>
                  <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Porcentaje</TableHead>
                      <TableHead>Usos</TableHead>
                      <TableHead>Expira</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {codes.map((code) => (
                      <TableRow key={code.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold">{code.code}</span>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(code.code)}>
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{code.name}</TableCell>
                          <TableCell><Badge variant="secondary">{code.percentage}% OFF</Badge></TableCell>
                          <TableCell>{code.usage_count} / {code.usage_limit ?? '∞'}</TableCell>
                          <TableCell>{code.expires_at ? new Date(code.expires_at).toLocaleDateString() : 'Nunca'}</TableCell>
                          <TableCell>
                            <Badge variant={code.is_active ? 'default' : 'destructive'} className={cn(code.is_active ? 'bg-green-500' : '')}>{code.is_active ? 'Activo' : 'Inactivo'}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-1">
                                <Button variant="ghost" size="icon" onClick={() => handleCopyMessage(code)} className="rounded-full">
                                  <Send className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleEditCode(code)} className="rounded-full">
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
                                                Esta acción no se puede deshacer. Esto eliminará permanentemente el código.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteCode(code.id)} className="bg-destructive hover:bg-destructive/90">
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
      
      <div className="md:hidden space-y-4">
        {codes.map((code) => (
            <Card key={code.id}>
                <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono font-semibold text-lg">{code.code}</span>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(code.code)}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            <h3 className="font-bold text-base">{code.name}</h3>
                        </div>
                        <Badge variant="secondary" className="text-base">{code.percentage}% OFF</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1 mt-3">
                        <div>
                            <span className="font-medium">Estado:</span>
                            <Badge variant={code.is_active ? 'default' : 'destructive'} className={cn('ml-2', code.is_active ? 'bg-green-500' : '')}>
                                {code.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                        </div>
                        <div>
                            <span className="font-medium">Usos:</span> {code.usage_count} / {code.usage_limit ?? '∞'}
                        </div>
                        <div>
                            <span className="font-medium">Expira:</span> {code.expires_at ? new Date(code.expires_at).toLocaleDateString() : 'Nunca'}
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-1 border-t mt-3 pt-3">
                        <Button variant="ghost" size="icon" onClick={() => handleCopyMessage(code)} className="rounded-full">
                            <Send className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditCode(code)} className="rounded-full">
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
                                        Esta acción no se puede deshacer. Esto eliminará permanentemente el código.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteCode(code.id)} className="bg-destructive hover:bg-destructive/90">
                                        Eliminar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{editingCode ? 'Editar Código' : 'Crear Código de Descuento'}</DialogTitle>
                <DialogDescription>
                    {editingCode ? 'Modifica los detalles del código.' : 'Completa el formulario para generar un nuevo código.'}
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onCodeSubmit)} className="space-y-4 py-4">
                 <div className="space-y-2">
                    <Label htmlFor="code">Código (Opcional)</Label>
                    <Input id="code" {...register('code')} placeholder="Aleatorio si se deja vacío" disabled={!!editingCode} />
                    {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input id="name" {...register('name')} placeholder="Ej: Venta de Verano" />
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="percentage">Porcentaje (%)</Label>
                        <Input id="percentage" type="number" {...register('percentage')} placeholder="15" />
                        {errors.percentage && <p className="text-red-500 text-sm mt-1">{errors.percentage.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Descripción (Opcional)</Label>
                    <Textarea id="description" {...register('description')} placeholder="Breve descripción del propósito del código" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="conditions">Condiciones (Opcional)</Label>
                    <Textarea id="conditions" {...register('conditions')} placeholder="Ej: Solo para fundas de iPhone 15, compra mínima de $10000" />
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label>Fecha de Expiración</Label>
                        <Controller
                            name="expires_at"
                            control={control}
                            render={({ field }) => (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? format(field.value, "PPP") : <span>Sin fecha límite</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={field.value ?? undefined}
                                            onSelect={(date) => field.onChange(date || null)}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="usage_limit">Límite de Usos (0 para ilimitado)</Label>
                        <Input id="usage_limit" type="number" {...register('usage_limit')} placeholder="100" />
                        {errors.usage_limit && <p className="text-red-500 text-sm mt-1">{errors.usage_limit.message}</p>}
                    </div>
                 </div>
                 
                 <div className="flex items-center space-x-2">
                    <Controller
                        control={control}
                        name="is_active"
                        render={({ field }) => (
                           <Switch
                              id="is_active"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                        )}
                    />
                    <Label htmlFor="is_active">Código Activo</Label>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit">{editingCode ? 'Guardar Cambios' : 'Crear Código'}</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
