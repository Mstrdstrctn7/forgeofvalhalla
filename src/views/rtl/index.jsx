import React from "react";
import { Box, Text } from "@chakra-ui/react";

export default function RTLPage() {
  return (
    <Box p="6" textAlign="right" dir="rtl">
      <Text fontSize="2xl" fontWeight="bold">
        דוגמה לעמוד RTL
      </Text>
      <Text mt="2">
        This is a placeholder page for Right-To-Left (RTL) layout support.
      </Text>
    </Box>
  );
}
