import { createClient } from "@supabase/supabase-js";

// pull from Vite env (works in dev and Netlify)
const url = import.meta.env.VITE_SUPABASE_URL || "";
const anon = import.meta.env.VITE_SUPABASE_KEY || "";

// warn if missing (but don't crash build)
if (!url || !anon) {
  console.warn("⚠ Supabase env vars missing:", { VITE_SUPABASE_URL: !!url, VITE_SUPABASE_KEY: !!anon });
}

export const supa = createClient(url, anon);
export default supa; // <- ensure default export exists
