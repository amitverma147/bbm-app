import React from "react";
import {
    Dimensions,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

interface Banner {
  id: string;
  color: string;
  title: string;
  subtitle: string;
}

const BannerCarousel = ({ banners }: { banners: Banner[] }) => {
  if (!banners || banners.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      pagingEnabled
      className="mb-4"
    >
      {banners.map((banner) => (
        <View
          key={banner.id}
          style={{ backgroundColor: banner.color, width: width }}
          className="h-48 p-5 justify-between"
        >
          <View>
            <Text className="text-3xl font-bold text-gray-800">
              {banner.title}
            </Text>
            <Text className="text-lg text-gray-700 mt-2">
              {banner.subtitle}
            </Text>
          </View>
          <TouchableOpacity className="bg-black/90 self-start px-6 py-3 rounded-full shadow-lg">
            <Text className="text-white font-bold text-xs uppercase tracking-wide">
              Shop Now
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
};

export default BannerCarousel;
