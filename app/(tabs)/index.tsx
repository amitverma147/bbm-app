import React from "react";
import { View } from "react-native";
import DynamicHome from "../../components/DynamicHome";
import Header from "../../components/Header";
import QuickCategories from "../../components/QuickCategories";

const Home = () => {
  return (
    <View className="flex-1 bg-white">
      <View style={{ zIndex: 100, elevation: 100 }}>
        <Header />
      </View>
      <View style={{ flex: 1, zIndex: 1 }}>
        <DynamicHome ListHeaderComponent={<QuickCategories />} />
      </View>
      <View className="absolute bottom-0 left-0 right-0 h-20 bg-transparent pointer-events-none" />
    </View>
  );
};

export default Home;
