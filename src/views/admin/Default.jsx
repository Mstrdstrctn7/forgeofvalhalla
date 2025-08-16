import React from "react";
import { Button, Flex, Heading, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const Default = () => {
  const navigate = useNavigate();

  return (
    <Flex direction="column" align="center" justify="center" height="100vh" gap="4">
      <Heading size="xl">Welcome to Forge of Valhalla</Heading>
      <Text fontSize="lg">Choose your path, warrior.</Text>
      <Button colorScheme="teal" size="lg" onClick={() => navigate("/admin/knightrider")}>
        Enter KnightRider
      </Button>
    </Flex>
  );
};

export default Default;
