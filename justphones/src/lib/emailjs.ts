/**
 * JustPhones — wrapper demo-safe de EmailJS (client-safe).
 *
 * - En demo (`isDemoMode()`) o sin keys (`NEXT_PUBLIC_EMAILJS_*`): no-op.
 *   Guarda el mensaje en `localStorage` (misma key que `src/app/contact/page.tsx`)
 *   y resuelve `{ success: true, demo: true }`. Nunca crashea en SSR
 *   (`localStorage`/`process` se acceden de forma defensiva).
 * - Path real intacto: con keys y fuera de demo, delega a `@emailjs/browser`
 *   vía import dinámico (no agranda el bundle demo).
 *
 * Nota: `src/app/contact/page.tsx` hoy implementa su propio fallback demo;
 * puede migrar a `sendContactMessage()` cuando se quiera (ver pendientes).
 */

import { isDemoMode } from './demo';

/** Key compartida con el fallback demo de la página de contacto. */
export const DEMO_CONTACT_STORAGE_KEY = 'justphones_contact_messages_demo';

export interface ContactMessageInput {
  name: string;
  message: string;
}

export interface StoredContactMessage extends ContactMessageInput {
  createdAt: string;
}

export type SendContactResult =
  | { success: true; demo: boolean }
  | { success: false; error: string };

function readEnv(key: string): string | undefined {
  try {
    return (
      globalThis as { process?: { env?: Record<string, string | undefined> } }
    ).process?.env?.[key];
  } catch {
    return undefined;
  }
}

/** true si están las 3 keys públicas de EmailJS. */
export function hasEmailJsKeys(): boolean {
  return Boolean(
    readEnv('NEXT_PUBLIC_EMAILJS_SERVICE_ID') &&
      readEnv('NEXT_PUBLIC_EMAILJS_TEMPLATE_ID') &&
      readEnv('NEXT_PUBLIC_EMAILJS_PUBLIC_KEY'),
  );
}

/** true cuando el envío debe ser no-op (demo o sin configuración). */
export function isEmailJsDemo(): boolean {
  return isDemoMode() || !hasEmailJsKeys();
}

function saveDemoMessage(entry: StoredContactMessage): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem(DEMO_CONTACT_STORAGE_KEY);
    const prev: StoredContactMessage[] = raw
      ? (JSON.parse(raw) as StoredContactMessage[])
      : [];
    const next = Array.isArray(prev) ? [...prev, entry] : [entry];
    localStorage.setItem(DEMO_CONTACT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage no disponible o corrupto: el no-op sigue resolviendo éxito.
  }
}

/**
 * Envía un mensaje de contacto. En demo es no-op con guardado local;
 * en real usa EmailJS con las env `NEXT_PUBLIC_EMAILJS_*`.
 */
export async function sendContactMessage(
  input: ContactMessageInput,
): Promise<SendContactResult> {
  const name = input.name.trim();
  const message = input.message.trim();
  if (!name || !message) {
    return { success: false, error: 'Nombre y mensaje son obligatorios.' };
  }

  if (isEmailJsDemo()) {
    saveDemoMessage({ name, message, createdAt: new Date().toISOString() });
    return { success: true, demo: true };
  }

  try {
    const serviceId = readEnv('NEXT_PUBLIC_EMAILJS_SERVICE_ID') as string;
    const templateId = readEnv('NEXT_PUBLIC_EMAILJS_TEMPLATE_ID') as string;
    const publicKey = readEnv('NEXT_PUBLIC_EMAILJS_PUBLIC_KEY') as string;
    const { default: emailjs } = await import('@emailjs/browser');
    await emailjs.send(serviceId, templateId, { name, message }, { publicKey });
    return { success: true, demo: false };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo enviar el mensaje.',
    };
  }
}
