import React from "react";
import { Button } from "@chakra-ui/react";

export default function FixedPlugin(props) {
  const { onOpen, ...rest } = props;

  return (
    <Button
      {...rest}
      h="60px"
      w="60px"
      position="fixed"
      bottom="30px"
      right="30px"
      zIndex="99"
      onClick={onOpen}
    >
      ⚙️
    </Button>
  );
}
