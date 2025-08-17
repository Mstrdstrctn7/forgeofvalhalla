import React from "react";
import { Box, Heading } from "@chakra-ui/react";
import TickerBoard from "components/markets/TickerBoard.jsx";

export default function Dashboard() {
  return (
    <Box>
      <Heading size="md" mb={4}>Live Market</Heading>
      <TickerBoard />
    </Box>
  );
}
