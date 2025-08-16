import React from "react";
import { Flex, Text } from "@chakra-ui/react";

export default function Settings() {
  return (
    <Flex direction="column" p="20px" align="center" justify="center">
      <Text fontSize="3xl" fontWeight="bold">⚙️ Settings</Text>
      <Text fontSize="lg" color="gray.500">Adjust your preferences</Text>
    </Flex>
  );
}
