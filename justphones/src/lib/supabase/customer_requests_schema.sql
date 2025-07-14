-- Create the table to store customer requests (items added to cart)
CREATE TABLE public.customer_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  product_id text NOT NULL,
  product_name text NOT NULL,
  product_model text NOT NULL,
  color_name text NOT NULL,
  color_hex text NOT NULL,
  quantity integer NOT NULL,
  CONSTRAINT customer_requests_pkey PRIMARY KEY (id)
);

-- Add comments on the table and columns for clarity
COMMENT ON TABLE public.customer_requests IS 'Tracks every time a customer adds a product to their cart, serving as a history of customer interest.';
COMMENT ON COLUMN public.customer_requests.product_id IS 'The ID of the product that was requested.';
COMMENT ON COLUMN public.customer_requests.quantity IS 'The quantity of the product added to the cart in a single action.';

-- Enable Row-Level Security (RLS) for the new table
ALTER TABLE public.customer_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for the table
-- 1. Allow public, anonymous users to INSERT new requests.
-- This is necessary for the frontend to be able to record when items are added to the cart.
CREATE POLICY "Allow anonymous insert for all users"
ON public.customer_requests
FOR INSERT
WITH CHECK (true);

-- 2. Allow authenticated users (admins) to SELECT all requests.
-- This allows the admin panel to read the data for analytics.
CREATE POLICY "Allow admin select for authenticated users"
ON public.customer_requests
FOR SELECT
USING (auth.role() = 'authenticated');
