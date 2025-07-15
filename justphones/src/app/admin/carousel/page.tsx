
'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import type { CarouselImage } from '@/lib/carousel';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Trash, Edit, PlusCircle, UploadCloud, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useCarouselImages } from '@/hooks/use-carousel-images';
import { createClient } from '@/lib/supabase/client';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';

const CAROUSEL_ASPECT = 1200 / 400;

const carouselImageSchema = z.object({
  id: z.string().optional(),
  image_url: z.any().optional(),
  alt_text: z.string().optional(),
  sort_order: z.coerce.number().int("El orden debe ser un número entero."),
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

export default function AdminCarouselPage() {
  const supabase = createClient();
  const { carouselImages, addCarouselImage, updateCarouselImage, deleteCarouselImage, isLoading: isLoadingCarousel } = useCarouselImages();
  
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<CarouselImage | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Cropping state
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [imgSrc, setImgSrc] = useState('');
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
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
    register: registerImage,
    handleSubmit: handleSubmitImage,
    reset: resetImage,
    control: controlImage,
    watch: watchImage,
    setValue: setImageValue,
    formState: { errors: errorsImage },
  } = useForm<z.infer<typeof carouselImageSchema>>({
    resolver: zodResolver(carouselImageSchema),
    defaultValues: {
      image_url: '',
      alt_text: '',
      sort_order: 0,
    },
  });

  const watchedImageUrl = watchImage('image_url');

  useEffect(() => {
    if (watchedImageUrl instanceof File) {
        setImagePreview(URL.createObjectURL(watchedImageUrl));
    } else if (typeof watchedImageUrl === 'string' && watchedImageUrl) {
        setImagePreview(watchedImageUrl);
    } else {
        setImagePreview(null);
    }
  }, [watchedImageUrl]);

  const handleAddNewImage = () => {
    resetImage({ image_url: '', alt_text: '', sort_order: 0 });
    setEditingImage(null);
    setImagePreview(null);
    setIsImageDialogOpen(true);
  };

  const handleEditImage = (image: CarouselImage) => {
    resetImage({
      ...image,
      image_url: image.image_url
    });
    setEditingImage(image);
    setImagePreview(image.image_url);
    setIsImageDialogOpen(true);
  };

  const handleDeleteImage = async (imageId: string) => {
    const success = await deleteCarouselImage(imageId);
    if (success) {
      toast({ title: "Imagen eliminada", description: "La imagen ha sido eliminada del carrusel." });
    }
  };

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
      const { width, height } = e.currentTarget;
      setCrop(centerCrop(
          makeAspectCrop({ unit: '%', width: 90 }, CAROUSEL_ASPECT, width, height),
          width,
          height
      ));
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        setCrop(undefined); // Makes crop preview update between images
        const file = e.target.files[0];
        setOriginalFile(file);
        const reader = new FileReader();
        reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
        reader.readAsDataURL(file);
        setIsCropperOpen(true);
        e.target.value = ''; // Reset input to allow re-uploading the same file
    }
  };

  const handleCropConfirm = async () => {
      if (!completedCrop || !imgRef.current || !originalFile) {
          toast({ variant: 'destructive', title: 'Error de recorte', description: 'No se pudo procesar la imagen recortada.' });
          return;
      }
      try {
          const croppedImageFile = await getCroppedImg(imgRef.current, completedCrop, originalFile.name);
          setImageValue('image_url', croppedImageFile, { shouldValidate: true });
          setIsCropperOpen(false);
          setImgSrc('');
      } catch (error) {
          console.error('Error cropping image:', error);
          toast({ variant: 'destructive', title: 'Error', description: 'Ocurrió un error al recortar la imagen.' });
      }
  };

  const onImageSubmit = async (data: z.infer<typeof carouselImageSchema>) => {
    let success;
    let finalImageUrl = '';

    if (data.image_url instanceof File) {
      const file = data.image_url;
      const filePath = `public/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
          .from('carousel-images')
          .upload(filePath, file);

      if (uploadError) {
          handleStorageError(uploadError, 'Error al subir imagen');
          return;
      }

      const { data: urlData } = supabase.storage.from('carousel-images').getPublicUrl(filePath);
      finalImageUrl = urlData.publicUrl;

    } else if (typeof data.image_url === 'string' && data.image_url.trim()) {
        finalImageUrl = data.image_url;
    } else {
        finalImageUrl = 'https://placehold.co/1200x400.png';
    }
    
    const imageData = {
      image_url: finalImageUrl,
      alt_text: data.alt_text,
      sort_order: data.sort_order,
    };

    if (editingImage) {
      success = await updateCarouselImage(editingImage.id, imageData);
      if (success) toast({ title: "Imagen actualizada", description: "La imagen del carrusel ha sido actualizada." });
    } else {
      success = await addCarouselImage(imageData);
      if (success) toast({ title: "Imagen añadida", description: "La nueva imagen ha sido añadida al carrusel." });
    }
    if (success) {
      setIsImageDialogOpen(false);
      setImagePreview(null);
    }
  };

  if (isLoadingCarousel) {
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
          <h2 className="text-2xl font-bold">Gestión de Carrusel</h2>
          <Button onClick={handleAddNewImage}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Imagen
          </Button>
      </div>
      <div className="border rounded-lg">
          <Table>
              <TableHeader>
                  <TableRow>
                      <TableHead>Imagen</TableHead>
                      <TableHead>Texto Alternativo</TableHead>
                      <TableHead className="w-[100px]">Orden</TableHead>
                      <TableHead className="text-right w-[150px]">Acciones</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {carouselImages.map((image) => (
                      <TableRow key={image.id}>
                          <TableCell>
                              <Image src={image.image_url} alt={image.alt_text || 'Carousel image'} width={120} height={40} className="object-cover rounded-md bg-muted" />
                          </TableCell>
                          <TableCell className="text-muted-foreground">{image.alt_text || 'Sin texto'}</TableCell>
                          <TableCell>{image.sort_order}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEditImage(image)} className="rounded-full">
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
                                                Esta acción no se puede deshacer. Esto eliminará permanentemente la imagen del carrusel.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteImage(image.id)} className="bg-destructive hover:bg-destructive/90">
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
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>{editingImage ? 'Editar Imagen' : 'Añadir Imagen'}</DialogTitle>
                <DialogDescription>
                    Gestiona las imágenes que aparecen en el carrusel de la página principal.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitImage(onImageSubmit)} className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-4">
                    <Label className="md:text-right pt-2">Imagen</Label>
                    <div className="col-span-3">
                        <Controller
                            name="image_url"
                            control={controlImage}
                            render={({ field: { onChange, value, name, ref } }) => (
                                <div className="flex flex-col gap-3">
                                    <label
                                        htmlFor="image-upload-input"
                                        className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-card"
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                            <p className="mb-2 text-sm text-muted-foreground">
                                                <span className="font-semibold">Click para subir</span> o arrastra y suelta
                                            </p>
                                            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (1200x400)</p>
                                        </div>
                                        <input
                                            id="image-upload-input"
                                            type="file"
                                            className="hidden"
                                            accept="image/png, image/jpeg, image/webp"
                                            onChange={handleFileChange}
                                        />
                                    </label>

                                    {imagePreview && (
                                        <div className="relative w-full aspect-video rounded-md overflow-hidden border">
                                            <Image src={imagePreview} alt="Vista previa" fill className="object-cover"/>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2 h-7 w-7 z-10"
                                                onClick={() => {
                                                    setImageValue('image_url', '');
                                                }}
                                            >
                                                <X className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        />
                        {errorsImage.image_url && <p className="text-red-500 text-sm mt-1">{typeof errorsImage.image_url.message === 'string' ? errorsImage.image_url.message : ''}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                    <Label htmlFor="alt_text" className="md:text-right">Texto Alternativo</Label>
                    <div className="col-span-3">
                      <Input id="alt_text" {...registerImage('alt_text')} />
                      {errorsImage.alt_text && <p className="text-red-500 text-sm mt-1">{errorsImage.alt_text.message}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                    <Label htmlFor="sort_order" className="md:text-right">Orden</Label>
                    <div className="col-span-3">
                      <Input id="sort_order" type="number" {...registerImage('sort_order')} />
                      {errorsImage.sort_order && <p className="text-red-500 text-sm mt-1">{errorsImage.sort_order.message}</p>}
                    </div>
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
      <Dialog open={isCropperOpen} onOpenChange={setIsCropperOpen}>
          <DialogContent className="max-w-4xl">
              <DialogHeader>
                  <DialogTitle>Recortar Imagen</DialogTitle>
                  <DialogDescription>Ajusta la imagen para que encaje perfectamente en el carrusel.</DialogDescription>
              </DialogHeader>
              <div className="mt-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  {imgSrc && (
                      <ReactCrop
                          crop={crop}
                          onChange={(_, percentCrop) => setCrop(percentCrop)}
                          onComplete={(c) => setCompletedCrop(c)}
                          aspect={CAROUSEL_ASPECT}
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
    </>
  );
}
