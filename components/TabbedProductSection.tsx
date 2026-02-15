import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { API_BASE_URL } from "../constants/Config";
import ProductCard from "./ProductCard";

interface TabbedProductSectionProps {
  sectionId: string;
  sectionName: string;
}

const TabbedProductSection = ({
  sectionId,
  sectionName,
}: TabbedProductSectionProps) => {
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    fetchSubcategories();
  }, []);

  useEffect(() => {
    if (activeTab) {
      fetchProducts(activeTab);
    }
  }, [activeTab]);

  const fetchSubcategories = async () => {
    try {
      // Hardcoded for 'mega_monsoon' as per web code logic, or we can make it dynamic based on section
      const response = await fetch(
        `${API_BASE_URL}/categories/section/mega_monsoon/categories`,
      );
      const data = await response.json();

      if (data.success && data.categories) {
        // Flatten subcategories
        const allSub = data.categories.reduce((acc: any[], cat: any) => {
          return [...acc, ...(cat.subcategories || [])];
        }, []);

        // Sort by display_order
        allSub.sort(
          (a: any, b: any) => (a.display_order || 0) - (b.display_order || 0),
        );

        setSubcategories(allSub);
        if (allSub.length > 0) {
          setActiveTab(allSub[0].id);
        }
      }
    } catch (error) {
      console.error("TabbedSection subcats error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (subcatId: string) => {
    setProductsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/productsroute/subcategory/${subcatId}`,
      );
      const data = await response.json();
      if (data.success && data.products) {
        setProducts(data.products);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("TabbedSection products error:", error);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  if (loading) return null;
  if (subcategories.length === 0) return null;

  return (
    <View className="mb-2 bg-white py-2 w-full">
      <View className="px-4 mb-3 flex-row justify-between items-center bg-[#f8f3ee] p-3 w-full">
        <Text className="text-lg font-bold text-gray-900">
          {sectionName || "Mega Monsoon Sale"}
        </Text>
        <TouchableOpacity>
          <Text className="text-orange-600 font-bold text-xs">See All</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs - Web Style */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-2 mb-4 w-full"
      >
        {subcategories.map((sub) => {
          const isActive = activeTab === sub.id;
          return (
            <TouchableOpacity
              key={sub.id}
              onPress={() => setActiveTab(sub.id)}
              className={`mr-2 items-center justify-center p-2 w-[75px] h-[95px] ${isActive ? "bg-[#f8f3ee] border-b-4 border-green-500" : "bg-[#f8f3ee]/60"}`}
            >
              <View
                className={`w-10 h-10 rounded-full items-center justify-center mb-1 overflow-hidden ${isActive ? "bg-green-100" : "bg-gray-100"}`}
              >
                {sub.image_url ? (
                  <Image
                    source={{ uri: sub.image_url }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                ) : (
                  <Text className="text-xl">📦</Text>
                )}
              </View>
              <Text
                className={`text-[10px] text-center font-medium leading-3 ${isActive ? "text-gray-900" : "text-gray-500"}`}
                numberOfLines={2}
              >
                {sub.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Products */}
      {productsLoading ? (
        <View className="h-40 justify-center">
          <ActivityIndicator color="#FD5B00" />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {products.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
          {products.length === 0 && (
            <Text className="text-gray-500 mx-4">No products found</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default TabbedProductSection;
