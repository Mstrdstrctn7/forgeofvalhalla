import { createClient } from "@supabase/supabase-js";

const url  = import.meta.env.VITE_SUPABASE_URL || "";
const anon = import.meta.env.VITE_SUPABASE_KEY || "";

if (!url || !anon) {
  console.warn("⚠ Supabase env vars are missing:", { hasUrl: !!url, hasAnon: !!anon });
}

export const supa = createClient(url, anon);
export default supa;
