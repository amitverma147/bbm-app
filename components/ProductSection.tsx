import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import React from "react";
import ProductCard from "./ProductCard";
import { useCart } from "../contexts/CartContext";

interface ProductSectionProps {
  title: string;
  data: any[];
  gridLayout?: boolean;
}

const ProductSection = ({ title, data, gridLayout }: ProductSectionProps) => {
  const { addToCart } = useCart();

  if (!data || data.length === 0) return null;

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between px-4 mb-3">
        <Text className="text-lg font-bold text-gray-900">{title}</Text>

      </View>

      {gridLayout ? (
        <View className="px-4 flex-row flex-wrap justify-between">
          {Array.isArray(data) &&
            data.slice(0, 8).map((item) => (
              <View key={item.id} className="w-[31%] mb-4">
                <ProductCard item={item} onAdd={addToCart} gridStyle={true} />
              </View>
            ))}

          {/* 9th "See All" Box */}
          {data.length > 8 && (
            <TouchableOpacity
              className="w-[31%] mb-4 rounded-xl bg-[#FE3A30] items-center justify-center p-4 shadow-sm"
              style={{ minHeight: 230 }}
            >
              <Text className="text-white font-bold text-base mb-4 text-center">
                See All
              </Text>
              <View className="w-10 h-10 rounded-full bg-white items-center justify-center">
                <Text className="text-[#FE3A30] font-black text-xl ml-0.5">
                  {">"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 16, paddingRight: 16 }}
        >
          {Array.isArray(data) &&
            data.map((item) => (
              <ProductCard key={item.id} item={item} onAdd={addToCart} />
            ))}
        </ScrollView>
      )}
    </View>
  );
};

export default React.memo(ProductSection);
