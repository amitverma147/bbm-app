import { View, Text, Image, TouchableOpacity, Dimensions } from 'react-native'
import React, { useEffect, useState } from 'react'
import { API_BASE_URL } from '../constants/Config'

const { width } = Dimensions.get('window')

interface DynamicMegaSaleProps {
    // If passed from parent
    products?: any[];
    sectionName?: string;
    sectionId?: string | number;
}

const DynamicMegaSale = ({ products: initialProducts, sectionName, sectionId }: DynamicMegaSaleProps) => {
    const [banner, setBanner] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (initialProducts && initialProducts.length > 0) {
            setBanner(initialProducts[0]);
            setLoading(false);
        } else if (sectionId) {
            fetchSectionContent();
        } else {
            setLoading(false); // No ID, no products, show fallback?
        }
    }, [initialProducts, sectionId]);

    const fetchSectionContent = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/product-sections/${sectionId}/content`);
            const data = await response.json();
            if (data.success && data.data && data.data.products && data.data.products.length > 0) {
                // "products" in this context are banners for this section type
                setBanner(data.data.products[0]);
            }
        } catch (error) {
            console.error("DynamicMegaSale fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <View className="h-[200px] bg-gray-200 animate-pulse rounded-2xl mx-4 my-3" />;
    }

    // Fallback if still no banner
    const displayBanner = banner || {
        name: sectionName || "MEGA SALE",
        description: "UP TO 70% OFF",
        image_url: undefined, // Gradient fallback
    };

    return (
        <View className="px-4 py-3">
            <View className="w-full h-[200px] rounded-2xl overflow-hidden bg-orange-500 relative shadow-xl">
                {/* Background Image */}
                {displayBanner.image_url ? (
                    <Image
                        source={{ uri: displayBanner.image_url }}
                        className="absolute inset-0 w-full h-full opacity-60"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500" />
                )}
                <View className="absolute inset-0 bg-black/20" />

                {/* Content */}
                <View className="flex-1 justify-center items-center p-4">
                    <View className="bg-white/20 px-3 py-1 rounded-full mb-2 border border-white/30">
                        <Text className="text-white text-[10px] font-bold">LIMITED TIME</Text>
                    </View>

                    <Text className="text-3xl font-black text-white text-center mb-1 leading-tight">
                        {displayBanner.name}
                    </Text>

                    {displayBanner.description ? (
                        <Text className="text-white text-center font-semibold mb-3">{displayBanner.description}</Text>
                    ) : null}

                    <TouchableOpacity className="bg-white px-6 py-2 rounded-xl mt-2 active:scale-95 transition-transform">
                        <Text className="text-gray-900 font-bold">Shop Now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}

export default DynamicMegaSale
