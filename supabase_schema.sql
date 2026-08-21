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
  watermark_logo TEXT,
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
  company_code TEXT UNIQUE,
  company_password TEXT,
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

-- Row Level Security (RLS) Policies (Enforce Authentication & User Ownership)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 1. COMPANIES POLICIES
-- Anyone (including anonymous/anon users) can select, insert, update, or delete companies.
CREATE POLICY "Allow all for companies" 
ON public.companies FOR ALL 
USING (true)
WITH CHECK (true);


-- 2. DOCUMENTS POLICIES
-- Anyone can select, insert, update, or delete documents.
CREATE POLICY "Allow all for documents" 
ON public.documents FOR ALL 
USING (true)
WITH CHECK (true);


-- 3. SETTINGS POLICIES
-- Anyone can perform all operations on settings.
CREATE POLICY "Allow all for settings" 
ON public.settings FOR ALL 
USING (true)
WITH CHECK (true);

-- 4. LEDGER ENTRIES TABLE (Optional / Manual Reconciliations)
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES public.companies(id) ON DELETE CASCADE,
  document_id TEXT REFERENCES public.documents(id) ON DELETE SET NULL,
  entry_date TEXT NOT NULL,
  particulars TEXT,
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_company_id ON public.ledger_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_entry_date ON public.ledger_entries(entry_date);

-- 5. ENABLE REALTIME REPLICATION (For instant UI updates across devices)
ALTER PUBLICATION supabase_realtime ADD TABLE public.companies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ledger_entries;

-- ========================================================
-- NEW ENTITIES: EXPENSES & RECURRING REMINDERS
-- ========================================================

-- 6. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES public.companies(id) ON DELETE CASCADE,
  particulars TEXT NOT NULL,
  amount NUMERIC DEFAULT 0,
  category TEXT,
  date TEXT,
  project_event TEXT DEFAULT '',
  paid_via TEXT DEFAULT 'Cash',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RECURRING REMINDERS TABLE
CREATE TABLE IF NOT EXISTS public.recurring_reminders (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES public.companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'income' | 'outcome'
  title TEXT NOT NULL,
  amount NUMERIC DEFAULT 0,
  frequency TEXT NOT NULL, -- 'daily' | 'weekly' | 'monthly' | 'yearly'
  next_date TEXT,
  reminder_days_before INTEGER DEFAULT 1,
  emails JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active', -- 'active' | 'paused'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance optimization
CREATE INDEX IF NOT EXISTS idx_expenses_company_id ON public.expenses(company_id);
CREATE INDEX IF NOT EXISTS idx_recurring_reminders_company_id ON public.recurring_reminders(company_id);

-- Enable RLS for newly added entities and ledger
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_reminders ENABLE ROW LEVEL SECURITY;

-- 4. LEDGER ENTRIES POLICIES
CREATE POLICY "Allow all for ledger_entries" 
ON public.ledger_entries FOR ALL 
USING (true)
WITH CHECK (true);


-- 5. EXPENSES POLICIES
CREATE POLICY "Allow all for expenses" 
ON public.expenses FOR ALL 
USING (true)
WITH CHECK (true);


-- 6. RECURRING REMINDERS POLICIES
CREATE POLICY "Allow all for recurring_reminders" 
ON public.recurring_reminders FOR ALL 
USING (true)
WITH CHECK (true);

-- Enable Realtime Replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recurring_reminders;
