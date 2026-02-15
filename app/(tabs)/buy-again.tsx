import React from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BuyAgainScreen = () => {
  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 justify-center items-center bg-white"
    >
      <Text className="text-xl font-bold text-gray-800">Buy Again</Text>
      <Text className="text-gray-500 mt-2">
        Your purchase history will appear here.
      </Text>
    </SafeAreaView>
  );
};

export default BuyAgainScreen;
