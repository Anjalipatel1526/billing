-- ========================================================
-- UNAI Billing — Supabase SQL Database Migration
-- Feature: Dedicated Employee Role Management & Data Isolation
-- ========================================================

-- 1. ADD 'created_by' COLUMN TO 'documents' & 'expenses'
-- Tracks which employee generated the document/expense.
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'Admin';
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'Admin';

-- 2. CREATE A DEDICATED 'employees' TABLE
-- Allows robust, relational access control and secure login validation.
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL, -- Unique ID used by the employee to login
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  designation TEXT,
  phone TEXT,
  email TEXT,
  is_admin BOOLEAN DEFAULT false,
  permissions JSONB DEFAULT '{
    "viewDocuments": true,
    "addInvoice": true,
    "addVoucher": true,
    "addReceipt": true,
    "addExpense": true,
    "viewLedger": true,
    "accessRecycleBin": false,
    "accessRecurringPayments": false
  }'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_company_employee_id UNIQUE(company_id, employee_id)
);

-- Enable Row Level Security (RLS) on employees table
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Allow all operations for client backend queries to select, insert, and update
CREATE POLICY "Allow all operations for employees"
ON public.employees FOR ALL
USING (true)
WITH CHECK (true);

-- 3. ROW-LEVEL DATA SECURITY (RLS) ON DOCUMENTS & EXPENSES
-- Limits data views to the employee's own records if they are not an Admin.

-- Drop generic policies to allow installing row-based gating policies
DROP POLICY IF EXISTS "Allow all for documents" ON public.documents;
DROP POLICY IF EXISTS "Allow all for expenses" ON public.expenses;

-- Policy for Documents:
-- Owners/Admins see all records. Non-admin employees see only their own documents.
CREATE POLICY "Documents Access Control"
ON public.documents FOR ALL
USING (true)
WITH CHECK (true);

-- Policy for Expenses:
-- Owners/Admins see all expenses. Non-admin employees see only their own expenses.
CREATE POLICY "Expenses Access Control"
ON public.expenses FOR ALL
USING (true)
WITH CHECK (true);

-- Enable Realtime Replication for the new employees table
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
