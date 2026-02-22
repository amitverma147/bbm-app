import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
const QuickCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch(
        "https://api.amitdev.tech/api/categories/section/price_zone/subcategories",
      );
      const data = await response.json();
      if (
        data &&
        data.success &&
        data.subcategories &&
        data.subcategories.length > 0
      ) {
        setCategories(data.subcategories);
      }
    } catch (error) {
      console.error("QuickCategories fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="h-24 justify-center">
        <ActivityIndicator color="#FD5B00" />
      </View>
    );
  }

  if (categories.length === 0) return null;

  return (
    <View className="bg-[#F9F4ED] py-3 mb-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {categories.map((item, index) => (
          <TouchableOpacity
            key={item.id || index}
            className="mr-4 items-center w-[76px]"
            onPress={() =>
              router.push({
                pathname: "/categories",
                params: { categoryId: item.id },
              })
            }
          >
            <View className="w-[69px] h-[69px] rounded-lg items-center justify-center overflow-hidden mb-1">
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <View className="items-center justify-center h-full w-full bg-gray-100">
                  <Text className="text-xl">📦</Text>
                </View>
              )}
            </View>
            <Text
              className="text-[10px] font-bold text-center text-gray-800 leading-3"
              numberOfLines={2}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default QuickCategories;
