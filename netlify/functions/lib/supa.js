import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
// Server must use service role (falls back to anon only if not set)
const key = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY;

export const supa = createClient(url, key, {
  auth: { persistSession: false },
});
