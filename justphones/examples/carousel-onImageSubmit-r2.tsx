// Ejemplo de cómo actualizar tu onImageSubmit para usar R2
// Reemplaza tu función onImageSubmit existente con esta versión que usa R2

const onImageSubmit = async (data: z.infer<typeof carouselImageSchema>) => {
  let success;
  let finalImageUrl = '';

  if (data.image_url instanceof File) {
    // Usar R2 en lugar de Supabase Storage
    const uploadResult = await uploadCarouselImageFile(data.image_url);
    
    if (!uploadResult.success) {
      // El error ya se muestra en el hook
      return;
    }
    
    finalImageUrl = uploadResult.url!;

  } else if (typeof data.image_url === 'string' && data.image_url.trim()) {
    finalImageUrl = data.image_url;
    if (!finalImageUrl.startsWith('http')) {
      toast({ 
        variant: 'destructive', 
        title: 'URL Inválida', 
        description: 'Por favor, ingresa una URL de imagen válida que comience con http.' 
      });
      return;
    }
  } else {
    toast({ 
      variant: 'destructive', 
      title: 'Sin Imagen', 
      description: 'Debes subir un archivo o proveer una URL.' 
    });
    return;
  }
  
  const imageData = {
    image_url: finalImageUrl,
    alt_text: data.alt_text,
    sort_order: data.sort_order,
  };

  if (editingImage) {
    success = await updateCarouselImage(editingImage.id, imageData);
    if (success) toast({ 
      title: "Imagen actualizada", 
      description: "La imagen del carrusel ha sido actualizada." 
    });
  } else {
    success = await addCarouselImage(imageData);
    if (success) toast({ 
      title: "Imagen añadida", 
      description: "La nueva imagen ha sido añadida al carrusel." 
    });
  }
  
  if (success) {
    setIsImageDialogOpen(false);
    setImagePreview(null);
  }
};
