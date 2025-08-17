// src/components/markets/TickerBoard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Flex,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Button,
  Spinner,
  useColorModeValue,
} from "@chakra-ui/react";

// ====== CONFIG ======
const REFRESH_MS = 2000; // 2s
// Choose provider: "binance" (HTTP polling, works now), or "cryptoComWS" (WebSocket)
const DEFAULT_PROVIDER = "binance";
// Max rows to render
const MAX_ROWS = 250;

// ---------- Helpers ----------
function normalizeBinanceItem(i) {
  const sym = i.symbol || "";
  const quote =
    sym.endsWith("USDT") ? "USDT" :
    sym.endsWith("BUSD") ? "BUSD" :
    sym.endsWith("FDUSD") ? "FDUSD" :
    sym.endsWith("USDC") ? "USDC" : "";
  return {
    symbol: sym,
    lastPrice: Number(i.lastPrice),
    priceChangePercent: Number(i.priceChangePercent),
    volume: Number(i.volume),
    quote,
  };
}

function normalizeCryptoComTicker(obj) {
  const instrument = obj.i || obj.instrument_name || "";
  const [base, quote] = instrument.split("_");
  const last =
    obj.p ?? obj.a ?? obj.k ?? obj.last_price ?? obj.latest_trade_price ?? 0;
  const pct =
    obj.c !== undefined
      ? Number(obj.c)
      : (obj.change && obj.change.rate) ? Number(obj.change.rate * 100) : 0;
  const vol =
    obj.v !== undefined
      ? Number(obj.v)
      : (obj.volume_24h ?? 0);

  return {
    symbol: `${base || ""}${quote || ""}`,
    lastPrice: Number(last),
    priceChangePercent: pct,
    volume: vol,
    quote,
  };
}

// Binance 24h ticker (HTTP polling)
async function fetchBinance() {
  const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
  if (!res.ok) throw new Error(`Binance HTTP ${res.status}`);
  const arr = await res.json();
  return arr
    .filter(
      (r) =>
        typeof r.symbol === "string" &&
        !r.symbol.endsWith("DOWN") &&
        !r.symbol.endsWith("UP")
    )
    .map(normalizeBinanceItem);
}

// Crypto.com Exchange WebSocket (optional)
function useCryptoComWS(active) {
  const [data, setData] = useState([]);
  const wsRef = useRef(null);
  const bufRef = useRef(new Map());
  const flushTimerRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    const ws = new WebSocket("wss://stream.crypto.com/v2/market");
    wsRef.current = ws;

    ws.onopen = () => {
      fetch("https://api.crypto.com/v2/public/get-instruments")
        .then((r) => r.json())
        .then((json) => {
          const instruments = (json?.result?.instruments ?? [])
            .map((it) => it.instrument_name)
            .filter((n) => typeof n === "string" && n.endsWith("_USDT"));

          const chunkSize = 200;
          for (let i = 0; i < instruments.length; i += chunkSize) {
            const chunk = instruments.slice(i, i + chunkSize);
            const channels = chunk.map((n) => `ticker.${n}`);
            ws.send(
              JSON.stringify({
                id: Date.now() + i,
                method: "subscribe",
                params: { channels },
              })
            );
          }
        })
        .catch(() => {});
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        const list =
          msg?.result?.data ?? msg?.params?.data ?? msg?.data ?? [];
        for (const item of list) {
          const norm = normalizeCryptoComTicker(item);
          if (norm.symbol && !Number.isNaN(norm.lastPrice)) {
            bufRef.current.set(norm.symbol, norm);
          }
        }
      } catch {
        // ignore malformed frames
      }
    };

    // flush buffer to state every 1s
    flushTimerRef.current = setInterval(() => {
      setData(Array.from(bufRef.current.values()));
    }, 1000);

    return () => {
      clearInterval(flushTimerRef.current);
      try {
        ws.close();
      } catch {}
    };
  }, [active]);

  return data;
}

function sortByKey(arr, key, dir) {
  const m = dir === "desc" ? -1 : 1;
  return [...arr].sort((a, b) => {
    const av = a[key] ?? 0,
      bv = b[key] ?? 0;
    if (av < bv) return -1 * m;
    if (av > bv) return 1 * m;
    return 0;
  });
}
const pctColor = (p) => (p > 0 ? "green.400" : p < 0 ? "red.400" : "gray.400");

