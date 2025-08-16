// src/views/admin/Logs.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { supabase } from "../../utils/supabaseClient";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from("paper_trades")
        .select("*")
        .order("created_at", { ascending: true });
      if (!error) setLogs(data);
      setLoading(false);
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
    <Box p={6}>
      <Heading size="lg" mb={4}>
        📜 Trade Logs
      </Heading>

      {loading ? (
        <Center py={10}>
          <Spinner size="xl" />
        </Center>
      ) : logs.length === 0 ? (
        <Text>No trades found.</Text>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>COIN</Th>
                <Th>SIDE</Th>
                <Th>QTY</Th>
                <Th>PRICE</Th>
                <Th>RESULT</Th>
              </Tr>
            </Thead>
            <Tbody>
              {logsWithResults.map((log) => (
                <Tr key={log.id}>
                  <Td>{log.coin}</Td>
                  <Td>{log.side}</Td>
                  <Td>{log.qty}</Td>
                  <Td>${parseFloat(log.price).toFixed(2)}</Td>
                  <Td>{log.result ? `$${log.result}` : "-"}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
