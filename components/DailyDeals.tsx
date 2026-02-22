import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../constants/Config";

const { width } = Dimensions.get("window");

const DailyDeals = () => {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/daily-deals/list`);
      const data = await response.json();
      if (data.success && data.deals) {
        const activeDeals = data.deals
          .filter((d: any) => d.active)
          .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
        setDeals(activeDeals);
      }
    } catch (error) {
      console.error("DailyDeals fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null; // Skeleton
  if (deals.length === 0) return null;

  return (
    <SafeAreaView className="py-6 bg-[#FCF8F8] w-full">
      {/* Title Section */}
      <View className="flex-row items-center justify-center mb-6 px-4">
        {/* Left Line & Diamond */}
        <View className="flex-row items-center mr-3">
          <View className="w-8 h-[2px] bg-[#00C28A]" />
          <View className="w-3 h-3 bg-[#00C28A] transform rotate-45 ml-2" />
        </View>

        <Text className="text-[28px] font-black tracking-tight text-[#313B4D] mx-2">
          Daily Deals
        </Text>

        {/* Right Diamond & Line */}
        <View className="flex-row items-center ml-3">
          <View className="w-3 h-3 bg-[#00C28A] transform rotate-45 mr-2" />
          <View className="w-8 h-[2px] bg-[#00C28A]" />
        </View>
      </View>

      {/* Grid of Deals */}
      <View className="flex-row flex-wrap justify-center px-2">
        {(showAll ? deals : deals.slice(0, 6)).map((deal, index) => (
          <TouchableOpacity
            key={deal.id || index}
            className="w-[30%] sm:w-[31%] mx-[1.5%] mb-4 rounded-[16px] shadow-sm flex flex-col items-center bg-[#FCD8B0] pb-0"
            onPress={() => router.push(`/product/${deal.id}` as any)}
          >
            {/* Top Text / Title */}
            <View className="px-1 pt-3 pb-1 items-center h-[40px] justify-center w-full">
              <Text
                className="text-center font-black text-gray-900 leading-tight"
                style={{ fontSize: 13 }}
                numberOfLines={2}
              >
                {deal.title || "Holiday Treasure"}
              </Text>
            </View>

            {/* Center Hero Image */}
            <View className="w-full h-[80px] sm:h-[100px] items-center justify-center p-1 relative z-10">
              {deal.image_url ? (
                <Image
                  source={{ uri: deal.image_url }}
                  className="w-[90%] h-[90%]"
                  resizeMode="contain"
                />
              ) : null}
            </View>

            {/* Bottom Green Badge */}
            <View className="w-full bg-[#B3E140] rounded-b-[16px] py-1.5 mt-[-5px] items-center justify-center z-20 shadow-sm border-t-2 border-[#B3E140] rounded-t-lg">
              <Text
                className="text-black text-[10px] sm:text-xs font-black tracking-wider"
                numberOfLines={1}
              >
                {deal.discount || "UP TO 60% OFF"}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* View All Deals Button */}
      {deals.length > 6 && (
        <View className="w-full items-center mt-4 mb-2">
          <TouchableOpacity
            className="bg-[#FF5A00] flex-row items-center justify-center px-6 py-3 rounded-full shadow-md"
            onPress={() => setShowAll(!showAll)}
          >
            <Text className="text-white font-bold text-lg mr-2">
              {showAll ? "View Less" : "View All Deals"}
            </Text>
            <Ionicons
              name={showAll ? "chevron-up" : "chevron-down"}
              size={20}
              color="white"
            />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default DailyDeals;
