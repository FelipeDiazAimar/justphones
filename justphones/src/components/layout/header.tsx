
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  Search,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Logo } from '@/components/icons/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn, slugify, unslugify } from '@/lib/utils';
import React from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useModels } from '@/hooks/use-models';
import { useSubcategories } from '@/hooks/use-subcategories';
import { CartSheet } from '../cart-sheet';

export function Header({ showCart = true }: { showCart?: boolean }) {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');
  const router = useRouter();
  const pathname = usePathname();
  const { models } = useModels();
  const { subcategories } = useSubcategories();

  const iphoneModels = (models.case || [])
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
    .map(m => ({ title: m, href: `/catalog/${slugify(m)}` }));

  const accessories = (subcategories?.accessory || []).map(sub => ({
    title: unslugify(sub),
    href: `/catalog/accessories?subCategory=${slugify(sub)}`,
  }));

  const auriculares = (subcategories?.auriculares || []).map(sub => ({
    title: unslugify(sub),
    href: `/catalog/auriculares?subCategory=${slugify(sub)}`,
  }));


  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const searchTerm = searchValue.trim();
    
    if (searchTerm.toLowerCase() === 'admin') {
      router.push('/admin');
    } else if (searchTerm) {
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    }

    setSearchValue('');
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
  };
  
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center justify-between px-4 md:px-6">
        <div className="flex items-center">
            <Link href="/catalog" className="mr-6 flex items-center">
                <Logo className="h-16 w-auto" />
            </Link>
        </div>
        
        <nav className="hidden md:flex flex-1 items-center justify-end space-x-2">
          <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/contact" className={cn(navigationMenuTriggerStyle(), "bg-transparent")}>
                      Contáctame
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent">iPhone</NavigationMenuTrigger>
                    <NavigationMenuContent>
                    <div className="container p-4">
                        <ul className="grid list-none gap-3 md:grid-cols-2 lg:grid-cols-5">
                        <li className="lg:col-span-full">
                            <NavigationMenuLink asChild>
                            <Link
                                href="/catalog/cases"
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-left"
                            >
                                <div className="text-sm font-medium leading-none">
                                Explora todas las iPhone <span className="text-primary">Cases</span>
                                </div>
                            </Link>
                            </NavigationMenuLink>
                        </li>
                        {iphoneModels.map((component) => (
                            <ListItem key={component.title} title={component.title} href={component.href} />
                        ))}
                        </ul>
                    </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent">Accesorios</NavigationMenuTrigger>
                    <NavigationMenuContent>
                    <div className="container p-4">
                        <ul className="grid list-none gap-3 md:grid-cols-2 lg:grid-cols-3">
                        <li className="lg:col-span-full">
                            <NavigationMenuLink asChild>
                                <Link
                                href="/catalog/accessories"
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-left"
                                >
                                <div className="text-sm font-medium leading-none">
                                    Explora todos los <span className="text-primary">Accesorios</span>
                                </div>
                                </Link>
                            </NavigationMenuLink>
                            </li>
                        {accessories.map((component) => (
                            <ListItem
                            key={component.title}
                            title={component.title}
                            href={component.href}
                            />
                        ))}
                        </ul>
                    </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>
                 <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent">Auriculares</NavigationMenuTrigger>
                    <NavigationMenuContent>
                    <div className="container p-4">
                        <ul className="grid list-none gap-3 md:grid-cols-2 lg:grid-cols-3">
                        <li className="lg:col-span-full">
                            <NavigationMenuLink asChild>
                                <Link
                                href="/catalog/auriculares"
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-left"
                                >
                                <div className="text-sm font-medium leading-none">
                                    Explora todos los <span className="text-primary">Auriculares</span>
                                </div>
                                </Link>
                            </NavigationMenuLink>
                            </li>
                        {auriculares.map((component) => (
                            <ListItem
                            key={component.title}
                            title={component.title}
                            href={component.href}
                            />
                        ))}
                        </ul>
                    </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

            <Collapsible open={isSearchOpen} onOpenChange={setIsSearchOpen} className="static">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-transparent hover:text-foreground rounded-full">
                    <Search className="h-5 w-5" />
                    <span className="sr-only">Buscar</span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="absolute inset-x-0 top-full">
                <div className="fixed inset-x-0 top-20 border-b bg-background py-4">
                  <div className="container px-4 md:px-6">
                    <form onSubmit={handleSearchSubmit}>
                      <div className="grid gap-4">
                          <div className="space-y-2 text-left">
                              <h4 className="font-medium leading-none">Búsqueda</h4>
                              <p className="text-sm text-muted-foreground">
                                  Encuentra el producto que necesitas.
                              </p>
                          </div>
                          <div className="relative">
                              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input placeholder="Buscar productos..." className="pl-9 shadow-none focus-visible:ring-0 border-0" 
                                  value={searchValue}
                                  onChange={(e) => setSearchValue(e.target.value)}
                              />
                          </div>
                      </div>
                    </form>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
            
            <Button variant="outline" size="sm" onClick={() => router.push('/admin')}>
                Admin
            </Button>
            <ThemeToggle />
            {showCart && <CartSheet />}
            {pathname !== '/catalog' && (
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                    <span className="sr-only">Volver</span>
                </Button>
            )}
        </nav>

        <div className="md:hidden flex items-center space-x-1">
            {pathname !== '/catalog' && (
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
                    <ArrowLeft className="h-6 w-6" />
                    <span className="sr-only">Volver</span>
                </Button>
            )}
            {showCart && <CartSheet />}
            <ThemeToggle />
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                <Menu className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent 
                side="left" 
                className="flex flex-col p-0 max-w-xs w-full"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <SheetHeader className="p-4 border-b">
                    <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                    <SheetDescription className="sr-only">Main navigation menu.</SheetDescription>
                    <Link href="/catalog" onClick={closeMobileMenu} className="flex items-center justify-center">
                        <Logo className="h-16 w-auto" />
                    </Link>
                </SheetHeader>
                <div className="p-4">
                    <form onSubmit={handleSearchSubmit}>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Buscar productos..."
                                className="pl-9"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />
                        </div>
                    </form>
                </div>
                <div className="flex-grow overflow-y-auto px-4">
                  <div className="flex flex-col space-y-2">
                    <Link href="/contact" onClick={closeMobileMenu} className="font-medium text-lg py-2">Contáctame</Link>
                    
                    <Collapsible>
                        <CollapsibleTrigger className="font-medium w-full text-left flex justify-between items-center text-lg py-2">
                          <span>iPhone</span>
                          <ChevronDown className="h-5 w-5 transition-transform data-[state=open]:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                        <div className="flex flex-col space-y-2 pl-4 mt-2 border-l">
                            <Link href="/catalog/cases" onClick={closeMobileMenu} className="text-sm font-medium text-foreground text-left">
                              Explora todas las iPhone <span className="text-primary">Cases</span>
                            </Link>
                            {iphoneModels.map(model => <Link key={model.title} href={model.href} onClick={closeMobileMenu} className="text-sm text-muted-foreground">{model.title}</Link>)}
                        </div>
                        </CollapsibleContent>
                    </Collapsible>

                    <Collapsible>
                        <CollapsibleTrigger className="font-medium w-full text-left flex justify-between items-center text-lg py-2">
                          <span>Accesorios</span>
                          <ChevronDown className="h-5 w-5 transition-transform data-[state=open]:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                        <div className="flex flex-col space-y-2 pl-4 mt-2 border-l">
                            <Link href="/catalog/accessories" onClick={closeMobileMenu} className="text-sm font-medium text-foreground text-left">
                            Explora todos los <span className="text-primary">Accesorios</span>
                            </Link>
                            {accessories.map(acc => <Link key={acc.title} href={acc.href} onClick={closeMobileMenu} className="text-sm text-muted-foreground">{acc.title}</Link>)}
                        </div>
                        </CollapsibleContent>
                    </Collapsible>

                    <Collapsible>
                        <CollapsibleTrigger className="font-medium w-full text-left flex justify-between items-center text-lg py-2">
                          <span>Auriculares</span>
                          <ChevronDown className="h-5 w-5 transition-transform data-[state=open]:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                        <div className="flex flex-col space-y-2 pl-4 mt-2 border-l">
                            <Link href="/catalog/auriculares" onClick={closeMobileMenu} className="text-sm font-medium text-foreground text-left">
                            Explora todos los <span className="text-primary">Auriculares</span>
                            </Link>
                            {auriculares.map(acc => <Link key={acc.title} href={acc.href} onClick={closeMobileMenu} className="text-sm text-muted-foreground">{acc.title}</Link>)}
                        </div>
                        </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>

                <div className="mt-auto p-4 border-t space-y-4">
                  <Button variant="outline" size="sm" className="w-full" onClick={() => {router.push('/admin'); closeMobileMenu();}}>
                      Admin
                  </Button>
                </div>

            </SheetContent>
            </Sheet>
        </div>
      </div>
    </header>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<typeof Link>
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          className={cn(
            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = 'ListItem';
