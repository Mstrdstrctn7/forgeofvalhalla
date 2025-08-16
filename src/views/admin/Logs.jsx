import React, { useEffect, useState } from "react";
import { supabase } from "utils/supabaseClient";
import {
  Box,
  Heading,
  Text,
  VStack,
  Spinner,
  Badge,
} from "@chakra-ui/react";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("paper_trades")
      .select("*")
      .order("timestamp", { ascending: false });

    if (error) console.error("Fetch error:", error);
    else setLogs(data);

    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();

    const channel = supabase
      .channel("trade_logs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "paper_trades" },
        (payload) => {
          setLogs((prevLogs) => [payload.new, ...prevLogs]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <Box p="4">
      <Heading size="lg" mb="4">📜 Trade Logs</Heading>
      {loading ? (
        <Spinner />
      ) : (
        <VStack align="start" spacing="4">
          {logs.map((log) => (
            <Box key={log.id} p="4" borderWidth="1px" rounded="lg" w="100%">
              <Text><b>🪙 Coin:</b> {log.symbol}</Text>
              <Text><b>📈 Action:</b> {log.side}</Text>
              <Text><b>💰 Amount:</b> {log.amount}</Text>
              <Text><b>📅 Time:</b> {new Date(log.timestamp).toLocaleString()}</Text>
              <Badge colorScheme={log.mode === "paper" ? "purple" : "green"}>
                {log.mode === "paper" ? "Paper" : "Live"}
              </Badge>
            </Box>
          ))}
          {logs.length === 0 && (
            <Text>No trades yet. Use the Trade Panel to begin.</Text>
          )}
        </VStack>
      )}
    </Box>
  );
}
