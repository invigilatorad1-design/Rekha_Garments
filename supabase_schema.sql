-- 
-- Rekha Garments Supabase Database Schema
-- Run this in your Supabase SQL Editor to initialize the required PostgreSQL tables.
--

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY, -- Firebase/Supabase Auth UID or Custom string identifier
    full_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL UNIQUE,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) & Policies
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-write for all" ON public.customers FOR ALL USING (true) WITH CHECK (true);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('garments', 'jewellery')),
    sub_category TEXT,
    image_url TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    stock INTEGER NOT NULL DEFAULT 0,
    sizes JSONB DEFAULT '[]'::jsonb,
    fabric TEXT,
    collection TEXT,
    availability BOOLEAN DEFAULT true NOT NULL,
    views INTEGER DEFAULT 0 NOT NULL,
    sales_count INTEGER DEFAULT 0 NOT NULL,
    archived BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS & Policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 1. Allow any public/anonymous user to read products
CREATE POLICY "Allow public read access" ON public.products FOR SELECT USING (true);

-- 2. Allow authenticated admin users and the service_role to insert products
CREATE POLICY "Allow admin insert" ON public.products FOR INSERT TO authenticated, service_role WITH CHECK (true);

-- 3. Allow authenticated admin users and the service_role to update products
CREATE POLICY "Allow admin update" ON public.products FOR UPDATE TO authenticated, service_role USING (true) WITH CHECK (true);

-- 4. Allow authenticated admin users and the service_role to delete products
CREATE POLICY "Allow admin delete" ON public.products FOR DELETE TO authenticated, service_role USING (true);

-- 3. COUPONS TABLE
CREATE TABLE IF NOT EXISTS public.coupons (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL, -- 'percentage' | 'flat' | 'first_purchase' | 'festival'
    discount_value NUMERIC NOT NULL,
    minimum_order NUMERIC NOT NULL DEFAULT 0,
    expiry_date TEXT NOT NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    usage_count INTEGER DEFAULT 0 NOT NULL
);

-- Enable RLS & Policies
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 1. Allow any public/anonymous user to read coupons
CREATE POLICY "Allow public read access" ON public.coupons FOR SELECT USING (true);

-- 2. Allow authenticated admin users and the service_role to insert coupons
CREATE POLICY "Allow admin insert" ON public.coupons FOR INSERT TO authenticated, service_role WITH CHECK (true);

-- 3. Allow authenticated admin users and the service_role to update coupons
CREATE POLICY "Allow admin update" ON public.coupons FOR UPDATE TO authenticated, service_role USING (true) WITH CHECK (true);

-- 4. Allow authenticated admin users and the service_role to delete coupons
CREATE POLICY "Allow admin delete" ON public.coupons FOR DELETE TO authenticated, service_role USING (true);

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY, -- e.g. RKG_10001
    customer_id TEXT,
    customer_name TEXT,
    customer_mobile TEXT,
    subtotal NUMERIC NOT NULL,
    discount NUMERIC DEFAULT 0 NOT NULL,
    tax NUMERIC DEFAULT 0 NOT NULL,
    shipping NUMERIC DEFAULT 0 NOT NULL,
    grand_total NUMERIC NOT NULL,
    coupon_applied TEXT REFERENCES public.coupons(code) ON DELETE SET NULL,
    status TEXT DEFAULT 'Pending'::text NOT NULL, -- 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
    shipping_address JSONB NOT NULL,
    payment_status TEXT DEFAULT 'Pending'::text NOT NULL, -- 'Pending' | 'Paid' | 'Failed'
    timeline JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS & Policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-write for all" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- 5. ORDER_ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price NUMERIC NOT NULL
);

-- Enable RLS & Policies
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-write for all" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for all tables
ALTER REPLICA IDENTITY ON public.customers USING DEFAULT;
ALTER REPLICA IDENTITY ON public.products USING DEFAULT;
ALTER REPLICA IDENTITY ON public.coupons USING DEFAULT;
ALTER REPLICA IDENTITY ON public.orders USING DEFAULT;
ALTER REPLICA IDENTITY ON public.order_items USING DEFAULT;

-- Set up Realtime publications
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.customers, public.products, public.coupons, public.orders, public.order_items;
