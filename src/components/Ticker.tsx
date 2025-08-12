import { useEffect, useState } from "react";
import { fetchTicker, TickerRow } from "../lib/api";

export default function Ticker() {
  const [rows, setRows] = useState<TickerRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setErr(null);
      const data = await fetchTicker();
      setRows(data);
    } catch (e: any) {
      setErr(e?.message || "failed");
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="p-4 rounded-2xl shadow border">
      <div className="font-semibold mb-2">Ticker</div>
      {err && <div className="text-red-500 text-sm mb-2">Error: {err}</div>}
      <div className="grid grid-cols-2 gap-2">
        {rows.map((r) => (
          <div
            key={r.symbol}
            className="flex items-center justify-between rounded-lg px-3 py-2 bg-gray-50"
          >
            <span className="font-mono">{r.symbol}</span>
            <span className="font-semibold">{r.last}</span>
          </div>
        ))}
        {!rows.length && !err && (
          <div className="text-sm text-gray-500 col-span-2">
            Loading prices…
          </div>
        )}
      </div>
    </div>
  );
}
