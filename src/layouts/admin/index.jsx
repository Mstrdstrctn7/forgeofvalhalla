import React from "react";
import {
  Box,
  Flex,
  Text,
  useColorModeValue,
  useBreakpointValue,
} from "@chakra-ui/react";
import { Routes, Route, Outlet, Link } from "react-router-dom";
import Dashboard from "../../views/admin/Dashboard.jsx";
import Trade from "../../views/admin/Trade.jsx";
import Logs from "../../views/admin/Logs.jsx";
import Settings from "../../views/admin/Settings.jsx";

export default function AdminLayout() {
  const layoutDirection = useBreakpointValue({ base: "column", md: "row" });
  const sidebarWidth = useBreakpointValue({ base: "100%", md: "250px" });

  return (
    <Flex
      direction={layoutDirection}
      height="100vh"
      bg={useColorModeValue("gray.50", "gray.900")}
      overflow="hidden"
    >
      {/* Sidebar */}
      <Box
        width={sidebarWidth}
        bg={useColorModeValue("white", "gray.800")}
        borderBottom={{ base: "1px solid", md: "none" }}
        borderRight={{ md: "1px solid" }}
        borderColor={useColorModeValue("gray.200", "gray.700")}
        p={6}
      >
        <Text fontSize="2xl" fontWeight="bold" mb={6}>
          🛠 Forge Admin
        </Text>
        <Flex direction="column" gap={4}>
          <Link to="/admin/dashboard">📈 Dashboard</Link>
          <Link to="/admin/trade">💸 Trade</Link>
          <Link to="/admin/logs">📜 Logs</Link>
          <Link to="/admin/settings">⚙️ Settings</Link>
        </Flex>
      </Box>

      {/* Main Content */}
      <Box flex="1" p={4} overflowY="auto">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/trade" element={<Trade />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Text>404 - Not Found</Text>} />
        </Routes>
        <Outlet />
      </Box>
    </Flex>
  );
}
