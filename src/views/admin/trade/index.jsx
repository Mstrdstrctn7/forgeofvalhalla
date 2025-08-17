import React, { useEffect, useState } from "react";
import {
  Box, Button, Flex, Heading, HStack, NumberInput, NumberInputField,
  Select, Stat, StatLabel, StatNumber, StatHelpText, Table, Tbody, Tr, Td,
  useColorModeValue, Text
} from "@chakra-ui/react";
import { subscribeTickers, fetchTicker } from "../../../lib/market/cdcClient.js";
import { getState, marketOrder, resetState } from "../../../state/paperTrader.js";

const INSTRUMENTS = ["BTC_USDT","ETH_USDT","SOL_USDT","XRP_USDT","DOGE_USDT"];

export default function TradePage() {
  const [instrument, setInstrument] = useState(INSTRUMENTS[0]);
  const [percent, setPercent] = useState(20);
  const [price, setPrice] = useState(0);
  const [state, setState] = useState(getState());
  const [live, setLive] = useState(true);

  const card = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "whiteAlpha.200");
  const green = useColorModeValue("green.500","green.300");

  useEffect(() => {
    let stop = () => {};
    (async () => {
      try { const t = await fetchTicker(instrument); t && setPrice(t.last); } catch {}
      if (live) {
        stop = subscribeTickers([instrument], (t) => {
          if (t.instrument === instrument && t.last) setPrice(t.last);
        });
      }
    })();
    return () => stop();
  }, [instrument, live]);

  const pos = state.positions[instrument] || { qty: 0, avg: 0 };
  const posValue = pos.qty * price;
  const posPnL = pos.qty ? (price - pos.avg) * pos.qty : 0;

  const handle = (side) => {
    const s = marketOrder({ side, instrument, price, percent });
    setState(s);
  };

  return (
    <Box p={4}>
      <Heading size="lg" mb={4}>💹 KnightRider Trading Panel</Heading>

      <Flex gap={4} wrap="wrap">
        <Box bg={card} borderWidth="1px" borderColor={border} rounded="xl" p={4} minW="320px">
          <Heading size="md" mb={3}>Trade</Heading>

          <Text mb={1}>Select Market</Text>
          <Select value={instrument} onChange={(e) => setInstrument(e.target.value)} mb={3}>
            {INSTRUMENTS.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>

          <HStack mb={3}>
            <Stat><StatLabel>Last</StatLabel><StatNumber>{price ? price.toLocaleString() : "-"}</StatNumber><StatHelpText>Crypto.com WS</StatHelpText></Stat>
            <Stat><StatLabel>Paper Balance (USDT)</StatLabel><StatNumber>{state.balance.toFixed(2)}</StatNumber><StatHelpText>reset below</StatHelpText></Stat>
          </HStack>

          <Text mb={1}>Amount to Trade (%)</Text>
          <NumberInput value={percent} min={1} max={100} onChange={(_,v)=>setPercent(Number.isFinite(v)?v:percent)} mb={4}>
            <NumberInputField />
          </NumberInput>

          <HStack>
            <Button colorScheme="green" onClick={()=>handle("BUY")}>🚀 Execute BUY</Button>
            <Button colorScheme="red" onClick={()=>handle("SELL")}>📉 Execute SELL</Button>
          </HStack>

          <HStack mt={3}>
            <Button size="sm" onClick={()=>setLive(x=>!x)}>{live?"Pause Live":"Resume Live"}</Button>
            <Button size="sm" variant="outline" onClick={()=>{ setState(resetState()); }}>Reset Paper</Button>
          </HStack>
        </Box>

        <Box bg={card} borderWidth="1px" borderColor={border} rounded="xl" p={4} flex="1 1 320px">
          <Heading size="md" mb={3}>Position</Heading>
          <Table size="sm" variant="simple">
            <Tbody>
              <Tr><Td>Instrument</Td><Td isNumeric>{instrument}</Td></Tr>
              <Tr><Td>Qty</Td><Td isNumeric>{pos.qty.toFixed(6)}</Td></Tr>
              <Tr><Td>Avg Price</Td><Td isNumeric>{pos.avg ? pos.avg.toLocaleString() : "-"}</Td></Tr>
              <Tr><Td>Market Value</Td><Td isNumeric>{posValue ? posValue.toLocaleString() : "-"}</Td></Tr>
              <Tr><Td>P/L</Td><Td isNumeric color={posPnL>=0?green:"red.400"}>{posPnL ? posPnL.toLocaleString() : "-"}</Td></Tr>
            </Tbody>
          </Table>
        </Box>
      </Flex>
    </Box>
  );
}
