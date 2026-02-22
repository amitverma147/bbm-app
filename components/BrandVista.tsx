import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { API_BASE_URL } from "../constants/Config";

interface Brand {
  id: number;
  name: string;
  image: string;
}

const BrandVista = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/brands/list`);
      const data = await response.json();
      if (data.success && data.brands) {
        const mappedBrands = data.brands.map((brand: any) => ({
          id: brand.id,
          name: brand.name,
          image: brand.image_url || null, // Fallback handled in render
        }));
        setBrands(mappedBrands);
      }
    } catch (error) {
      console.error("BrandVista error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null; // Or skeleton
  if (brands.length === 0) return null;

  return (
    <View className="py-6 bg-white w-full">
      <View className="px-4 mb-4">
        <Text className="text-2xl font-black text-gray-900">Top Brands</Text>
        <Text className="text-gray-500 text-sm">
          Discover products from these top brands
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {brands.map((brand) => (
          <TouchableOpacity
            key={brand.id}
            onPress={() => router.push(`/brands/${brand.id}` as any)} // Assuming brand page exists or generic product list
            className="mr-3 w-[138px] h-[165px] rounded-[1rem] items-center justify-center overflow-hidden"
          >
            {brand.image ? (
              <Image
                source={{ uri: brand.image }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <Text className="font-bold text-gray-400 text-center">
                {brand.name}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default BrandVista;
