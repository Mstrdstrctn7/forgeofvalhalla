import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // This helps you see if envs aren’t available on Netlify/build
  // It will show in the browser devtools console.
  console.warn('Supabase env vars are missing. Check Netlify env settings.');
}

export const supabase = createClient(url, anon);
