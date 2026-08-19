import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dlvnjnmnczfphpfwkpog.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdm5qbm1uY3pmcGhwZndrcG9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxOTY0OTksImV4cCI6MjEwMTc3MjQ5OX0.Cvo7thUTavpU6PM7Fk1DxPCrWw6p1XH3nRzslxunDi0';

export const isSupabaseConfigured = () => {
  return (
    (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://xyzcompany.supabase.co') ||
    supabaseUrl !== ''
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'public' },
  global: {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    },
    fetch: (url, options = {}) => {
      // Strip conditional headers in-place to prevent breaking internal property assignments
      if (options.headers) {
        if (options.headers instanceof Headers) {
          options.headers.delete('If-None-Match');
          options.headers.delete('If-Modified-Since');
          options.headers.delete('if-none-match');
          options.headers.delete('if-modified-since');
        } else if (Array.isArray(options.headers)) {
          options.headers = options.headers.filter(
            (item) => {
              const key = Array.isArray(item) ? item[0] : '';
              return !['if-none-match', 'if-modified-since'].includes(key.toLowerCase());
            }
          );
        } else if (typeof options.headers === 'object') {
          for (const key of Object.keys(options.headers)) {
            if (['if-none-match', 'if-modified-since'].includes(key.toLowerCase())) {
              delete options.headers[key];
            }
          }
        }
      }
      return fetch(url, { ...options, cache: 'no-store' });
    },
  },
});

