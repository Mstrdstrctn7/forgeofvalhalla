import { createClient } from "@supabase/supabase-js";

const url  = import.meta.env.VITE_SUPABASE_URL!;
const anon = import.meta.env.VITE_SUPABASE_KEY!;

export const supa = createClient(url, anon);

// Also export as default so "import supa from" works
export default supa;
