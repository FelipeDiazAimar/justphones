
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Trash, Edit, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { useSubcategories } from '@/hooks/use-subcategories';
import type { Subcategories } from '@/hooks/use-subcategories';
import { unslugify, slugify } from '@/lib/utils';
import { useProducts } from '@/hooks/use-products';

const nameSchema = z.object({
    name: z.string().min(1, "El nombre es requerido."),
});

export default function AdminNamesPage() {
  const { products, isLoading: isLoadingProducts } = useProducts();
  const { subcategories, addSubcategory, updateSubcategory, deleteSubcategory, isLoading: isLoadingSubcategories } = useSubcategories();

  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [nameDialogData, setNameDialogData] = useState<{
    mode: 'add' | 'edit';
    category: keyof Subcategories;
    oldName?: string;
  } | null>(null);

  const { toast } = useToast();

  const {
    register: registerName,
    handleSubmit: handleSubmitName,
    reset: resetName,
    setValue: setNameValue,
    formState: { errors: errorsName },
  } = useForm<z.infer<typeof nameSchema>>({
    resolver: zodResolver(nameSchema),
  });

  const handleAddName = (category: keyof Subcategories) => {
    resetName({ name: '' });
    setNameDialogData({ mode: 'add', category });
    setIsNameDialogOpen(true);
  };

  const handleEditName = (category: keyof Subcategories, name: string) => {
    setNameValue('name', unslugify(name));
    setNameDialogData({ mode: 'edit', category, oldName: name });
    setIsNameDialogOpen(true);
  };

  const handleDeleteName = async (category: keyof Subcategories, name: string) => {
    const isUsed = products.some(p => p.category === category && p.name === name);
    if (isUsed) {
      toast({
        variant: 'destructive',
        title: 'Error al eliminar',
        description: 'El nombre está en uso por uno o más productos y no puede ser eliminado.',
      });
      return;
    }
    const success = await deleteSubcategory(name, category);
    if(success) toast({ title: 'Nombre eliminado' });
  };

  const onNameSubmit = async (data: z.infer<typeof nameSchema>) => {
    if (!nameDialogData) return;

    const { mode, category, oldName } = nameDialogData;
    const newSlug = slugify(data.name);

    let success;
    if (mode === 'edit' && oldName) {
      if (newSlug !== oldName && subcategories[category].includes(newSlug)) {
        toast({ variant: 'destructive', title: 'Error', description: 'Ya existe un nombre con este nombre.' });
        return;
      }
      success = await updateSubcategory(oldName, data.name, category);
      if(success) toast({ title: 'Nombre actualizado' });

    } else if (mode === 'add') {
      if (subcategories[category].includes(newSlug)) {
        toast({ variant: 'destructive', title: 'Error', description: 'Ya existe un nombre con este nombre.' });
        return;
      }
      success = await addSubcategory(data.name, category);
      if(success) toast({ title: 'Nombre creado' });
    }

    if(success) {
      setIsNameDialogOpen(false);
      setNameDialogData(null);
    }
  };

  const isLoading = isLoadingProducts || isLoadingSubcategories;

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-1/2 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mt-8 mb-6">
          <h2 className="text-2xl font-bold">Gestión de Nombres por Categoría</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(Object.keys(subcategories) as Array<keyof Subcategories>).map((category) => (
              <div key={category}>
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold capitalize">{category === 'case' ? 'Fundas' : category}</h3>
                      <Button size="sm" onClick={() => handleAddName(category)}>
                          <PlusCircle className="mr-2 h-4 w-4" /> Añadir
                      </Button>
                  </div>
                  <Card>
                      <CardContent className="p-4 space-y-2">
                          {subcategories[category].length > 0 ? (
                              subcategories[category].map(name => (
                              <div key={name} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                  <span className="text-sm">{unslugify(name)}</span>
                                  <div className="flex items-center">
                                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleEditName(category, name)}>
                                          <Edit className="h-4 w-4" />
                                      </Button>
                                      <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive rounded-full">
                                                  <Trash className="h-4 w-4" />
                                              </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                              <AlertDialogHeader>
                                                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                  <AlertDialogDescription>
                                                      Esta acción no se puede deshacer. Esto eliminará permanentemente el nombre.
                                                  </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                  <AlertDialogAction onClick={() => handleDeleteName(category, name)} className="bg-destructive hover:bg-destructive/90">
                                                      Eliminar
                                                  </AlertDialogAction>
                                              </AlertDialogFooter>
                                          </AlertDialogContent>
                                      </AlertDialog>
                                  </div>
                              </div>
                              ))
                          ) : (
                              <p className="text-sm text-muted-foreground p-2">No hay nombres.</p>
                          )}
                      </CardContent>
                  </Card>
              </div>
          ))}
      </div>
      <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{nameDialogData?.mode === 'edit' ? 'Editar' : 'Añadir'} Nombre</DialogTitle>
                    <DialogDescription>
                        Gestiona los nombres para la categoría <span className="font-bold capitalize">{nameDialogData?.category}</span>.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitName(onNameSubmit)} className="grid gap-4 py-4">
                    <div>
                        <Label htmlFor="name-name">Nombre</Label>
                        <Input id="name-name" {...registerName('name')} className="mt-2" />
                        {errorsName.name && <p className="text-red-500 text-sm mt-1">{errorsName.name.message}</p>}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancelar</Button>
                        </DialogClose>
                        <Button type="submit">Guardar</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </>
  );
}
