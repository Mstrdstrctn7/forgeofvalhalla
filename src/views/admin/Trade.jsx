import React, { useState } from "react";
import {
  Box,
  Button,
  Select,
  Switch,
  Text,
  Input,
  FormLabel,
  FormControl,
  VStack,
  useToast,
} from "@chakra-ui/react";

export default function Trade() {
  const [coin, setCoin] = useState("BTC");
  const [amountPercent, setAmountPercent] = useState(20);
  const [action, setAction] = useState("sell");
  const [paperMode, setPaperMode] = useState(true);
  const toast = useToast();

  const handleSubmit = async () => {
    const payload = {
      coin,
      amountPercent,
      action,
      paper: paperMode,
      email: "tazriker212@gmail.com", // 🔒 for user validation
    };

    try {
      const response = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "✅ Trade Successful",
          description: result.message || "Order placed.",
          status: "success",
          duration: 4000,
          isClosable: true,
        });
      } else {
        toast({
          title: "⚠️ Trade Failed",
          description: result.message || "Check logs.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: error.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={6}>
      <Text fontSize="2xl" fontWeight="bold" mb={4}>
        💸 KnightRider Trading Panel
      </Text>
      <VStack spacing={4} align="stretch">
        <FormControl>
          <FormLabel>🪙 Select Coin</FormLabel>
          <Select value={coin} onChange={(e) => setCoin(e.target.value)}>
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
            <option value="SOL">SOL</option>
            <option value="ADA">ADA</option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>📊 Amount to Trade (%)</FormLabel>
          <Input
            type="number"
            value={amountPercent}
            onChange={(e) => setAmountPercent(parseInt(e.target.value))}
          />
        </FormControl>

        <FormControl display="flex" alignItems="center" gap={2}>
          <FormLabel mb="0">🎮 Paper Mode</FormLabel>
          <Switch
            isChecked={paperMode}
            onChange={(e) => setPaperMode(e.target.checked)}
          />
        </FormControl>

        <FormControl>
          <FormLabel>📈 Action</FormLabel>
          <Select value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </Select>
        </FormControl>

        <Button
          colorScheme="teal"
          onClick={handleSubmit}
          size="lg"
          mt={4}
        >
          🚀 Execute {action.toUpperCase()} Order
        </Button>
      </VStack>
    </Box>
  );
}
