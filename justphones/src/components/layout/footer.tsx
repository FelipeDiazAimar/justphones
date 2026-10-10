'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useSubcategories } from '@/hooks/use-subcategories';
import { Skeleton } from '../ui/skeleton';
import { unslugify, slugify } from '@/lib/utils';
import { Logo } from '@/components/icons/logo';
import Aurora from '../aurora';
import '../aurora.css';

/* ---------------------------------- datos ---------------------------------- */

const WHATSAPP_NUMBER = '5493564338599';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
const WHATSAPP_DISPLAY = '+54 9 3564 33-8599';
const EMAIL = 'hola@justphones.com.ar';
const INSTAGRAM_URL = 'https://www.instagram.com/just.phones.fv/';
const FACEBOOK_URL = 'https://www.facebook.com/just.phones.fv/';
const TIKTOK_URL = 'https://www.tiktok.com/@just.phones.fv';
const DEFENSA_CONSUMIDOR_URL =
  'https://www.argentina.gob.ar/produccion/defensadelconsumidor';

const SOCIALS = [
  { name: 'Instagram', href: INSTAGRAM_URL, icon: '/icons/social/ig.svg', alt: 'Instagram de JustPhones' },
  { name: 'Facebook', href: FACEBOOK_URL, icon: '/icons/social/fb.svg', alt: 'Facebook de JustPhones' },
  { name: 'TikTok', href: TIKTOK_URL, icon: '/icons/social/tiktok.svg', alt: 'TikTok de JustPhones' },
  { name: 'WhatsApp', href: WHATSAPP_URL, icon: '/icons/social/wa.svg', alt: 'WhatsApp de JustPhones' },
];

const PAY_METHODS = [
  { name: 'Visa', icon: '/icons/pay/visa.svg', alt: 'Pago con Visa' },
  { name: 'Mastercard', icon: '/icons/pay/master.svg', alt: 'Pago con Mastercard' },
  { name: 'Transferencia', icon: '/icons/pay/transfer.svg', alt: 'Pago por transferencia' },
  { name: 'Efectivo', icon: '/icons/pay/cash.svg', alt: 'Pago en efectivo' },
];

/* ----------------------- sección colapsable en mobile ---------------------- */
/** En desktop muestra título + contenido fijo; en mobile un <details> acordeón. */
function FooterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <div className="hidden md:block">
        <h4 className="font-semibold mb-4 text-base">{title}</h4>
        {children}
      </div>
      <details className="md:hidden rounded-lg border border-white/10 px-4">
        <summary className="flex cursor-pointer list-none items-center justify-between py-3 font-semibold [&::-webkit-details-marker]:hidden">
          {title}
          <span aria-hidden="true" className="text-lg leading-none text-muted-foreground">
            +
          </span>
        </summary>
        <div className="pb-4">{children}</div>
      </details>
    </>
  );
}

/** Texto legal expandible inline (sin crear nuevas páginas). */
function LegalDetails({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group rounded-md border border-white/10 px-3 py-2">
      <summary className="cursor-pointer list-none text-sm text-muted-foreground transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
        {title}
      </summary>
      <p className="pt-2 text-xs leading-relaxed text-muted-foreground">{children}</p>
    </details>
  );
}

