import { createClient } from "@supabase/supabase-js";

// Read from Vite env (dev + Netlify) — must be defined in Netlify env
const url  = import.meta.env.VITE_SUPABASE_URL!;
const anon = import.meta.env.VITE_SUPABASE_KEY!;

export const supa = createClient(url, anon);
export default supa;
