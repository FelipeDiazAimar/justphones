
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { isDemoMode } from '@/lib/demo';
import { effectivePrice, formatAdminPrice, useDemoProducts } from './_demo/store';
import {
  Package,
  Type,
  Smartphone,
  HelpCircle,
  Image,
  ShoppingCart,
  Tag,
  TrendingUp,
  Boxes,
  Banknote,
  PackageX
} from 'lucide-react';

const dashboardItems = [
  {
    href: '/admin/products',
    label: 'Productos',
    icon: Package,
    color: 'text-blue-500',
    description: 'Gestiona el catálogo completo de productos, precios, disponibilidad y características técnicas.'
  },
  {
    href: '/admin/names',
    label: 'Nombres',
    icon: Type,
    color: 'text-purple-500',
    description: 'Administra los nombres de productos y sus variantes para mantener consistencia en el catálogo.'
  },
  {
    href: '/admin/models',
    label: 'Modelos',
    icon: Smartphone,
    color: 'text-green-500',
    description: 'Controla los modelos de dispositivos disponibles y sus especificaciones técnicas.'
  },
  {
    href: '/admin/faqs',
    label: 'Preguntas Frecuentes',
    icon: HelpCircle,
    color: 'text-orange-500',
    description: 'Gestiona las preguntas frecuentes y sus respuestas para ayudar a los clientes.'
  },
  {
    href: '/admin/carousel',
    label: 'Carrusel',
    icon: Image,
    color: 'text-pink-500',
    description: 'Administra las imágenes del carrusel principal y promociones destacadas.'
  },
  {
    href: '/admin/pedidos',
    label: 'Pedidos',
    icon: ShoppingCart,
    color: 'text-red-500',
    description: 'Revisa y gestiona todos los pedidos de clientes, estados de envío y seguimiento.'
  },
  {
    href: '/admin/codigos',
    label: 'Códigos',
    icon: Tag,
    color: 'text-indigo-500',
    description: 'Gestiona códigos de descuento, promociones y ofertas especiales.'
  },
  {
    href: '/admin/finanzas',
    label: 'Finanzas',
    icon: TrendingUp,
    color: 'text-emerald-500',
    description: 'Analiza ventas, ganancias, costos fijos, capital disponible y rentabilidad de productos.'
  },
];

export default function AdminDashboard() {
  const demo = isDemoMode();
  const { products: demoProducts } = useDemoProducts();
  const demoStats = useMemo(() => {
    const units = demoProducts.reduce((acc, p) => acc + p.stock, 0);
    const value = demoProducts.reduce((acc, p) => acc + effectivePrice(p) * p.stock, 0);
    const out = demoProducts.filter((p) => p.stock <= 0).length;
    return { total: demoProducts.length, units, value, out };
  }, [demoProducts]);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold mb-2">Dashboard Administrativo</h2>
        <p className="text-muted-foreground">
          Selecciona una sección para gestionar diferentes aspectos de JustPhones
        </p>
        {demo && (
          <p className="mt-2 text-xs text-muted-foreground">
            Los cambios del panel se guardan solo en este navegador.
          </p>
        )}
      </motion.div>

      {demo && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="h-4 w-4 text-blue-500" />
                <p className="text-xs">Productos</p>
              </div>
              <p className="text-2xl font-bold mt-1">{demoStats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Boxes className="h-4 w-4 text-green-500" />
                <p className="text-xs">Unidades en stock</p>
              </div>
              <p className="text-2xl font-bold mt-1">{demoStats.units}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Banknote className="h-4 w-4 text-emerald-500" />
                <p className="text-xs">Valor del stock</p>
              </div>
              <p className="text-2xl font-bold mt-1">{formatAdminPrice(demoStats.value)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <PackageX className="h-4 w-4 text-red-500" />
                <p className="text-xs">Sin stock</p>
              </div>
              <p className={cn('text-2xl font-bold mt-1', demoStats.out > 0 && 'text-destructive')}>
                {demoStats.out}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {dashboardItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.1,
                ease: "easeOut"
              }}
            >
              <Link href={item.href}>
                <Card className="h-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 border-border/50 hover:border-primary/30 group cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-4">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={cn(
                          "p-3 rounded-xl transition-all duration-300",
                          "bg-muted/50 group-hover:bg-primary/10"
                        )}
                      >
                        <Icon className={cn(
                          "h-8 w-8 transition-all duration-300",
                          item.color,
                          "group-hover:scale-110"
                        )} />
                      </motion.div>
                      <div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {item.label}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
