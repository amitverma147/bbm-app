import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
} from "react-native";
import React, { useEffect, useState } from "react";
import { router } from "expo-router";
const QuickCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  // if (loading) {
  //   return (
  //     <View className="h-[90px] justify-center w-full bg-white mt-4 border-t border-b border-gray-100">
  //       <ActivityIndicator color="#FD5B00" />
  //     </View>
  //   );
  // }

  if (!categories || categories.length === 0) return null;

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      className="mr-4 items-center w-[74px]"
      onPress={() => router.push(`/category/${item.id}` as any)}
    >
      <View className="w-[70px] h-[70px] rounded-full bg-gray-50 border border-gray-100 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] items-center justify-center overflow-hidden mb-2">
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="contain"
          />
        ) : (
          <View className="items-center justify-center h-full w-full bg-gray-50">
            <Text className="text-2xl">📦</Text>
          </View>
        )}
      </View>
      <Text
        className="text-[11px] font-black text-center text-gray-800 leading-[14px]"
        numberOfLines={2}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="bg-white pt-4 pb-5 mb-2 mt-2 shadow-sm">
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={renderItem}
      />
    </View>
  );
};

export default QuickCategories;
