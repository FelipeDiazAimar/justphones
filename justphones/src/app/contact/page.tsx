"use client"

import { useState } from 'react';
import { Analytics } from "@vercel/analytics/next";
import { CheckCircle2 } from 'lucide-react';
import { MainLayout } from '@/components/main-layout';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { InstagramIcon } from '@/components/icons/instagram';
import { WhatsappIcon } from '@/components/icons/whatsapp';
import emailjs from '@emailjs/browser'

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  message: z.string().min(10, {
    message: "El mensaje debe tener al menos 10 caracteres.",
  }),
})

const DEMO_STORAGE_KEY = 'justphones_contact_messages_demo';

interface StoredContactMessage {
  name: string;
  message: string;
  createdAt: string;
}

function hasEmailJsKeys(): boolean {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
  return Boolean(serviceId && templateId && publicKey);
}

function saveDemoMessage(values: z.infer<typeof formSchema>): void {
  const entry: StoredContactMessage = {
    name: values.name,
    message: values.message,
    createdAt: new Date().toISOString(),
  };
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    const prev: StoredContactMessage[] = raw ? (JSON.parse(raw) as StoredContactMessage[]) : [];
    const next = Array.isArray(prev) ? [...prev, entry] : [entry];
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage no disponible o corrupto: la confirmación local sigue mostrándose.
  }
}

export default function ContactPage() {
  const { toast } = useToast()
  const [sentName, setSentName] = useState<string | null>(null)
  const emailJsConfigured = hasEmailJsKeys()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      message: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Sin keys de EmailJS → modo demo: confirmación local sin romper el envío real.
    if (!hasEmailJsKeys()) {
      saveDemoMessage(values)
      setSentName(values.name)
      toast({
        className: "border-primary/10 shadow-lg shadow-primary/10",
        title: `¡Gracias, ${values.name}!`,
        description: 'Modo demo: tu mensaje quedó guardado en este navegador.',
      })
      form.reset()
      return
    }

    try {
      const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID as string
      const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID as string
      const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY as string

      const params = {
        name: values.name,
        message: values.message,
      }

      await emailjs.send(SERVICE_ID, TEMPLATE_ID, params, { publicKey: PUBLIC_KEY })
      setSentName(values.name)
      toast({
        className: "border-primary/10 shadow-lg shadow-primary/10",
        title: `¡Gracias, ${values.name}!`,
        description: 'Hemos recibido tu mensaje y te responderemos pronto.',
      })
      form.reset()
  } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error al enviar',
        description: e?.message || 'Inténtalo nuevamente más tarde.',
      })
    }
  }

  return (
    <MainLayout>
        <div className="grid md:grid-cols-2 gap-12">
            <div>
                <h1 className="text-2xl sm:text-4xl font-bold mb-4 font-headline">Contáctanos</h1>
                <p className="text-lg text-muted-foreground mb-8">
                    ¿Tienes alguna pregunta o pedido especial? Llena el formulario y nos pondremos en contacto contigo.
                </p>
                <Card>
                    <CardHeader>
                        <CardTitle>Enviar un Mensaje</CardTitle>
                        {!emailJsConfigured && (
                          <CardDescription>
                            Modo demo: sin EmailJS configurado, tu mensaje se guarda solo en este navegador.
                          </CardDescription>
                        )}
                    </CardHeader>
                    <CardContent>
                        {sentName ? (
                          <div className="space-y-4 py-2" role="status" aria-live="polite">
                            <div className="flex items-start gap-3 rounded-md border border-primary/20 bg-primary/5 p-4">
                              <CheckCircle2 className="h-5 w-5 mt-0.5 text-primary" aria-hidden />
                              <div>
                                <p className="font-semibold">¡Gracias, {sentName}!</p>
                                <p className="text-sm text-muted-foreground">
                                  {emailJsConfigured
                                    ? 'Hemos recibido tu mensaje y te responderemos pronto.'
                                    : 'Modo demo: tu mensaje quedó guardado en este navegador (localStorage). Te responderemos pronto.'}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => setSentName(null)}
                            >
                              Enviar otro mensaje
                            </Button>
                          </div>
                        ) : (
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nombre y Apellido</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Tu nombre" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="message"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Mensaje</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Escribe tu consulta aquí..."
                                      className="resize-none"
                                      rows={6}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                              {form.formState.isSubmitting ? 'Enviando…' : 'Enviar Mensaje'}
                            </Button>
                          </form>
                        </Form>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-8">
                 <h2 className="text-2xl sm:text-3xl font-bold font-headline">Otras Consultas</h2>
                 <Card>
                    <CardHeader>
                        <CardTitle>Preguntas Frecuentes</CardTitle>
                        <CardDescription>
                            ¿Tienes una duda rápida? Quizás ya esté respondida.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link href="/faq">
                                Ver Preguntas Frecuentes
                            </Link>
                        </Button>
                    </CardContent>
                 </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Redes Sociales</CardTitle>
                        <CardDescription>Síguenos o envíanos un mensaje directo.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col space-y-2">
                        <Button asChild variant="outline" className="flex-1">
                            <Link href="https://wa.me/5493564338599" target="_blank" rel="noopener noreferrer">
                                <WhatsappIcon className="h-5 w-5 mr-2 text-green-500" /> WhatsApp Personal
                            </Link>
                        </Button>
                       <Button asChild variant="outline" className="flex-1">
                            <Link href="https://chat.whatsapp.com/H9nr3NyfQBsEe19mpXxUzZ" target="_blank" rel="noopener noreferrer">
                                <WhatsappIcon className="h-5 w-5 mr-2 text-green-500" /> Grupo de WhatsApp
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="flex-1">
                            <Link href="https://www.instagram.com/just.phones.fv/" target="_blank" rel="noopener noreferrer">
                                <InstagramIcon className="h-5 w-5 mr-2 text-pink-500" /> Instagram
                            </Link>
                        </Button>
                    </CardContent>
                 </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Medios de Pago</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <p className="text-muted-foreground">Aceptamos todos los medios de pago: efectivo, transferencia, tarjetas de débito y crédito.</p>
                    </CardContent>
                 </Card>
            </div>
        </div>
        <Analytics />
    </MainLayout>
  );
}
