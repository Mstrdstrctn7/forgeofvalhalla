import React, { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";
import {
  Box,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
} from "@chakra-ui/react";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from("paper_trades")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching logs:", error.message);
      } else {
        setLogs(data);
      }

      setLoading(false);
    };

    fetchLogs();
  }, []);

  return (
    <Box p={6}>
      <Text fontSize="2xl" fontWeight="bold" mb={4}>
        KnightRider Trade Logs
      </Text>

      {loading ? (
        <Spinner size="xl" />
      ) : logs.length === 0 ? (
        <Text>No trades found.</Text>
      ) : (
        <Table variant="striped" size="sm">
          <Thead>
            <Tr>
              <Th>Time</Th>
              <Th>Email</Th>
              <Th>Coin</Th>
              <Th>Side</Th>
              <Th>Qty</Th>
              <Th>Price</Th>
              <Th>Result</Th>
            </Tr>
          </Thead>
          <Tbody>
            {logs.map((log) => (
              <Tr key={log.id}>
                <Td>{new Date(log.timestamp).toLocaleString()}</Td>
                <Td>{log.user_email}</Td>
                <Td>{log.coin}</Td>
                <Td>{log.side}</Td>
                <Td>{log.quantity}</Td>
                <Td>${log.price}</Td>
                <Td>{log.result}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
}
