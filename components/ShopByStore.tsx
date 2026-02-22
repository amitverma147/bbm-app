import { View, Text, Image, TouchableOpacity, Dimensions } from "react-native";
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../constants/Config";

interface ShopByStoreProps {
  sectionName?: string;
  sectionDescription?: string;
}

const ShopByStore = ({ sectionName, sectionDescription }: ShopByStoreProps) => {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      // Using the endpoint web likely uses, based on productService
      const response = await fetch(`${API_BASE_URL}/recommended-stores/active`);
      // If that endpoint doesn't exist, we might need another one.
      // Web uses `productService.getActiveRecommendedStores()`.

      // Let's assume standard REST endpoint, or verify.
      // If this fails, we handle error.
      if (!response.ok) throw new Error("Failed to fetch stores");

      const data = await response.json();

      let storeList = [];
      if (data.recommendedStores && Array.isArray(data.recommendedStores)) {
        storeList = data.recommendedStores;
      } else if (data.success && data.data) {
        storeList = data.data;
      } else if (Array.isArray(data)) {
        storeList = data;
      }

      setStores(storeList);
    } catch (error) {
      console.error("ShopByStore error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  if (stores.length === 0) return null;

  return (
    <View className="py-6 px-4">
      <View className="mb-4">
        <Text className="text-2xl font-black text-center text-orange-600 shadow-sm">
          {sectionName || "Shop by Store"}
        </Text>
        {sectionDescription && (
          <Text className="text-center text-gray-500 text-xs mt-1">
            {sectionDescription}
          </Text>
        )}
      </View>

      <View className="flex-row flex-wrap justify-between">
        {stores.map((store) => (
          <TouchableOpacity
            key={store.id}
            className="w-[23%] mb-4 items-center"
            onPress={() => router.push(`/shopbystore/${store.id}` as any)}
          >
            <View className="w-[77px] h-[77px] mb-2 items-center justify-center">
              {store.image_url ? (
                <Image
                  source={{ uri: store.image_url }}
                  className="w-full h-full"
                  resizeMode="contain"
                />
              ) : null}
            </View>
            <Text
              className="text-xs font-semibold text-center text-gray-800"
              numberOfLines={1}
            >
              {store.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default ShopByStore;
