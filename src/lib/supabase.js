import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dlvnjnmnczfphpfwkpog.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdm5qbm1uY3pmcGhwZndrcG9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxOTY0OTksImV4cCI6MjEwMTc3MjQ5OX0.Cvo7thUTavpU6PM7Fk1DxPCrWw6p1XH3nRzslxunDi0';

export const isSupabaseConfigured = () => {
  return (
    (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://xyzcompany.supabase.co') ||
    supabaseUrl !== 'https://xyzcompany.supabase.co'
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
