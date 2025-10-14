
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

const navItems = [
  { href: '/admin/products', label: 'Productos' },
  { href: '/admin/names', label: 'Nombres' },
  { href: '/admin/models', label: 'Modelos' },
  { href: '/admin/faqs', label: 'Preguntas Frecuentes' },
  { href: '/admin/carousel', label: 'Carrusel' },
  { href: '/admin/pedidos', label: 'Pedidos' },
  { href: '/admin/codigos', label: 'Codigos' },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="relative">
      <div className="overflow-x-auto pb-2">
        <nav className="flex space-x-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'shrink-0',
                pathname === item.href || pathname.startsWith(`${item.href}/`)
                  ? 'font-semibold border-primary text-primary'
                  : 'text-muted-foreground',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
