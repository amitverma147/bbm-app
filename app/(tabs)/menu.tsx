import React from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MenuScreen = () => {
  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 justify-center items-center bg-white"
    >
      <Text className="text-xl font-bold text-gray-800">Menu</Text>
      <Text className="text-gray-500 mt-2">Account settings and more.</Text>
    </SafeAreaView>
  );
};

export default MenuScreen;
