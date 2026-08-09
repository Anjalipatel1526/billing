-- ========================================================
-- UNAI Billing — Complete Supabase PostgreSQL Schema
-- ========================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COMPANIES TABLE
CREATE TABLE IF NOT EXISTS public.companies (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  business_type TEXT DEFAULT 'Private Limited',
  logo TEXT,
  theme_color TEXT DEFAULT '#f97316',
  gst_number TEXT,
  pan_number TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  pincode TEXT,
  cin TEXT,
  udyam_number TEXT,
  bank_details JSONB DEFAULT '{}'::jsonb,
  invoice_prefix TEXT DEFAULT 'INV-',
  invoice_start_number INTEGER DEFAULT 1001,
  voucher_prefix TEXT DEFAULT 'VCH-',
  voucher_start_number INTEGER DEFAULT 1001,
  receipt_prefix TEXT DEFAULT 'REC-',
  receipt_start_number INTEGER DEFAULT 1001,
  default_tax NUMERIC DEFAULT 18,
  currency TEXT DEFAULT 'INR ₹',
  payment_terms TEXT,
  notes TEXT,
  payment_instructions TEXT,
  selected_template TEXT DEFAULT 'UNAI Billing',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DOCUMENTS TABLE (Invoices, Vouchers, Receipts)
CREATE TABLE IF NOT EXISTS public.documents (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES public.companies(id) ON DELETE CASCADE,
  document_number TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'invoice', -- 'invoice' | 'voucher' | 'receipt'
  document_date TEXT,
  due_date TEXT,
  status TEXT DEFAULT 'Pending', -- 'Pending' | 'Paid' | 'Overdue' | 'Draft'
  customer JSONB DEFAULT '{}'::jsonb,
  items JSONB DEFAULT '[]'::jsonb,
  totals JSONB DEFAULT '{}'::jsonb,
  paid_to TEXT,
  received_from TEXT,
  amount NUMERIC DEFAULT 0,
  template TEXT,
  notes TEXT,
  terms TEXT,
  discount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance optimization
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON public.documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON public.documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at);

-- Row Level Security (RLS) Policies (Enable Public Access for API Key access)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write access to companies" ON public.companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access to documents" ON public.documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access to settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
