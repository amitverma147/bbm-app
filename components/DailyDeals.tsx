import { View, Text, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { API_BASE_URL } from '../constants/Config'

const { width } = Dimensions.get('window')

const DailyDeals = () => {
    const [deals, setDeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
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
        <View className="py-4 bg-[#FCF8F8]">
            <View className="px-4 mb-4 flex-row justify-between items-center">
                <Text className="text-2xl font-black text-gray-800">DAILY DEALS</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                {deals.map((deal, index) => (
                    <TouchableOpacity
                        key={deal.id || index}
                        className="mr-3 bg-white rounded-xl shadow-sm overflow-hidden w-[140px]"
                        onPress={() => router.push(`/daily-deals/${deal.id}` as any)}
                    >
                        {/* Green Badge */}
                        <View className="bg-emerald-500 py-1 px-2">
                            <Text className="text-white text-[10px] font-bold text-center" numberOfLines={1}>
                                {deal.discount || "UP TO 50% OFF"}
                            </Text>
                        </View>

                        {/* Image */}
                        <View className="h-28 w-full bg-white p-2">
                            {deal.image_url ? (
                                <Image
                                    source={{ uri: deal.image_url }}
                                    className="w-full h-full"
                                    resizeMode="contain"
                                />
                            ) : null}
                        </View>

                        {/* Red Badge (Title) */}
                        <View className="bg-red-500 py-1 px-2">
                            <Text className="text-white text-[10px] font-bold text-center" numberOfLines={1}>
                                {deal.title}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    )
}

export default DailyDeals
