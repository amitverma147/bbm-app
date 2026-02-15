import { View, Text, Image, TouchableOpacity, Dimensions } from 'react-native'
import React, { useEffect, useState } from 'react'
import Carousel from 'react-native-reanimated-carousel';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../constants/Config';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

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

    const defaultSlides: Banner[] = [
        {
            id: 1,
            name: "SPECIAL OFFER",
            image_url: undefined, // Simulating gradient fallback
            bgColor: "['#9333ea', '#2563eb']", // approximate purple-600 to blue-600
            link: "/products",
        },
        {
            id: 2,
            name: "FREE DELIVERY",
            image_url: undefined,
            bgColor: "['#16a34a', '#0d9488']", // green-600 to teal-600
            link: "/products",
        },
        {
            id: 3,
            name: "BEST DEALS",
            image_url: undefined,
            bgColor: "['#ea580c', '#dc2626']", // orange-600 to red-600
            link: "/products",
        },
    ];

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
                // Filter or Map if needed. Web logic takes all returned.
                // Web maps them.
                const mapped = data.banners.map((b: any) => ({
                    id: b.id,
                    name: b.name || b.title,
                    image_url: b.image_url,
                    link: b.link || "/products",
                    description: b.description,
                    bgColor: b.bgColor, // Web uses tailwind classes "from-x to-y"
                }));
                // If we have mixed types and only want hero? Web fetches by type 'hero' first.
                // If fallback to all, it might include others. But let's assume it's fine.
                setBanners(mapped);
            } else {
                setBanners(defaultSlides);
            }

        } catch (error) {
            console.warn("HeroSection fetch error:", error);
            setBanners(defaultSlides);
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
        if (!bgColorClass) return ['#FD5B00', '#FF8C00']; // Default Orange

        if (bgColorClass.includes('purple') && bgColorClass.includes('blue')) return ['#9333ea', '#2563eb'];
        if (bgColorClass.includes('green') && bgColorClass.includes('teal')) return ['#16a34a', '#0d9488'];
        if (bgColorClass.includes('orange') && bgColorClass.includes('red')) return ['#ea580c', '#dc2626'];

        return ['#FD5B00', '#FF8C00'];
    };

    if (loading && banners.length === 0) {
        // Render skeleton or loader?
        return <View className="h-48 bg-gray-200 animate-pulse rounded-xl m-4" />;
    }

    const dataToRender = banners.length > 0 ? banners : defaultSlides;

    return (
        <View className="mb-4" style={{ height: width * 0.55 }}>
            <Carousel
                loop
                width={width}
                height={width * 0.55} // roughly 16:9 or similar aspect
                autoPlay={dataToRender.length > 1}
                data={dataToRender}
                scrollAnimationDuration={1000}
                autoPlayInterval={5000}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => handlePress(item)}
                        className="w-full h-full px-4"
                    >
                        <View className="w-full h-full rounded-2xl overflow-hidden shadow-sm">
                            {item.image_url ? (
                                <Image
                                    source={{ uri: item.image_url }}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                            ) : (
                                <LinearGradient
                                    colors={getGradientColors(item.bgColor) as any}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="w-full h-full justify-center items-center"
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
    )
}

export default HeroSection
