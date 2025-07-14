-- Este script configura la tabla `customer_requests` y sus políticas de seguridad.
-- Es seguro ejecutar este script múltiples veces.

-- 1. Crear la tabla `customer_requests` solo si no existe.
CREATE TABLE IF NOT EXISTS public.customer_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    product_id uuid,
    product_name text,
    product_model text,
    color_name text,
    color_hex text,
    quantity integer DEFAULT 1 NOT NULL,
    CONSTRAINT customer_requests_pkey PRIMARY KEY (id)
);

-- 2. Habilitar Row Level Security (RLS) en la tabla.
-- Esto es fundamental para la seguridad. Por defecto, bloquea todo el acceso.
ALTER TABLE public.customer_requests ENABLE ROW LEVEL SECURITY;


-- 3. Crear política para permitir la INSERCIÓN a cualquier usuario (incluso anónimos).
-- Esto es necesario para que los clientes puedan registrar sus pedidos desde el carrito.
CREATE POLICY "Allow public insert access"
ON public.customer_requests
FOR INSERT
WITH CHECK (true);


-- 4. Crear política para permitir la LECTURA (SELECT) solo a usuarios autenticados.
-- Esto permite que tú, como administrador, puedas ver los datos en el panel.
CREATE POLICY "Allow authenticated select access"
ON public.customer_requests
FOR SELECT
TO authenticated
USING (true);
