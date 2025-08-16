import { Box, Text } from "@chakra-ui/react";

export default function FooterAdmin() {
  return (
    <Box as="footer" py={6} px={4} textAlign="center" color="gray.500">
      <Text fontSize="sm">
        © {new Date().getFullYear()} Forge of Valhalla. All rights reserved.
      </Text>
    </Box>
  );
}
