"use client"

import { Analytics } from "@vercel/analytics/next";
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
import { Logo } from '@/components/icons/logo';
import emailjs from '@emailjs/browser'

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  message: z.string().min(10, {
    message: "El mensaje debe tener al menos 10 caracteres.",
  }),
})

export default function ContactPage() {
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      message: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID as string
      const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID as string
      const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY as string

      if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
        throw new Error('EmailJS no está configurado')
      }

      const params = {
        name: values.name,
        message: values.message,
      }

      await emailjs.send(SERVICE_ID, TEMPLATE_ID, params, { publicKey: PUBLIC_KEY })
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
                <h1 className="text-4xl font-bold mb-4 font-headline">Contáctanos</h1>
                <p className="text-lg text-muted-foreground mb-8">
                    ¿Tienes alguna pregunta o pedido especial? Llena el formulario y nos pondremos en contacto contigo.
                </p>
                <Card>
                    <CardHeader>
                        <CardTitle>Enviar un Mensaje</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-8">
                 <h2 className="text-3xl font-bold font-headline">Otras Consultas</h2>
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
