import React, { useEffect, useState } from "react";
import { Dimensions, Image, Text, TouchableOpacity, View } from "react-native";
import { API_BASE_URL } from "../constants/Config";

const { width } = Dimensions.get("window");

interface DynamicMegaSaleProps {
  // If passed from parent
  products?: any[];
  sectionName?: string;
  sectionId?: string | number;
}

const DynamicMegaSale = ({
  products: initialProducts,
  sectionName,
  sectionId,
}: DynamicMegaSaleProps) => {
  const [banner, setBanner] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setBanner(initialProducts[0]);
      setLoading(false);
    } else if (sectionId) {
      fetchSectionContent();
    } else {
      setLoading(false); // No ID, no products, show fallback?
    }
  }, [initialProducts, sectionId]);

  const fetchSectionContent = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/product-sections/${sectionId}/content`,
      );
      const data = await response.json();
      if (
        data.success &&
        data.data &&
        data.data.products &&
        data.data.products.length > 0
      ) {
        // "products" in this context are banners for this section type
        setBanner(data.data.products[0]);
      }
    } catch (error) {
      console.error("DynamicMegaSale fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="h-[200px] bg-gray-200 animate-pulse rounded-2xl mx-4 my-3" />
    );
  }

  // Fallback if still no banner
  const displayBanner = banner || {
    name: sectionName || "MEGA SALE",
    description: "UP TO 70% OFF",
    image_url: undefined, // Gradient fallback
  };

  return (
    <View className="bg-white w-full">
      <View className="w-full h-[200px] bg-orange-500 relative">
        {/* Background Image */}
        {displayBanner.image_url ? (
          <Image
            source={{ uri: displayBanner.image_url }}
            className="absolute inset-0 w-full h-full opacity-75"
            resizeMode="cover"
          />
        ) : (
          <View className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500" />
        )}
        <View className="absolute inset-0 bg-black/20" />

        {/* Content */}
        <View className="flex-1 justify-center items-center p-4">
          <View className="bg-white/20 px-4 py-1.5 rounded-full mb-2 border border-white/30">
            <Text className="text-white text-xs font-bold uppercase">
              Limited Time Offer
            </Text>
          </View>

          <Text className="text-4xl font-extrabold text-white text-center mb-1 leading-tight tracking-tight">
            {displayBanner.name}
          </Text>

          {displayBanner.description ? (
            <Text className="text-white text-lg text-center font-semibold mb-3">
              {displayBanner.description}
            </Text>
          ) : null}

          <TouchableOpacity className="bg-white px-8 py-3 rounded-xl mt-3 active:scale-95 transition-transform shadow-md">
            <Text className="text-gray-900 font-bold uppercase tracking-wide">
              Shop Now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default DynamicMegaSale;
