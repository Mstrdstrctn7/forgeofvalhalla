// src/views/admin/KnightRiderPanel.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Badge,
  useColorModeValue,
  Spinner,
} from "@chakra-ui/react";
import { supabase } from "../../supabaseClient";

export default function KnightRiderPanel() {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [log, setLog] = useState([]);

  const fetchBalance = async () => {
    const { data, error } = await supabase
      .from("balances")
      .select("*")
      .eq("mode", "paper")
      .single();

    if (error) {
      console.error("Error fetching balance:", error);
    } else {
      setBalance(data?.amount);
    }
    setLoading(false);
  };

  const runKnightRider = async () => {
    setIsRunning(true);
    setLog((prev) => [...prev, "⚙️ Starting KnightRider..."]);

    try {
      const response = await fetch("/api/knightRiderLoop.js");
      const result = await response.json();
      setLog((prev) => [...prev, "✅ KnightRider completed run."]);
    } catch (err) {
      setLog((prev) => [...prev, "❌ Error during KnightRider run."]);
      console.error(err);
    }

    await fetchBalance();
    setIsRunning(false);
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  return (
    <Box p={6} bg={useColorModeValue("white", "gray.800")} borderRadius="lg">
      <Text fontSize="2xl" fontWeight="bold" mb={4}>
        🤖 KnightRider Control Panel
      </Text>

      {loading ? (
        <Spinner />
      ) : (
        <VStack align="start" spacing={4}>
          <HStack>
            <Text fontWeight="bold">Paper Balance:</Text>
            <Badge colorScheme="green">${balance?.toFixed(2)}</Badge>
          </HStack>

          <Button
            colorScheme="teal"
            onClick={runKnightRider}
            isLoading={isRunning}
          >
            Run KnightRider Paper Loop
          </Button>

          <Box w="100%">
            <Text fontSize="md" mt={4} fontWeight="semibold">
              📜 Log:
            </Text>
            <Box
              mt={2}
              p={3}
              border="1px"
              borderColor="gray.200"
              borderRadius="md"
              maxH="200px"
              overflowY="auto"
              bg={useColorModeValue("gray.50", "gray.700")}
            >
              {log.map((entry, index) => (
                <Text key={index} fontSize="sm">
                  {entry}
                </Text>
              ))}
            </Box>
          </Box>
        </VStack>
      )}
    </Box>
  );
}