/* ------------------------------ newsletter mock ---------------------------- */

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('Ingresá un email válido para suscribirte.');
      return;
    }
    setError(null);
    setSent(true);
  }

  if (sent) {
    return (
      <p role="status" aria-live="polite" className="text-sm text-primary">
        ¡Listo! Te avisaremos las novedades y promos por email. (Demo: no se envía nada)
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full" noValidate={false}>
      <label htmlFor="footer-newsletter" className="sr-only">
        Email para novedades
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="footer-newsletter"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'footer-newsletter-error' : undefined}
          className="h-10 w-full rounded-md border border-white/10 bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          type="submit"
          className="h-10 shrink-0 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Suscribirme
        </button>
      </div>
      {error && (
        <p id="footer-newsletter-error" role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}

/* --------------------------------- footer ---------------------------------- */

export function Footer() {
  const { subcategories, isLoading } = useSubcategories();
  const year = new Date().getFullYear();

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
        {/* Compra por categoría (existente, se conserva) */}
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

        <div className="border-t border-white/10" />

        {/* Footer principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 py-10 text-center md:text-left justify-items-stretch md:justify-items-start">
          {/* Marca + redes */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <Link href="/" aria-label="JustPhones - inicio" className="inline-block">
              <Logo className="h-12 w-auto" />
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Fundas, accesorios y auriculares en Freyre, Córdoba. Retiro sin cargo,
              envíos a San Francisco y a todo el país por correo.
            </p>
            <div className="flex items-center gap-2">
              {SOCIALS.map(social => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${social.name} de JustPhones (abre en nueva pestaña)`}
                  title={social.name}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 transition-colors hover:border-primary hover:bg-primary/10"
                >
                  <img src={social.icon} alt={social.alt} width={20} height={20} loading="lazy" className="dark:invert" />
                </a>
              ))}
            </div>
          </div>

          {/* Contacto */}
          <FooterSection title="Contacto">
            <ul className="flex flex-col items-center md:items-start space-y-3 text-sm">
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  WhatsApp: {WHATSAPP_DISPLAY}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${EMAIL}`}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {EMAIL}
                </a>
              </li>
              <li className="text-muted-foreground">
                Freyre, Córdoba, Argentina
                <span className="block text-xs">Punto de retiro: se coordina por WhatsApp</span>
              </li>
              <li className="text-muted-foreground">
                Lun a Sáb
                <span className="block text-xs">Horario a coordinar por WhatsApp</span>
              </li>
            </ul>
          </FooterSection>

          {/* Ayuda / Legal */}
          <FooterSection title="Ayuda y legales">
            <nav className="flex flex-col items-center md:items-start space-y-2 text-sm">
              <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                Contacto
              </Link>
              <Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                Preguntas frecuentes
              </Link>
              <Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                Cambios y devoluciones
              </Link>
              <a
                href={DEFENSA_CONSUMIDOR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Defensa del consumidor
              </a>
              <div className="w-full max-w-xs space-y-2 pt-1 text-left">
                <LegalDetails title="Términos y condiciones">
                  Precios y stock sujetos a disponibilidad. La compra se confirma por WhatsApp
                  al coordinar pago y entrega. Los envíos fuera de Freyre se despachan por
                  correo, con demora estimada de 3 a 7 días hábiles.
                </LegalDetails>
                <LegalDetails title="Política de privacidad">
                  Tus datos (nombre, contacto y pedido) se usan solo para procesar tu compra
                  y coordinar la entrega. No compartimos tu información con terceros con
                  fines publicitarios.
                </LegalDetails>
              </div>
            </nav>
          </FooterSection>

          {/* Medios de pago */}
          <FooterSection title="Medios de pago">
            <ul className="flex flex-wrap justify-center md:justify-start gap-2">
              {PAY_METHODS.map(method => (
                <li
                  key={method.name}
                  className="flex items-center gap-2 rounded-md bg-white px-2.5 py-1.5"
                  title={method.name}
                >
                  <img src={method.icon} alt={method.alt} width={28} height={20} loading="lazy" />
                  <span className="text-xs font-medium text-neutral-700">{method.name}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Aceptamos efectivo, transferencia y tarjetas de débito y crédito.
              Beneficios pagando en efectivo o por transferencia: consultanos por WhatsApp.
            </p>
          </FooterSection>
        </div>

        {/* Newsletter */}
        <div className="flex flex-col gap-4 rounded-xl border border-white/10 p-6 md:flex-row md:items-center md:justify-between">
          <div className="md:max-w-sm">
            <h4 className="font-semibold text-base">Novedades y promos</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Dejanos tu email y te avisamos cuando llegan ingresos y ofertas.
            </p>
          </div>
          <div className="w-full md:max-w-md">
            <NewsletterForm />
          </div>
        </div>

        {/* Copy */}
        <div className="border-t border-white/10 pt-6 mt-8">
          <div className="flex flex-col items-center gap-3 text-center md:flex-row md:justify-between md:text-left">
            <p className="text-sm text-muted-foreground">
              © {year} JustPhones · Freyre, Córdoba, Argentina. Todos los derechos reservados.
            </p>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                Contacto
              </Link>
              <Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                Ayuda
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
