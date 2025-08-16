import React, { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";

export default function Logs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase.from("paper_trades").select("*").order("created_at", { ascending: true });
      if (!error) setLogs(data);
    };
    fetchLogs();
  }, []);

  const calculateResults = (logs) => {
    let avgBuy = 0;
    let totalQty = 0;
    return logs.map((log) => {
      let result = "";
      const qty = parseFloat(log.qty);
      const price = parseFloat(log.price);

      if (log.side === "BUY") {
        avgBuy = (avgBuy * totalQty + price * qty) / (totalQty + qty);
        totalQty += qty;
      } else if (log.side === "SELL") {
        result = ((price - avgBuy) * qty).toFixed(2);
        totalQty -= qty;
      }

      return { ...log, result };
    });
  };

  const logsWithResults = calculateResults(logs);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">📜 Trade Logs</h1>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th>COIN</th>
            <th>SIDE</th>
            <th>QTY</th>
            <th>PRICE</th>
            <th>RESULT</th>
          </tr>
        </thead>
        <tbody>
          {logsWithResults.map((log) => (
            <tr key={log.id} className="border-b">
              <td>{log.coin}</td>
              <td>{log.side}</td>
              <td>{log.qty}</td>
              <td>${parseFloat(log.price).toFixed(2)}</td>
              <td>{log.result ? `$${log.result}` : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
