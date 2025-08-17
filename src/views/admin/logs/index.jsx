// src/views/admin/logs/index.jsx
import React, { useEffect, useState } from "react";
import { Box, Heading, Table, Thead, Tr, Th, Tbody, Td, Badge, Button } from "@chakra-ui/react";
import { getState, resetState } from "../../../state/paperTrader.js";

export default function LogsPage() {
  const [logs, setLogs] = useState(getState().logs);

  useEffect(() => {
    const h = setInterval(() => setLogs(getState().logs), 1000);
    return () => clearInterval(h);
  }, []);

  return (
    <Box p={4}>
      <Heading size="lg" mb={4}>📜 Trade Logs</Heading>
      <Button size="sm" onClick={()=>{ resetState(); setLogs(getState().logs); }}>Reset Paper State</Button>
      <Table size="sm" mt={3}>
        <Thead>
          <Tr>
            <Th>Time</Th>
            <Th>Type</Th>
            <Th>Instrument</Th>
            <Th isNumeric>Price</Th>
            <Th isNumeric>Qty</Th>
            <Th isNumeric>Cash ±</Th>
          </Tr>
        </Thead>
        <Tbody>
          {logs.slice(0,200).map(row => (
            <Tr key={row.id}>
              <Td>{new Date(row.ts).toLocaleString()}</Td>
              <Td><Badge colorScheme={row.type==="BUY"?"green":"red"}>{row.type}</Badge></Td>
              <Td>{row.instrument}</Td>
              <Td isNumeric>{row.price?.toLocaleString?.() ?? row.price}</Td>
              <Td isNumeric>{row.qty?.toFixed?.(6) ?? row.qty}</Td>
              <Td isNumeric>
                {row.type==="BUY" && row.spend ? `-${row.spend.toFixed(2)}` : ""}
                {row.type==="SELL" && row.receive ? `+${row.receive.toFixed(2)}` : ""}
              </Td>
            </Tr>
          ))}
          {logs.length===0 && (<Tr><Td colSpan={6}>No trades yet.</Td></Tr>)}
        </Tbody>
      </Table>
    </Box>
  );
}
