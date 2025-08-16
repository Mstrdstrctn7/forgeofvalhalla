import { Flex, Text } from "@chakra-ui/react";

export default function NavbarAdmin() {
  return (
    <Flex
      as="header"
      justify="space-between"
      align="center"
      px={4}
      py={3}
      bg="gray.900"
      color="white"
      boxShadow="sm"
      position="sticky"
      top="0"
      zIndex="1000"
    >
      <Text fontSize="xl" fontWeight="bold">Forge of Valhalla</Text>
      <Text fontSize="sm" opacity={0.8}>Admin</Text>
    </Flex>
  );
}
