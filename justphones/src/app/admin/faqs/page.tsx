
'use client';

import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { FAQ } from '@/lib/faq';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Trash, Edit, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFaqs } from '@/hooks/use-faqs';
import { Skeleton } from '@/components/ui/skeleton';

const faqSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(10, "La pregunta debe tener al menos 10 caracteres."),
  answer: z.string().min(10, "La respuesta debe tener al menos 10 caracteres."),
});

export default function AdminFaqsPage() {
  const { faqs, addFaq, updateFaq, deleteFaq, isLoading: isLoadingFaqs } = useFaqs();

  const [isFaqDialogOpen, setIsFaqDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  
  const { toast } = useToast();

  const {
    register: registerFaq,
    handleSubmit: handleSubmitFaq,
    reset: resetFaq,
    formState: { errors: errorsFaq },
  } = useForm<Omit<FAQ, 'id'>>({
    resolver: zodResolver(faqSchema.omit({ id: true })),
    defaultValues: {
      question: '',
      answer: '',
    },
  });

  const handleAddNewFaq = () => {
    resetFaq({ question: '', answer: '' });
    setEditingFaq(null);
    setIsFaqDialogOpen(true);
  };

  const handleEditFaq = (faq: FAQ) => {
    resetFaq(faq);
    setEditingFaq(faq);
    setIsFaqDialogOpen(true);
  };

  const handleDeleteFaq = async (faqId: string) => {
    const success = await deleteFaq(faqId);
    if(success) toast({ title: "Pregunta eliminada", description: "La pregunta frecuente ha sido eliminada." });
  };

  const onFaqSubmit = async (data: Omit<FAQ, 'id'>) => {
    let success;
    if (editingFaq) {
      success = await updateFaq(editingFaq.id, data);
      if (success) toast({ title: "Pregunta actualizada", description: "La pregunta frecuente ha sido actualizada." });
    } else {
      success = await addFaq(data);
      if (success) toast({ title: "Pregunta creada", description: "La nueva pregunta frecuente ha sido añadida." });
    }
    if(success) {
      setIsFaqDialogOpen(false);
    }
  };

  if (isLoadingFaqs) {
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
          <h2 className="text-2xl font-bold">Gestión de FAQs</h2>
          <Button onClick={handleAddNewFaq}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear FAQ
          </Button>
      </div>
      <div className="border rounded-lg">
          <Table>
              <TableHeader>
                  <TableRow>
                      <TableHead className="w-[40%]">Pregunta</TableHead>
                      <TableHead className="w-[50%]">Respuesta</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {faqs.map((faq) => (
                      <TableRow key={faq.id}>
                          <TableCell className="font-medium py-2 px-4 align-top">{faq.question}</TableCell>
                          <TableCell className="py-2 px-4 align-top text-muted-foreground">{faq.answer}</TableCell>
                          <TableCell className="text-right py-2 px-4 align-top">
                              <div className="flex items-center justify-end space-x-2">
                                  <Button variant="ghost" size="icon" onClick={() => handleEditFaq(faq)} className="rounded-full">
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
                                                  Esta acción no se puede deshacer. Esto eliminará permanentemente la pregunta.
                                              </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleDeleteFaq(faq.id)} className="bg-destructive hover:bg-destructive/90">
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
       <Dialog open={isFaqDialogOpen} onOpenChange={setIsFaqDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingFaq ? 'Editar FAQ' : 'Crear FAQ'}</DialogTitle>
            <DialogDescription>
                {editingFaq ? 'Modifica la pregunta y respuesta.' : 'Añade una nueva pregunta frecuente.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitFaq(onFaqSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
              <Label htmlFor="question" className="md:text-right">Pregunta</Label>
              <Textarea id="question" {...registerFaq('question')} className="md:col-span-3" />
              {errorsFaq.question && <p className="md:col-span-3 md:col-start-2 text-red-500 text-sm">{errorsFaq.question.message}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
                <Label htmlFor="answer" className="md:text-right">Respuesta</Label>
                <Textarea id="answer" {...registerFaq('answer')} className="md:col-span-3" rows={5}/>
                {errorsFaq.answer && <p className="md:col-span-3 md:col-start-2 text-red-500 text-sm">{errorsFaq.answer.message}</p>}
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
    </>
  );
}
