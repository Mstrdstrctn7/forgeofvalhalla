import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Layout components
import AdminNavbar from "components/navbar/NavbarAdmin.jsx";
import Sidebar from "components/sidebar/Sidebar.jsx";
import Footer from "components/footer/FooterAdmin.jsx";
import FixedPlugin from "components/fixedPlugin/FixedPlugin";

// Pages
import Dashboard from "views/admin/default";
import Profile from "views/admin/profile";
import DataTables from "views/admin/dataTables";
import NFTMarketplace from "views/admin/nftMarketplace";
import Settings from "views/admin/settings";

import ChakraExample from "views/admin/chakra";
import RTLPage from "views/rtl";

// Assets
import routes from "../../../routes.js";
import { Box, Flex } from "@chakra-ui/react";

export default function AdminLayout() {
  const [toggleSidebar, setToggleSidebar] = React.useState(false);

  return (
    <Flex direction="row">
      <Sidebar routes={routes} display="none" toggleSidebar={toggleSidebar} />
      <Box flex="1" maxW={{ base: "100%", xl: "calc(100% - 290px)" }} position="relative">
        <Box>
          <AdminNavbar onOpen={() => setToggleSidebar(true)} brandText="Forge of Valhalla" />
          <Box pt="80px" px="20px">
            <Routes>
              <Route path="/default" element={<Dashboard />} />
              <Route path="/nft-marketplace" element={<NFTMarketplace />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/data-tables" element={<DataTables />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/rtl" element={<RTLPage />} />
              <Route path="/chakra-ui" element={<ChakraExample />} />
              <Route path="*" element={<Navigate to="/admin/default" replace />} />
            </Routes>
          </Box>
          <Box>
            <Footer />
          </Box>
        </Box>
      </Box>
      <FixedPlugin />
    </Flex>
  );
}
