import React from "react";
import { View, Text, SafeAreaView } from "react-native";

export default function MenuScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center">
        <Text className="text-xl font-bold text-gray-800">Menu Screen</Text>
        <Text className="text-gray-500 mt-2">Coming soon...</Text>
      </View>
    </SafeAreaView>
  );
}
