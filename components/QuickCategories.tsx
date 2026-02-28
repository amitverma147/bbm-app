import {
  View,
  Text,
  Image,
  ActivityIndicator,
  FlatList,
  Pressable,
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

      console.log("QuickCategories Debug:", {
        success: data?.success,
        count: data?.subcategories?.length
      });

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
      <View className="h-[100px] justify-center w-full bg-white mt-2">
        <ActivityIndicator color="#FD5B00" />
      </View>
    );
  }

  if (!categories || categories.length === 0) return null;

  const renderItem = ({ item }: { item: any }) => (
    <Pressable
      className="mr-4 items-center w-[74px]"
      onPress={() => router.push(`/category/${item.id}` as any)}
    >
      <View className="w-[70px] h-[70px] rounded-full bg-gray-50 border border-gray-100 shadow-sm items-center justify-center overflow-hidden mb-2">
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
    </Pressable>
  );

  return (
    <View
      className="bg-white py-2 mb-2"
      style={{ height: 130 }}
      onStartShouldSetResponder={() => true}
    >
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={true} // Temporarily enable to see scroll position
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        nestedScrollEnabled={true}
        scrollEnabled={true}
        onTouchStart={() => console.log("QuickCategories: Touch Started")}
        onTouchEnd={() => console.log("QuickCategories: Touch Ended")}
      />
    </View>
  );
};

export default QuickCategories;
