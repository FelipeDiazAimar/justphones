import { NextResponse } from 'next/server';
import { isDemoMode } from '@/lib/demo';

// El formulario de contacto real usa EmailJS en el cliente
// (ver src/app/contact/page.tsx). Esta ruta queda como respaldo del servidor:
// en demo (o sin keys de EmailJS) confirma de forma coherente; con demo
// desactivado preserva la respuesta 410 original.

function hasEmailJsKeys(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID &&
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID &&
      process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
  );
}

function useDemo(): boolean {
  try {
    if (isDemoMode()) return true;
  } catch {
    return true;
  }
  return !hasEmailJsKeys();
}

function toErrorMessage(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

export async function POST(req: Request) {
  const demo = useDemo();
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const message = typeof body?.message === 'string' ? body.message.trim() : '';

    if (name.length < 2) {
      return NextResponse.json(
        { success: false, error: 'El nombre debe tener al menos 2 caracteres.', demo },
        { status: 400 },
      );
    }
    if (message.length < 10) {
      return NextResponse.json(
        { success: false, error: 'El mensaje debe tener al menos 10 caracteres.', demo },
        { status: 400 },
      );
    }

    if (demo) {
      return NextResponse.json({
        success: true,
        message: `¡Gracias, ${name}! Modo demo: tu mensaje quedó registrado (sin envío real).`,
        data: { name, createdAt: new Date().toISOString() },
        demo: true,
      });
    }

    return NextResponse.json(
      { error: 'Contact API disabled. The site uses EmailJS on the client.', demo: false },
      { status: 410 },
    );
  } catch (e) {
    return NextResponse.json(
      { success: false, error: toErrorMessage(e, 'Error inesperado al procesar el mensaje.'), demo },
      { status: 500 },
    );
  }
}
