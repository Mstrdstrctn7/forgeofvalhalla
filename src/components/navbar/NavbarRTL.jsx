import React from "react";
import { Flex, Text } from "@chakra-ui/react";

export default function NavbarRTL() {
  return (
    <Flex justifyContent="space-between" px={4} py={2} bg="gray.700" color="white">
      <Text fontWeight="bold">RTL Panel</Text>
    </Flex>
  );
}
