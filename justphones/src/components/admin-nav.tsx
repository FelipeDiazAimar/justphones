
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Type,
  Smartphone,
  HelpCircle,
  Image,
  ShoppingCart,
  Tag,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const navItems = [
  { href: '/admin/products', label: 'Productos', icon: Package, color: 'text-blue-500' },
  { href: '/admin/names', label: 'Nombres', icon: Type, color: 'text-purple-500' },
  { href: '/admin/models', label: 'Modelos', icon: Smartphone, color: 'text-green-500' },
  { href: '/admin/faqs', label: 'Preguntas Frecuentes', icon: HelpCircle, color: 'text-orange-500' },
  { href: '/admin/carousel', label: 'Carrusel', icon: Image, color: 'text-pink-500' },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart, color: 'text-red-500' },
  { href: '/admin/codigos', label: 'Códigos', icon: Tag, color: 'text-indigo-500' },
];

export function AdminNav() {
  const pathname = usePathname();
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentIndex = navItems.findIndex(item =>
      pathname === item.href || pathname.startsWith(`${item.href}/`)
    );
    setActiveIndex(currentIndex >= 0 ? currentIndex : 0);
  }, [pathname]);

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const handleResize = () => checkScrollButtons();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      const newScrollLeft = scrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = () => {
    checkScrollButtons();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative w-full"
    >
      {/* Background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-muted/30 to-background rounded-2xl border border-border/50 shadow-lg backdrop-blur-sm" />

      <div className="relative p-2">
        {/* Mobile scroll buttons */}
        <AnimatePresence>
          {canScrollLeft && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => scroll('left')}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-md hover:bg-background transition-all duration-200 md:hidden"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {canScrollRight && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => scroll('right')}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-md hover:bg-background transition-all duration-200 md:hidden"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Navigation container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth px-2 md:px-0"
          style={{ paddingTop: '15px', paddingBottom: '15px' }}
        >
          {navItems.map((item, index) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05,
                  ease: "easeOut"
                }}
                className="flex-shrink-0"
              >
                <Link href={item.href}>
                  <motion.div
                    whileHover={{
                      scale: 1.05,
                      y: -2
                    }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                      "border border-border/50 backdrop-blur-sm",
                      isActive
                        ? "bg-primary/10 border-primary/50 shadow-lg shadow-primary/20"
                        : "bg-background/50 hover:bg-background/80 hover:border-border hover:shadow-md"
                    )}
                  >
                    {/* Active indicator */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl border border-primary/30"
                        />
                      )}
                    </AnimatePresence>

                    {/* Icon with glow effect */}
                    <motion.div
                      animate={isActive ? {
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      } : {}}
                      transition={{
                        duration: 2,
                        repeat: isActive ? Infinity : 0,
                        ease: "easeInOut"
                      }}
                      className={cn(
                        "relative z-10 p-2 rounded-lg transition-all duration-300",
                        isActive
                          ? "bg-primary/20 shadow-lg shadow-primary/30"
                          : "bg-muted/50 group-hover:bg-muted"
                      )}
                    >
                      <Icon className={cn(
                        "h-5 w-5 transition-all duration-300",
                        isActive
                          ? "text-primary drop-shadow-sm"
                          : `${item.color} group-hover:scale-110`
                      )} />

                      {/* Glow effect for active */}
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 bg-primary/20 rounded-lg blur-sm"
                        />
                      )}
                    </motion.div>

                    {/* Text */}
                    <motion.span
                      className={cn(
                        "relative z-10 font-medium transition-all duration-300 text-sm md:text-base",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      <span className="hidden sm:inline">{item.label}</span>
                      <span className="sm:hidden">
                        {item.label.split(' ')[0]}
                      </span>
                    </motion.span>

                    {/* Hover effect */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent rounded-xl"
                    />
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Active tab indicator line */}
        {/* <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="h-0.5 bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-full mt-2"
          style={{
            width: '10%',
            marginLeft: `${(activeIndex * 100) / navItems.length + ((100 / navItems.length) - 10) / 2}%`
          }}
        /> */}
      </div>
    </motion.div>
  );
}
