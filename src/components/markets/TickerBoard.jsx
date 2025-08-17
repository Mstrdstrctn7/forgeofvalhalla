import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box, Flex, Input, Table, Thead, Tbody, Tr, Th, Td,
  Text, Button, IconButton, Spinner, useColorModeValue,
} from "@chakra-ui/react";

const MAX_ROWS = 250;
const DEFAULT_PROVIDER = "cryptoComWS";

function normalizeCryptoComTicker(obj) {
  const instrument = obj.i || obj.instrument_name || "";
  const [base, quote] = instrument.split("_");
  const last = obj.p ?? obj.a ?? obj.k ?? obj.last_price ?? obj.latest_trade_price ?? 0;
  const pct = obj.c !== undefined ? Number(obj.c) : 0;
  const vol = obj.v !== undefined ? Number(obj.v) : 0;

  return {
    symbol: `${base || ""}${quote || ""}`.toUpperCase(),
    lastPrice: Number(last),
    priceChangePercent: Number(pct),
    volume: Number(vol),
    quote: quote || "",
  };
}

function useCryptoComWS(active) {
  const [data, setData] = useState([]);
  const wsRef = useRef(null);
  const bufRef = useRef(new Map());

  useEffect(() => {
    if (!active) return;
    const ws = new WebSocket("wss://stream.crypto.com/v2/market");
    wsRef.current = ws;

    ws.onopen = () => {
      // Hardcode BTC/ETH/SOL immediately
      const pairs = ["BTC_USDT", "ETH_USDT", "SOL_USDT"];
      ws.send(JSON.stringify({
        id: Date.now(),
        method: "subscribe",
        params: { channels: pairs.map((n) => `ticker.${n}`) },
      }));
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        const list = msg?.result?.data ?? msg?.params?.data ?? [];
        for (const item of list) {
          const norm = normalizeCryptoComTicker(item);
          if (norm.symbol && !Number.isNaN(norm.lastPrice)) {
            bufRef.current.set(norm.symbol, norm);
          }
        }
        setData(Array.from(bufRef.current.values()));
      } catch {}
    };

    return () => {
      try { ws.close(); } catch {}
    };
  }, [active]);

  return data;
}

function sortByKey(arr, key, dir) {
  const m = dir === "desc" ? -1 : 1;
  return [...arr].sort((a, b) => {
    const av = a[key] ?? 0, bv = b[key] ?? 0;
    if (av < bv) return -1 * m;
    if (av > bv) return  1 * m;
    return 0;
  });
}
const pctColor = (p) => (p > 0 ? "green.400" : p < 0 ? "red.400" : "gray.400");

export default function TickerBoard({ provider = DEFAULT_PROVIDER }) {
  const [paused, setPaused] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: "volume", dir: "desc" });
  const headerBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const border = useColorModeValue("gray.200", "whiteAlpha.200");

  const rows = useCryptoComWS(!paused);

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    let base = rows;
    if (q) base = base.filter((r) => r.symbol.includes(q));
    return sortByKey(base, sort.key, sort.dir).slice(0, MAX_ROWS);
  }, [rows, query, sort]);

  return (
    <Box borderWidth="1px" borderColor={border} rounded="xl" p={3}>
      <Flex gap={3} align="center" mb={3} wrap="wrap">
        <Text fontWeight="bold">Market</Text>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search symbol (e.g. BTC, ETH, SOL)"
          maxW="260px"
          size="sm"
        />
        <Flex ml="auto" gap={2}>
          <Button size="sm" variant="outline"
            onClick={() => setSort({ key: "volume", dir: "desc" })}>
            Sort: Volume
          </Button>
          <Button size="sm" variant="outline"
            onClick={() => setSort({ key: "priceChangePercent", dir: "desc" })}>
            Sort: 24h %
          </Button>
          <IconButton size="sm"
            aria-label={paused ? "Resume" : "Pause"}
            onClick={() => setPaused((p) => !p)}>
            {paused ? "▶" : "⏸"}
          </IconButton>
        </Flex>
      </Flex>

      <Box overflow="auto" maxH="70vh" borderWidth="1px" borderColor={border} rounded="lg">
        <Table size="sm" variant="simple">
          <Thead bg={headerBg} position="sticky" top={0} zIndex={1}>
            <Tr>
              <Th>Symbol</Th>
              <Th isNumeric>Last</Th>
              <Th isNumeric>24h %</Th>
              <Th isNumeric>Volume</Th>
              <Th>Quote</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.length === 0 ? (
              <Tr>
                <Td colSpan={5}>
                  <Flex py={6} justify="center" align="center" gap={2}>
                    <Spinner size="sm" />
                    <Text>Waiting for live data…</Text>
                  </Flex>
                </Td>
              </Tr>
            ) : (
              filtered.map((r) => (
                <Tr key={r.symbol}>
                  <Td><Text fontWeight="semibold">{r.symbol}</Text></Td>
                  <Td isNumeric>{r.lastPrice}</Td>
                  <Td isNumeric color={pctColor(r.priceChangePercent)}>
                    {r.priceChangePercent.toFixed(2)}%
                  </Td>
                  <Td isNumeric>{r.volume}</Td>
                  <Td>{r.quote}</Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      <Flex mt={3} justify="space-between" align="center" wrap="wrap" gap={2}>
        <Text fontSize="xs" color="gray.500">
          Source: Crypto.com Exchange (BTC/ETH/SOL live)
        </Text>
      </Flex>
    </Box>
  );
}
