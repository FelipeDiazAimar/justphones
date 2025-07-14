
'use client';

import React, { useState, useMemo } from 'react';
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
import { useModels } from '@/hooks/use-models';
import type { ModelsByCategory } from '@/hooks/use-models';
import { useProducts } from '@/hooks/use-products';


const modelSchema = z.object({
    name: z.string().min(1, "El nombre es requerido."),
});

export default function AdminModelsPage() {
  const { products, isLoading: isLoadingProducts } = useProducts();
  const { models, addModel, updateModel, deleteModel, isLoading: isLoadingModels } = useModels();

  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
  const [modelDialogData, setModelDialogData] = useState<{
    mode: 'add' | 'edit';
    category: keyof ModelsByCategory;
    oldName?: string;
  } | null>(null);

  const { toast } = useToast();

  const {
    register: registerModel,
    handleSubmit: handleSubmitModel,
    reset: resetModel,
    setValue: setModelValue,
    formState: { errors: errorsModel },
  } = useForm<z.infer<typeof modelSchema>>({
    resolver: zodResolver(modelSchema),
  });

  const caseModels = useMemo(() => models.case || [], [models]);
  const accessoryModels = useMemo(() => models.accessory || [], [models]);
  const auricularesModels = useMemo(() => models.auriculares || [], [models]);

  const handleAddNewModel = (category: keyof ModelsByCategory) => {
    resetModel({ name: '' });
    setModelDialogData({ mode: 'add', category });
    setIsModelDialogOpen(true);
  };

  const handleEditModel = (modelName: string, category: keyof ModelsByCategory) => {
    setModelValue('name', modelName);
    setModelDialogData({ mode: 'edit', category, oldName: modelName });
    setIsModelDialogOpen(true);
  };

  const handleDeleteModel = async (modelName: string, category: keyof ModelsByCategory) => {
    const isUsed = products.some(p => p.model === modelName && p.category === category);
    if (isUsed) {
      toast({
        variant: 'destructive',
        title: 'Error al eliminar',
        description: 'El modelo está en uso por uno o más productos y no puede ser eliminado.',
      });
      return;
    }
    const success = await deleteModel(modelName, category);
    if(success) toast({ title: 'Modelo eliminado' });
  };

  const onModelSubmit = async (data: z.infer<typeof modelSchema>) => {
    if (!modelDialogData) return;
    const { mode, category, oldName } = modelDialogData;
    const newModelName = data.name;
    let success;

    if (mode === 'edit' && oldName) {
      if (newModelName !== oldName && models[category]?.includes(newModelName)) {
        toast({ variant: 'destructive', title: 'Error', description: 'Ya existe un modelo con este nombre en esta categoría.' });
        return;
      }
      success = await updateModel(oldName, newModelName, category);
      if (success) toast({ title: 'Modelo actualizado' });

    } else if (mode === 'add') {
      if (models[category]?.includes(newModelName)) {
        toast({ variant: 'destructive', title: 'Error', description: 'Ya existe un modelo con este nombre en esta categoría.' });
        return;
      }
      success = await addModel(newModelName, category);
      if (success) toast({ title: 'Modelo creado' });
    }
    
    if(success) {
      setIsModelDialogOpen(false);
      setModelDialogData(null);
    }
  };

  const isLoading = isLoadingProducts || isLoadingModels;

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
          <h2 className="text-2xl font-bold">Gestión de Modelos</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold capitalize">Fundas</h3>
                  <Button size="sm" onClick={() => handleAddNewModel('case')}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Añadir
                  </Button>
              </div>
              <Card>
                  <CardContent className="p-4 space-y-2">
                      {caseModels.length > 0 ? (
                          caseModels.map(model => (
                          <div key={`case-${model}`} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                              <span className="text-sm">{model}</span>
                              <div className="flex items-center">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleEditModel(model, 'case')}>
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
                                                  Esta acción no se puede deshacer. Esto eliminará permanentemente el modelo.
                                              </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleDeleteModel(model, 'case')} className="bg-destructive hover:bg-destructive/90">
                                                  Eliminar
                                              </AlertDialogAction>
                                          </AlertDialogFooter>
                                      </AlertDialogContent>
                                  </AlertDialog>
                              </div>
                          </div>
                          ))
                      ) : (
                          <p className="text-sm text-muted-foreground p-2">No hay modelos de iPhone.</p>
                      )}
                  </CardContent>
              </Card>
          </div>

          <div>
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold capitalize">Accesorios</h3>
                  <Button size="sm" onClick={() => handleAddNewModel('accessory')}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Añadir
                  </Button>
              </div>
              <Card>
                  <CardContent className="p-4 space-y-2">
                      {accessoryModels.length > 0 ? (
                          accessoryModels.map(model => (
                          <div key={`accessory-${model}`} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                              <span className="text-sm">{model}</span>
                              <div className="flex items-center">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleEditModel(model, 'accessory')}>
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
                                                  Esta acción no se puede deshacer. Esto eliminará permanentemente el modelo.
                                              </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleDeleteModel(model, 'accessory')} className="bg-destructive hover:bg-destructive/90">
                                                  Eliminar
                                              </AlertDialogAction>
                                          </AlertDialogFooter>
                                      </AlertDialogContent>
                                  </AlertDialog>
                              </div>
                          </div>
                          ))
                      ) : (
                          <p className="text-sm text-muted-foreground p-2">No hay modelos.</p>
                      )}
                  </CardContent>
              </Card>
          </div>

          <div>
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold capitalize">Auriculares</h3>
                  <Button size="sm" onClick={() => handleAddNewModel('auriculares')}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Añadir
                  </Button>
              </div>
              <Card>
                  <CardContent className="p-4 space-y-2">
                      {auricularesModels.length > 0 ? (
                          auricularesModels.map(model => (
                          <div key={`auriculares-${model}`} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                              <span className="text-sm">{model}</span>
                              <div className="flex items-center">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleEditModel(model, 'auriculares')}>
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
                                                  Esta acción no se puede deshacer. Esto eliminará permanentemente el modelo.
                                              </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleDeleteModel(model, 'auriculares')} className="bg-destructive hover:bg-destructive/90">
                                                  Eliminar
                                              </AlertDialogAction>
                                          </AlertDialogFooter>
                                      </AlertDialogContent>
                                  </AlertDialog>
                              </div>
                          </div>
                          ))
                      ) : (
                          <p className="text-sm text-muted-foreground p-2">No hay modelos genéricos.</p>
                      )}
                  </CardContent>
              </Card>
          </div>
      </div>
      <Dialog open={isModelDialogOpen} onOpenChange={setIsModelDialogOpen}>
          <DialogContent className="sm:max-w-md">
              <DialogHeader>
                  <DialogTitle>{modelDialogData?.mode === 'edit' ? 'Editar' : 'Añadir'} Modelo</DialogTitle>
                  <DialogDescription>
                      Gestiona los modelos para la categoría <span className="font-bold capitalize">{modelDialogData?.category}</span>.
                  </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitModel(onModelSubmit)} className="grid gap-4 py-4">
                  <div>
                      <Label htmlFor="model-name">Nombre del Modelo</Label>
                      <Input id="model-name" {...registerModel('name')} className="mt-2" />
                      {errorsModel.name && <p className="text-red-500 text-sm mt-1">{errorsModel.name.message}</p>}
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
