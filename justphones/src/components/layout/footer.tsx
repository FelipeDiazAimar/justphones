
'use client';

import Link from 'next/link';
import { useSubcategories } from '@/hooks/use-subcategories';
import { Skeleton } from '../ui/skeleton';
import { unslugify, slugify } from '@/lib/utils';
import Aurora from '../aurora';
import '../aurora.css';

export function Footer() {
  const { subcategories, isLoading } = useSubcategories();

  const caseSubCategories = (subcategories?.case || []).map(sub => ({
    title: unslugify(sub),
    href: `/catalog/cases?subCategory=${slugify(sub)}`,
  }));

  const accessorySubCategories = (subcategories?.accessory || []).map(sub => ({
    title: unslugify(sub),
    href: `/catalog/accessories?subCategory=${slugify(sub)}`,
  }));

  const auricularesSubCategories = (subcategories?.auriculares || []).map(sub => ({
    title: unslugify(sub),
    href: `/catalog/auriculares?subCategory=${slugify(sub)}`,
  }));

  if (isLoading) {
    return (
       <footer className="w-full border-t bg-background relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
          <Aurora />
        </div>
        <div className="container py-12 relative z-10">
            <div className="mb-8 flex flex-col items-center">
                <Skeleton className="h-8 w-1/3 mx-auto mb-8" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="space-y-3">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-4/6" />
                        </div>
                    ))}
                </div>
            </div>
             <div className="border-t pt-6 mt-8 border-white/10">
                <Skeleton className="h-4 w-1/4 mx-auto" />
            </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="w-full border-t bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-40">
        <Aurora />
      </div>
      <div className="container py-12 relative z-10 max-w-6xl mx-auto">
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-8 text-center">Compra por Categoría</h3>
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center md:text-left justify-items-center">
              <div className="md:col-span-1">
                <h4 className="font-semibold mb-4 text-base">
                  <Link href="/catalog/cases" className="hover:text-primary transition-colors">
                    iPhone <span className="text-primary">Cases</span>
                  </Link>
                </h4>
                <nav className="flex flex-col space-y-2">
                  <Link href="/catalog/cases" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                    Explora todas las iPhone cases
                  </Link>
                  {caseSubCategories.map(sub => (
                     <Link key={sub.title} href={sub.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {sub.title}
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="md:col-span-1">
                <h4 className="font-semibold mb-4 text-base">
                  <Link href="/catalog/accessories" className="hover:text-primary transition-colors">
                    Accesorios
                  </Link>
                </h4>
                <nav className="flex flex-col space-y-2">
                   <Link href="/catalog/accessories" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                      Explora todos los accesorios
                   </Link>
                   {accessorySubCategories.map(sub => (
                     <Link key={sub.title} href={sub.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {sub.title}
                    </Link>
                  ))}
                </nav>
              </div>
               <div className="md:col-span-1">
                <h4 className="font-semibold mb-4 text-base">
                  <Link href="/catalog/auriculares" className="hover:text-primary transition-colors">
                    Auriculares
                  </Link>
                </h4>
                <nav className="flex flex-col space-y-2">
                   <Link href="/catalog/auriculares" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                      Explora todos los auriculares
                   </Link>
                   {auricularesSubCategories.map(sub => (
                     <Link key={sub.title} href={sub.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {sub.title}
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="md:col-span-1">
                 <h4 className="font-semibold mb-4 text-base">
                   Ayuda
                 </h4>
                 <nav className="flex flex-col space-y-2">
                    <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Contacto
                    </Link>
                     <Link href="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Preguntas Frecuentes
                    </Link>
                     <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Medios de Pago
                    </Link>
                 </nav>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t pt-6 mt-8 border-white/10">
            <p className="text-center text-sm text-muted-foreground">
            JustPhones - Rights Reserved ©2025
            </p>
        </div>
      </div>
    </footer>
  );
}
