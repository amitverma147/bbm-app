import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Dimensions, Image, Text, TouchableOpacity, View } from "react-native";
import Carousel from "react-native-reanimated-carousel";
import { API_BASE_URL } from "../constants/Config";

const { width } = Dimensions.get("window");

interface Banner {
  id: number;
  name: string;
  image_url?: string;
  bgColor?: string;
  link?: string;
  description?: string;
  position?: string;
}

const HeroSection = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);

      // 1. Try fetching hero banners specifically
      let response = await fetch(`${API_BASE_URL}/banner/type/hero`);
      let data = await response.json();

      // 2. Fallback to all
      if (!data.success || !data.banners || data.banners.length === 0) {
        response = await fetch(`${API_BASE_URL}/banner/all`);
        data = await response.json();
      }

      if (data.success && data.banners && data.banners.length > 0) {
        const mapped = data.banners.map((b: any) => ({
          id: b.id,
          name: b.name || b.title,
          image_url: b.image_url,
          link: b.link || "/products",
          description: b.description,
          bgColor: b.bgColor,
        }));
        setBanners(mapped);
      } else {
        setBanners([]);
      }
    } catch (error) {
      console.warn("HeroSection fetch error:", error);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = (banner: Banner) => {
    if (banner.link) {
      // Basic routing based on link string
      // e.g. /products -> /products
      // /category/123 -> /category?id=123
      // For now just push to relative path if it matches app routes, or generic.
      router.push(banner.link as any);
    }
  };

  const getGradientColors = (bgColorClass?: string) => {
    // Simple mapping from Tailwind classes to hex codes if possible, or use defaults
    // Web: "from-purple-600 to-blue-600"
    if (!bgColorClass) return ["#FD5B00", "#FF8C00"]; // Default Orange

    if (bgColorClass.includes("purple") && bgColorClass.includes("blue"))
      return ["#9333ea", "#2563eb"];
    if (bgColorClass.includes("green") && bgColorClass.includes("teal"))
      return ["#16a34a", "#0d9488"];
    if (bgColorClass.includes("orange") && bgColorClass.includes("red"))
      return ["#ea580c", "#dc2626"];

    return ["#FD5B00", "#FF8C00"];
  };

  if (loading && banners.length === 0) {
    // Render skeleton
    return <View className="h-48 bg-gray-200 animate-pulse rounded-xl m-4" />;
  }

  if (banners.length === 0) return null;

  return (
    <View className="mb-0 w-full p-0 m-0" style={{ height: width * 0.5 }}>
      <Carousel
        style={{ width: width }}
        loop
        width={width}
        height={width * 0.5}
        autoPlay={banners.length > 1}
        data={banners}
        scrollAnimationDuration={1000}
        autoPlayInterval={5000}
        panGestureHandlerProps={{
          activeOffsetX: [-10, 10],
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => handlePress(item)}
            style={{ width: "100%", height: "100%", padding: 0, margin: 0 }}
          >
            <View style={{ width: "100%", height: "100%", padding: 0, margin: 0 }}>
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="stretch"
                />
              ) : (
                <LinearGradient
                  colors={getGradientColors(item.bgColor) as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                >
                  <Text className="text-white text-3xl font-bold text-center px-4">
                    {item.name}
                  </Text>
                  {item.description ? (
                    <Text className="text-white text-sm font-medium mt-2 text-center px-8">
                      {item.description}
                    </Text>
                  ) : null}
                </LinearGradient>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default HeroSection;
