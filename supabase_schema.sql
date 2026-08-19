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
-- SELECT: Anyone can read companies (needed for public preview of invoices and looking up companies by code to join).
CREATE POLICY "Allow select for companies" 
ON public.companies FOR SELECT 
USING (true);

-- INSERT: Only authenticated users can create companies.
CREATE POLICY "Allow insert for authenticated companies" 
ON public.companies FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- UPDATE: Only authenticated users who are members of the company can update it.
CREATE POLICY "Allow update for company members" 
ON public.companies FOR UPDATE 
TO authenticated 
USING (
  COALESCE(auth.jwt() -> 'user_metadata' -> 'company_ids', '[]'::jsonb) @> jsonb_build_array(id)
)
WITH CHECK (
  COALESCE(auth.jwt() -> 'user_metadata' -> 'company_ids', '[]'::jsonb) @> jsonb_build_array(id)
);

-- DELETE: Only authenticated users who are members of the company can delete it.
CREATE POLICY "Allow delete for company members" 
ON public.companies FOR DELETE 
TO authenticated 
USING (
  COALESCE(auth.jwt() -> 'user_metadata' -> 'company_ids', '[]'::jsonb) @> jsonb_build_array(id)
);


-- 2. DOCUMENTS POLICIES
-- SELECT: Anyone can read documents (needed for public preview of invoices).
CREATE POLICY "Allow select for documents" 
ON public.documents FOR SELECT 
USING (true);

-- ALL OTHER OPERATIONS (INSERT, UPDATE, DELETE): Only authenticated users who are members of the company can modify documents.
CREATE POLICY "Allow write for company members on documents" 
ON public.documents FOR ALL 
TO authenticated 
USING (
  COALESCE(auth.jwt() -> 'user_metadata' -> 'company_ids', '[]'::jsonb) @> jsonb_build_array(company_id)
)
WITH CHECK (
  COALESCE(auth.jwt() -> 'user_metadata' -> 'company_ids', '[]'::jsonb) @> jsonb_build_array(company_id)
);


-- 3. SETTINGS POLICIES
-- Enforce that only authenticated users can read/write settings.
CREATE POLICY "Allow all operations for authenticated users on settings" 
ON public.settings FOR ALL 
TO authenticated 
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
CREATE POLICY "Allow all operations for company members on ledger_entries" 
ON public.ledger_entries FOR ALL 
TO authenticated 
USING (
  COALESCE(auth.jwt() -> 'user_metadata' -> 'company_ids', '[]'::jsonb) @> jsonb_build_array(company_id)
)
WITH CHECK (
  COALESCE(auth.jwt() -> 'user_metadata' -> 'company_ids', '[]'::jsonb) @> jsonb_build_array(company_id)
);

-- 5. EXPENSES POLICIES
CREATE POLICY "Allow all operations for company members on expenses" 
ON public.expenses FOR ALL 
TO authenticated 
USING (
  COALESCE(auth.jwt() -> 'user_metadata' -> 'company_ids', '[]'::jsonb) @> jsonb_build_array(company_id)
)
WITH CHECK (
  COALESCE(auth.jwt() -> 'user_metadata' -> 'company_ids', '[]'::jsonb) @> jsonb_build_array(company_id)
);

-- 6. RECURRING REMINDERS POLICIES
CREATE POLICY "Allow all operations for company members on recurring_reminders" 
ON public.recurring_reminders FOR ALL 
TO authenticated 
USING (
  COALESCE(auth.jwt() -> 'user_metadata' -> 'company_ids', '[]'::jsonb) @> jsonb_build_array(company_id)
)
WITH CHECK (
  COALESCE(auth.jwt() -> 'user_metadata' -> 'company_ids', '[]'::jsonb) @> jsonb_build_array(company_id)
);

-- Enable Realtime Replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recurring_reminders;
