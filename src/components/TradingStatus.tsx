import { useEffect, useState } from "react";
import { checkTradingStatus } from "../lib/api";

export default function TradingStatus() {
  const [status, setStatus] = useState<"ok" | "disabled" | "unauth" | "error">(
    "disabled"
  );

  async function probe() {
    try {
      const s = await checkTradingStatus();
      setStatus(s);
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    probe();
    const id = setInterval(probe, 15000);
    return () => clearInterval(id);
  }, []);

  const map = {
    ok: { color: "bg-emerald-500", text: "Trading Ready" },
    disabled: { color: "bg-rose-500", text: "Trading Disabled" },
    unauth: { color: "bg-amber-500", text: "Login Required" },
    error: { color: "bg-rose-500", text: "Endpoint Error" },
  }[status];

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100">
      <span className={`w-2.5 h-2.5 rounded-full ${map.color}`} />
      <span className="text-sm">{map.text}</span>
    </div>
  );
}
