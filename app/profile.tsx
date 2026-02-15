import React from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Profile = () => {
  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 justify-center items-center bg-white"
    >
      <Text className="text-lg font-bold">Profile Page</Text>
      <Text className="text-gray-500">Coming Soon</Text>
    </SafeAreaView>
  );
};

export default Profile;
