-- This file contains SQL commands to set up the necessary tables for the JustPhones Showcase application.
-- Run these commands in your Supabase SQL Editor.

-- Drop existing tables if they exist to start fresh (optional, use with caution)
-- DROP TABLE IF EXISTS public.products;
-- DROP TABLE IF EXISTS public.faqs;
-- DROP TABLE IF EXISTS public.models;
-- DROP TABLE IF EXISTS public.product_names;

-- Create the 'models' table to store product models with their category
-- This allows for independent model management for cases, accessories, and headphones.
CREATE TABLE IF NOT EXISTS public.models (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT models_name_category_unique UNIQUE (name, category)
);

-- Add a 'category' column to the 'models' table if it doesn't already exist.
-- This is an alternative if you've already created the table without the category column.
-- You can run this command separately.
-- ALTER TABLE public.models ADD COLUMN IF NOT EXISTS category TEXT;


-- Create the 'product_names' table (for product names like 'Silicone Case')
-- This table stores the base names for products, selectable in the admin panel.
CREATE TABLE IF NOT EXISTS public.product_names (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT product_names_name_category_unique UNIQUE (name, category)
);


-- Create the 'products' table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price REAL NOT NULL,
    "coverImage" TEXT,
    colors JSONB,
    category TEXT,
    model TEXT,
    featured BOOLEAN DEFAULT FALSE
);

-- Create the 'faqs' table
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL
);

-- Note: After running these commands, you might want to insert some initial data
-- into 'models' and 'product_names' so you can start creating products in the admin panel.
-- Example:
-- INSERT INTO public.models (name, category) VALUES ('iPhone 15 Pro Max', 'case');
-- INSERT INTO public.models (name, category) VALUES ('Genérico', 'accessory');
-- INSERT INTO public.product_names (name, category) VALUES ('silicone-case', 'case');
-- INSERT INTO public.product_names (name, category) VALUES ('cargador-magsafe', 'accessory');
