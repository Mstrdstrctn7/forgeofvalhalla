import React from "react";
import { Box, Text, Flex, Button } from "@chakra-ui/react";

export default function Dashboard() {
  const today = new Date().toLocaleDateString();

  return (
    <Flex direction="column" p="20px" align="center" justify="center" minH="80vh">
      <Text fontSize="4xl" fontWeight="bold" mb={2}>🛡️ Forge of Valhalla</Text>
      <Text fontSize="md" color="gray.400" mb={4}>Today is {today}</Text>

      <Box p={6} borderRadius="lg" bg="gray.50" shadow="md" textAlign="center" mb={6} w="100%" maxW="300px">
        <Text fontSize="2xl" fontWeight="semibold">Balance</Text>
        <Text fontSize="xl" color="green.500">$5.00 (paper)</Text>
      </Box>

      <Button colorScheme="teal" size="lg" onClick={() => window.location.href = "/trade"}>
        Enter KnightRider Mode
      </Button>
    </Flex>
  );
}