// ---------- Component ----------
export default function TickerBoard({ provider = DEFAULT_PROVIDER }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: "volume", dir: "desc" });
  const pollTimerRef = useRef(null);

  const headerBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const border = useColorModeValue("gray.200", "whiteAlpha.200");

  // Crypto.com WS live data
  const cdcWSData = useCryptoComWS(provider === "cryptoComWS" && !paused);

  // Binance polling
  useEffect(() => {
    if (provider !== "binance" || paused) return;
    let cancelled = false;

    async function tick() {
      try {
        if (!cancelled) setLoading(true);
        const data = await fetchBinance();
        if (!cancelled) setRows(data);
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    tick();
    pollTimerRef.current = setInterval(tick, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(pollTimerRef.current);
    };
  }, [provider, paused]);

  // WS -> rows
  useEffect(() => {
    if (provider !== "cryptoComWS") return;
    setRows(cdcWSData);
    setLoading(false);
  }, [cdcWSData, provider]);

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    let base = rows;
    if (q) base = base.filter((r) => r.symbol.includes(q));
    return sortByKey(base, sort.key, sort.dir).slice(0, MAX_ROWS);
  }, [rows, query, sort]);

  const toggleSort = (key) => {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" }
    );
  };

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
          <Button size="sm" variant="outline" onClick={() => setSort({ key: "volume", dir: "desc" })}>
            Sort: Volume
          </Button>
          <Button size="sm" variant="outline" onClick={() => setSort({ key: "priceChangePercent", dir: "desc" })}>
            Sort: 24h %
          </Button>
          <Button size="sm" onClick={() => setPaused((p) => !p)}>
            {paused ? "Resume" : "Pause"}
          </Button>
        </Flex>
      </Flex>

      <Box overflow="auto" maxH="70vh" borderWidth="1px" borderColor={border} rounded="lg">
        <Table size="sm" variant="simple">
          <Thead bg={headerBg} position="sticky" top={0} zIndex={1}>
            <Tr>
              <Th cursor="pointer" onClick={() => toggleSort("symbol")}>
                <Flex align="center" gap={1}>Symbol ▴▾</Flex>
              </Th>
              <Th isNumeric cursor="pointer" onClick={() => toggleSort("lastPrice")}>
                <Flex justify="end" align="center" gap={1}>Last ▴▾</Flex>
              </Th>
              <Th isNumeric cursor="pointer" onClick={() => toggleSort("priceChangePercent")}>
                <Flex justify="end" align="center" gap={1}>24h % ▴▾</Flex>
              </Th>
              <Th isNumeric cursor="pointer" onClick={() => toggleSort("volume")}>
                <Flex justify="end" align="center" gap={1}>Volume ▴▾</Flex>
              </Th>
              <Th>Quote</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading && filtered.length === 0 ? (
              <Tr>
                <Td colSpan={5}>
                  <Flex py={6} justify="center" align="center" gap={2}>
                    <Spinner size="sm" />
                    <Text>Loading market data…</Text>
                  </Flex>
                </Td>
              </Tr>
            ) : filtered.length === 0 ? (
              <Tr>
                <Td colSpan={5}>
                  <Text py={6} align="center">No results</Text>
                </Td>
              </Tr>
            ) : (
              filtered.map((r) => (
                <Tr key={r.symbol}>
                  <Td><Text fontWeight="semibold">{r.symbol}</Text></Td>
                  <Td isNumeric>{r.lastPrice?.toLocaleString?.() ?? r.lastPrice}</Td>
                  <Td isNumeric color={pctColor(r.priceChangePercent)}>
                    {typeof r.priceChangePercent === "number"
                      ? `${r.priceChangePercent.toFixed(2)}%`
                      : r.priceChangePercent}
                  </Td>
                  <Td isNumeric>{r.volume?.toLocaleString?.() ?? r.volume}</Td>
                  <Td>{r.quote || "-"}</Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      <Flex mt={3} justify="space-between" align="center" wrap="wrap" gap={2}>
        <Text fontSize="xs" color="gray.500">
          Source: {provider === "binance" ? "Binance 24h Ticker (HTTP, 2s)" : "Crypto.com Exchange (WebSocket)"}
        </Text>
        <Flex gap={2}>
          <Button
            size="xs"
            variant={provider === "binance" ? "solid" : "outline"}
            onClick={() => window.dispatchEvent(new CustomEvent("ticker:setProvider", { detail: "binance" }))}
          >
            Binance
          </Button>
          <Button
            size="xs"
            variant={provider === "cryptoComWS" ? "solid" : "outline"}
            onClick={() => window.dispatchEvent(new CustomEvent("ticker:setProvider", { detail: "cryptoComWS" }))}
          >
            Crypto.com (WS)
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}

// Provider toggle wrapper (no remount)
export function TickerBoardWithProviderToggle() {
  const [prov, setProv] = useState(DEFAULT_PROVIDER);
  useEffect(() => {
    const fn = (e) => setProv(e.detail);
    window.addEventListener("ticker:setProvider", fn);
    return () => window.removeEventListener("ticker:setProvider", fn);
  }, []);
  return <TickerBoard provider={prov} />;
}
