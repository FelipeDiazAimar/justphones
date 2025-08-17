"use client"

import React, { useMemo, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Product } from '@/lib/products';
import { Skeleton } from './ui/skeleton';
import { expandModelString } from '@/lib/utils';

interface ProductFiltersProps {
  filters: any;
  setFilters: (filters: any) => void;
  className?: string;
  products?: Product[];
  hideModelFilter?: boolean;
  showSubCategoryFilter?: boolean;
  subCategoryList?: string[];
}

const unslugify = (slug: string): string => {
    if (!slug) return "";
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function ProductFilters({ filters, setFilters, className, products, hideModelFilter = false, showSubCategoryFilter = false, subCategoryList = [] }: ProductFiltersProps) {
  const productSource = products || [];
  const availableColors = [...new Set(productSource.flatMap(p => p.colors.map(c => c.hex)))];
  
  // Estado para detectar si es dispositivo móvil
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint de Tailwind
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Definir los valores por defecto del acordeón basado en el tamaño de pantalla
  const defaultAccordionValues: string[] = [];
  
  const availableModels = useMemo(() => {
    const allIndividualModels = productSource.flatMap(p => expandModelString(p.model));
    const uniqueModels = [...new Set(allIndividualModels)];
    
    return uniqueModels.sort((a, b) => {
        const isAIphone = a.toLowerCase().startsWith('iphone');
        const isBIphone = b.toLowerCase().startsWith('iphone');

        if (isAIphone && isBIphone) {
            return b.localeCompare(a, undefined, { numeric: true });
        }
        if (a === 'Universal') return 1;
        if (b === 'Universal') return -1;
        if (a === 'Original') return 1;
        if (b === 'Original') return -1;
        
        return a.localeCompare(b);
    });
  }, [productSource]);
  
  const availableSubCategories = showSubCategoryFilter 
    ? subCategoryList
    : [...new Set(productSource.flatMap(p => p.subCategory ? [p.subCategory] : []))];

  const priceLimits = useMemo(() => {
    if (productSource.length === 0) {
      return [0, 100000];
    }
    const prices = productSource.map(p => p.price);
    const min = Math.floor(Math.min(...prices));
    const max = Math.ceil(Math.max(...prices));
    return [min, max > min ? max : min + 1];
  }, [productSource]);

  const handleColorChange = (color: string) => {
    const newColors = filters.colors.includes(color)
      ? filters.colors.filter((c: string) => c !== color)
      : [...filters.colors, color];
    setFilters({ ...filters, colors: newColors });
  };

  const handleModelChange = (model: string) => {
    const newModels = filters.models.includes(model)
      ? filters.models.filter((m: string) => m !== model)
      : [...filters.models, model];
    setFilters({ ...filters, models: newModels });
  };

  const handleSubCategoryChange = (subCategory: string) => {
    const newSubCategories = filters.subCategories?.includes(subCategory)
      ? filters.subCategories.filter((sc: string) => sc !== subCategory)
      : [...(filters.subCategories || []), subCategory];
    setFilters({ ...filters, subCategories: newSubCategories });
  };

  const handlePriceChange = (value: number[]) => {
    setFilters({ ...filters, priceRange: value });
  };
  
  const handleSortChange = (value: string) => {
    setFilters({...filters, sortBy: value});
  }

  return (
    <div className={className}>
      <Card className="bg-card/50 backdrop-blur-xl shadow-none border-foreground/10 h-fit max-h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 overflow-y-auto flex-1 pr-2">
          <div className="pr-2">
            <Accordion type="multiple" defaultValue={defaultAccordionValues} className="w-full">
            <AccordionItem value="color">
              <AccordionTrigger className="text-base font-semibold">Color</AccordionTrigger>
              <AccordionContent className="grid grid-cols-5 gap-2 pt-4">
                {availableColors.map((color) => (
                  <label key={color} className="flex items-center justify-center">
                     <Checkbox
                        className="h-8 w-8 rounded-full border border-border data-[state=checked]:text-transparent data-[state=checked]:ring-2 data-[state=checked]:ring-primary transition-transform hover:scale-110"
                        style={{ backgroundColor: color }}
                        checked={filters.colors.includes(color)}
                        onCheckedChange={() => handleColorChange(color)}
                      />
                  </label>
                ))}
              </AccordionContent>
            </AccordionItem>
            
            {!hideModelFilter && (
              <AccordionItem value="modelo">
                <AccordionTrigger className="text-base font-semibold">Modelo</AccordionTrigger>
                <AccordionContent className="space-y-2 pt-2">
                  {availableModels.map((model) => (
                      <div key={model} className="flex items-center space-x-2">
                        <Checkbox
                          id={`model-${model}`}
                          checked={filters.models.includes(model)}
                          onCheckedChange={() => handleModelChange(model)}
                        />
                        <Label htmlFor={`model-${model}`} className="font-normal">{model}</Label>
                      </div>
                    ))
                  }
                </AccordionContent>
              </AccordionItem>
            )}

            {showSubCategoryFilter && (
              <AccordionItem value="subcategoria">
                <AccordionTrigger className="text-base font-semibold">Tipo</AccordionTrigger>
                <AccordionContent className="space-y-2 pt-2">
                  {availableSubCategories.map((sub) => (
                    <div key={sub} className="flex items-center space-x-2">
                      <Checkbox
                        id={`sub-${sub}`}
                        checked={filters.subCategories?.includes(sub)}
                        onCheckedChange={() => handleSubCategoryChange(sub)}
                      />
                      <Label htmlFor={`sub-${sub}`} className="font-normal">{unslugify(sub)}</Label>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="precio">
              <AccordionTrigger className="text-base font-semibold">Precio</AccordionTrigger>
              <AccordionContent className="pt-4">
                  <Slider
                    value={filters.priceRange}
                    min={priceLimits[0]}
                    max={priceLimits[1]}
                    step={1000}
                    onValueChange={handlePriceChange}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                      <span>${filters.priceRange[0]}</span>
                      <span>${filters.priceRange[1]}</span>
                  </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

           <div className="mt-4">
              <Label className="text-base font-semibold">Ordenar por</Label>
              <Select onValueChange={handleSortChange} defaultValue={filters.sortBy}>
                <SelectTrigger className="w-full mt-2">
                  <SelectValue placeholder="Seleccionar orden" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-asc">Precio: Menor a Mayor</SelectItem>
                  <SelectItem value="price-desc">Precio: Mayor a Menor</SelectItem>
                  <SelectItem value="name-asc">Nombre: A-Z</SelectItem>
                  <SelectItem value="name-desc">Nombre: Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
