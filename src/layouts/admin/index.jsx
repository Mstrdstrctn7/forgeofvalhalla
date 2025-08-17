// src/layouts/admin/index.jsx
import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import { Box, Flex, Heading } from "@chakra-ui/react";
import Dashboard from "views/admin/default/index.jsx";
import TradePage from "views/admin/trade/index.jsx";
import LogsPage from "views/admin/logs/index.jsx";

function Shell({ children }) {
  return (
    <Box>
      <Flex as="header" px={6} py={4} borderBottomWidth="1px" align="center" justify="space-between">
        <Heading size="md">Forge of Valhalla</Heading>
        <Flex gap={4}>
          <Link to="/admin">Admin</Link>
          <Link to="/admin/trade">Trade</Link>
          <Link to="/admin/logs">Logs</Link>
        </Flex>
      </Flex>
      <Box p={4}>{children}</Box>
    </Box>
  );
}

export default function AdminLayout() {
  return (
    <Routes>
      <Route path="/" element={<Shell><Dashboard /></Shell>} />
      <Route path="/trade" element={<Shell><TradePage /></Shell>} />
      <Route path="/logs" element={<Shell><LogsPage /></Shell>} />
      <Route path="*" element={<Shell><div>Not Found</div></Shell>} />
    </Routes>
  );
}
