import { createClient } from "@supabase/supabase-js";
const url  = import.meta.env.VITE_SUPABASE_URL || "";
const anon = import.meta.env.VITE_SUPABASE_KEY || "";
if (!url || !anon) console.warn("⚠ Missing Supabase envs", {url:!!url, anon:!!anon});
export const supa = createClient(url, anon);
export default supa;
