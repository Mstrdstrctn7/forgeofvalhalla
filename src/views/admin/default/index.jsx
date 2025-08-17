// src/views/admin/default/index.jsx
import React from "react";
import { Box, Heading } from "@chakra-ui/react";
import { TickerBoardWithProviderToggle as TickerBoard } from "components/markets/TickerBoard.jsx";

export default function Dashboard() {
  return (
    <Box>
      <Heading size="md" mb={4}>Live Market</Heading>
      <TickerBoard />
    </Box>
  );
}
