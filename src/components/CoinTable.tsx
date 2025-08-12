import { useEffect, useMemo, useState } from "react";

type Row = {
  symbol: string;
  last: string;
  change?: string;
  high?: string;
  low?: string;
  vol?: string;
};

export default function CoinTable(){
  const [rows,setRows] = useState<Row[]>([]);
  const [err,setErr] = useState<string|undefined>(undefined);
  const [q,setQ] = useState("");
  const [vs,setVs] = useState("USDT");
  const [lim,setLim] = useState(100);

  useEffect(() => {
    const controller = new AbortController();
    const url = `/.netlify/functions/ticker?vs=${encodeURIComponent(vs)}&limit=${lim}`;
    (async () => {
      try{
        setErr(undefined);
        const r = await fetch(url, {signal: controller.signal, headers: {"accept":"application/json"}});
        if(!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        setRows(Array.isArray(data) ? data : []);
      }catch(e:any){
        setErr(e?.message || "Failed to load");
        setRows([]);
      }
    })();
    return () => controller.abort();
  },[vs,lim]);

  const filtered = useMemo(() => {
    const qq = q.trim().toUpperCase();
    if(!qq) return rows;
    return rows.filter(r => r.symbol.includes(qq));
  },[rows,q]);

  return (
    <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 p-4">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <label className="text-sm opacity-80">Market</label>
        <select value={vs} onChange={e=>setVs(e.target.value)} className="bg-zinc-800 rounded px-2 py-1">
          <option>USD</option><option>USDT</option><option>USDC</option>
        </select>
        <select value={lim} onChange={e=>setLim(Number(e.target.value))} className="bg-zinc-800 rounded px-2 py-1">
          <option>50</option><option>100</option><option>200</option>
        </select>
        <input
          value={q}
          onChange={e=>setQ(e.target.value)}
          placeholder="Search (e.g. BTC, ETH)"
          className="flex-1 min-w-[140px] bg-zinc-800 rounded px-3 py-1 outline-none"
        />
        <button
          className="px-3 py-1 rounded bg-zinc-800 border border-zinc-700"
          onClick={() => { /* soft refresh handled by deps */ }}
          disabled
          title="Auto-refreshes on filters"
        >
          Refresh
        </button>
      </div>

      {err && <div className="text-red-400 text-sm mb-2">Error: {err}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-zinc-400">
            <tr className="border-b border-zinc-800">
              <th className="text-left py-2">Symbol</th>
              <th className="text-right">Last</th>
              <th className="text-right">24h Δ</th>
              <th className="text-right">High</th>
              <th className="text-right">Low</th>
              <th className="text-right">Vol</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.symbol} className="border-b border-zinc-900/50">
                <td className="py-2">{r.symbol}</td>
                <td className="text-right">{r.last}</td>
                <td className={`text-right ${Number(r.change||0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {r.change ?? ""}
                </td>
                <td className="text-right">{r.high ?? ""}</td>
                <td className="text-right">{r.low ?? ""}</td>
                <td className="text-right">{r.vol ?? ""}</td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={6} className="py-4 text-center opacity-60">No rows.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
