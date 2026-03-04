import React from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import DynamicHome from "../../components/DynamicHome";
import Header from "../../components/Header";
import QuickCategories from "../../components/QuickCategories";

const Home = () => {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return (
    <View className="flex-1 bg-white">
      <View style={{ zIndex: 100, elevation: 100 }}>
        <Header scrollY={scrollY} />
      </View>
      <View style={{ flex: 1, zIndex: 1 }}>
        <DynamicHome
          ListHeaderComponent={<QuickCategories />}
          onScroll={scrollHandler}
        />
      </View>
      <View className="absolute bottom-0 left-0 right-0 h-20 bg-transparent pointer-events-none" />
    </View>
  );
};

export default Home;
