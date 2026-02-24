import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Image,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  getCategoriesHierarchy,
  getMappedCategoryForSection,
} from "../services/categoryService";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE_URL } from "../constants/Config";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

interface DualCategorySectionProps {
  sectionLeftKey: string;
  sectionRightKey: string;
}

const DualCategorySection = ({
  sectionLeftKey,
  sectionRightKey,
}: DualCategorySectionProps) => {
  const [leftCategory, setLeftCategory] = useState<any>(null);
  const [rightCategory, setRightCategory] = useState<any>(null);
  const [leftSubcategories, setLeftSubcategories] = useState<any[]>([]);
  const [rightSubcategories, setRightSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leftMappingRes, rightMappingRes] = await Promise.all([
        getMappedCategoryForSection(sectionLeftKey),
        getMappedCategoryForSection(sectionRightKey),
      ]);

      const leftId = leftMappingRes?.id;
      const rightId = rightMappingRes?.id;

      if (!leftId && !rightId) {
        setLoading(false);
        return;
      }

      const response = await getCategoriesHierarchy();

      if (response.success && response.categories) {
        if (leftId) {
          const leftCat = response.categories.find((c: any) => c.id == leftId);
          if (leftCat) {
            setLeftCategory(leftCat);
            setLeftSubcategories(leftCat.subcategories || []);
          }
        }

        if (rightId) {
          const rightCat = response.categories.find(
            (c: any) => c.id == rightId,
          );
          if (rightCat) {
            setRightCategory(rightCat);
            setRightSubcategories(rightCat.subcategories || []);
          }
        }
      }
    } catch (error) {
      console.error("DualCategory fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <View className="px-4 mb-4">
        <View
          style={{ width: width - 32, height: 260 }}
          className="bg-gray-200 rounded-3xl animate-pulse mb-4"
        />
        <View
          style={{ width: width - 32, height: 260 }}
          className="bg-gray-200 rounded-3xl animate-pulse"
        />
      </View>
    );

  if (!leftCategory && !rightCategory) return null;

  const renderCard = (
    category: any,
    subcategories: any[],
    title: string,
    subtitle: string,
    colors: readonly [string, string],
    themeColor: string,
  ) => {
    if (!category) return null;

    return (
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: width }}
        className="p-5 h-[300px] justify-center relative mb-4 shadow-sm"
      >
        {/* Header */}
        <View className="mb-4 pr-10">
          <View className="bg-white/20 self-start px-3 py-1.5 rounded-full mb-3 flex-row items-center border border-white/30 shadow-sm">
            <Text className="text-[11px] font-black text-white uppercase tracking-wider mr-1">
              {category.name}
            </Text>
            <MaterialCommunityIcons name="lightning-bolt" size={14} color="#fef08a" />
          </View>
          <Text className="text-[28px] font-black text-white leading-tight mb-1 drop-shadow-md">
            {title}
          </Text>
          <Text className="text-sm font-bold text-white/90 tracking-wide drop-shadow-md">
            {subtitle}
          </Text>
        </View>

        {/* Subcategories Horizontal List */}
        {subcategories.length > 0 ? (
          <FlatList
            data={subcategories}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 0 }}
            renderItem={({ item }) => {
              const imageUrl = item.image_url || item.image || item.icon;
              const baseUrl = API_BASE_URL.replace("/api", "");
              const fullImageUrl = imageUrl
                ? imageUrl.startsWith("http")
                  ? imageUrl
                  : `${baseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`
                : "https://via.placeholder.com/80";

              return (
                <TouchableOpacity
                  onPress={() => router.push({ pathname: `/category/${item.id}` as any, params: { name: item.name } })}
                  className="mr-3 items-center bg-white/95 rounded-2xl p-3 w-[120px] justify-between shadow-md"
                  style={{ height: 145 }}
                >
                  <Image
                    source={{ uri: fullImageUrl }}
                    className="w-[70px] h-[70px] rounded-xl mb-2"
                    resizeMode="contain"
                  />
                  <Text
                    numberOfLines={2}
                    className="text-[11px] text-center font-black text-gray-800 leading-[13px] mb-1 px-1"
                  >
                    {item.name}
                  </Text>
                  <View className="bg-green-100 px-1.5 py-0.5 rounded border border-green-200">
                    <Text className="text-[9px] text-green-700 font-bold tracking-tight">
                      UP TO 60% OFF
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        ) : (
          <View className="flex-1 justify-center items-center bg-white/10 rounded-2xl border border-white/20">
            <Text className="text-sm font-bold text-white/80">No deals available</Text>
          </View>
        )}
      </LinearGradient>
    );
  };

  return (
    <View className="mb-2 mt-4 bg-white w-full">
      {renderCard(
        leftCategory,
        leftSubcategories,
        "Daily Fresh",
        "UP TO 60% OFF",
        ["#10b981", "#047857"], // Vibrant Greens
        "#10b981",
      )}
      {renderCard(
        rightCategory,
        rightSubcategories,
        "Trending Now",
        "UP TO 90% OFF",
        ["#f59e0b", "#d97706"], // Vibrant Oranges
        "#f59e0b",
      )}
    </View>
  );
};

export default DualCategorySection;
