import { VStack, Box, Text } from "@chakra-ui/react";
import { Link, useLocation } from "react-router-dom";

const NavItem = ({ to, children }) => {
  const { pathname } = useLocation();
  const active = pathname.startsWith(to);
  return (
    <Link to={to}>
      <Box
        w="full"
        px={3}
        py={2}
        borderRadius="md"
        bg={active ? "gray.700" : "transparent"}
        _hover={{ bg: "gray.700" }}
        transition="background 0.15s ease"
      >
        <Text color="white">{children}</Text>
      </Box>
    </Link>
  );
};

export default function Sidebar() {
  return (
    <Box
      as="nav"
      w="64"
      bg="gray.800"
      color="white"
      minH="100vh"
      p={4}
      position="sticky"
      top="0"
    >
      <VStack align="stretch" spacing={1}>
        <NavItem to="/admin/dashboard">Dashboard</NavItem>
        <NavItem to="/admin/trading">Trading</NavItem>
        <NavItem to="/admin/settings">Settings</NavItem>
      </VStack>
    </Box>
  );
}
