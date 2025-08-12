import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL || "";
const anon = import.meta.env.VITE_SUPABASE_KEY || "";

if (!url || !anon) {
  console.warn("⚠ Supabase env vars missing:", { hasURL: !!url, hasAnon: !!anon });
}

export const supa = createClient(url, anon);
