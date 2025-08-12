import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type TickerRow = {
  symbol: string;
  last: string;
  change: string;
  high: string;
  low: string;
  vol: string;
};

export async function fetchTicker(): Promise<TickerRow[]> {
  const r = await fetch("/.netlify/functions/ticker", { cache: "no-store" });
  if (!r.ok) throw new Error(`ticker ${r.status}`);
  return r.json();
}

export async function checkTradingStatus(): Promise<
  "ok" | "disabled" | "unauth" | "error"
> {
  const { data } = await supabase.auth.getSession();
  const jwt = data.session?.access_token;

  const r = await fetch("/.netlify/functions/accountSummary", {
    headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
  });

  if (r.status === 200) return "ok";
  if (r.status === 403) return "disabled";
  if (r.status === 401) return "unauth";
  return "error";
}
