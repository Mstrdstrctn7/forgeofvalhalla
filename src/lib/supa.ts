import { createClient } from "@supabase/supabase-js";
<<<<<<< HEAD

const url  = import.meta.env.VITE_SUPABASE_URL!;
const anon = import.meta.env.VITE_SUPABASE_KEY!;

export const supa = createClient(url, anon);

// Also export as default so "import supa from" works
=======
const url  = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_KEY as string;
export const supa = createClient(url, anon);
>>>>>>> 8f0ff6b (Push current working Forge of Valhalla to Netlify for production)
export default supa;
