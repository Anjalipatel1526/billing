import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://emqpsswicousslzdmikj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtcXBzc3dpY291c3NsemRtaWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMTI3ODMsImV4cCI6MjEwMjc4ODc4M30.zNNWcTD7fLpB5ZaElx480saAMBfIbTJpj_eDRxRpeFM';

export const isSupabaseConfigured = () => {
  return (
    (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://xyzcompany.supabase.co') ||
    supabaseUrl !== 'https://xyzcompany.supabase.co'
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'public' },
  global: {
    fetch: (url, options = {}) => {
      // Safely parse and copy headers into a clean plain JavaScript object
      let reqHeaders: Record<string, string> = {};
      if (options.headers) {
        if (options.headers instanceof Headers) {
          options.headers.forEach((val, key) => {
            reqHeaders[key] = val;
          });
        } else if (Array.isArray(options.headers)) {
          options.headers.forEach((item) => {
            if (Array.isArray(item) && item[0]) {
              reqHeaders[item[0] as string] = item[1] as string;
            }
          });
        } else if (typeof options.headers === 'object') {
          reqHeaders = { ...options.headers } as Record<string, string>;
        }
      }

      // Enforce cache-bypassing headers
      reqHeaders['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      reqHeaders['Pragma'] = 'no-cache';
      reqHeaders['Expires'] = '0';

      // Explicitly delete conditional request headers to avoid 304 Not Modified responses
      delete reqHeaders['if-none-match'];
      delete reqHeaders['if-modified-since'];
      delete reqHeaders['If-None-Match'];
      delete reqHeaders['If-Modified-Since'];

      options.headers = reqHeaders;

      return fetch(url, { ...options, cache: 'no-store' }).then(response => {
        if (response.status === 401) {
          console.warn('[Supabase Fetch] Received 401 Unauthorized. Clearing stale auth session...');
          
          let cleared = false;
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('sb-') || key.includes('auth-token'))) {
              localStorage.removeItem(key);
              cleared = true;
            }
          }
          if (cleared) {
            window.location.href = '/';
          }
        }
        return response;
      });
    },
  },
});
