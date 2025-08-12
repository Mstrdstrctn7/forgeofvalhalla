import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_KEY as string;

// Create client
export const supa = createClient(url, key);

// Handy re-exports
export const auth = supa.auth;

// Provide default too, so `import supa from "../lib/supa"` also works
export default supa;
