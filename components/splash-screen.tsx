import { View, Text } from 'react-native';
import React from 'react';

export default function SplashScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-[#FF6B35]">
      <View className="items-center">
        <View className="flex-row items-center mb-4">
          <Text className="text-5xl font-plus-jakarta font-bold text-white">Big</Text>
          <Text className="text-5xl font-plus-jakarta font-bold text-black">Best</Text>
          <Text className="text-5xl font-plus-jakarta font-bold text-white">Mart</Text>
        </View>
        <View className="h-1 w-48 bg-[#2E86AB] mb-4" />
        <Text className="text-xl font-plus-jakarta text-white tracking-wider">
          Shop Sell Earn
        </Text>
      </View>
    </View>
  );
}
