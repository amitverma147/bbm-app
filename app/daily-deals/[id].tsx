import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { API_BASE_URL } from '../../constants/Config'
import { Ionicons } from '@expo/vector-icons'
import ProductCard from '../../components/ProductCard' // Reusing ProductCard if available
import { SafeAreaView } from 'react-native-safe-area-context'

const DailyDealProducts = () => {
    const { id } = useLocalSearchParams();
    const [products, setProducts] = useState<any[]>([]);
    const [dealInfo, setDealInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (id) fetchProducts();
    }, [id]);

    const fetchProducts = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/daily-deals-product/daily-deal/${id}`);
            const data = await response.json();
            if (data.success) {
                setProducts(data.products || []);
                setDealInfo(data.dailyDeal);
            }
        } catch (error) {
            console.error("DailyDealProducts fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View className="flex-1 m-1">
            {/* Using a simplified card or imported ProductCard if it handles props correctly */}
            {/* Assuming ProductCard takes 'product' prop */}
            {/* If ProductCard is complex, using manual render for now to be safe */}
            <TouchableOpacity
                className="bg-white rounded-lg p-2 shadow-sm border border-gray-100"
                onPress={() => router.push(`/product/${item.id}` as any)}
            >
                <Image source={{ uri: item.image }} className="w-full h-32 rounded-md mb-2" resizeMode="contain" />
                <Text numberOfLines={2} className="text-sm font-medium text-gray-800 mb-1">{item.name}</Text>
                <View className="flex-row items-center gap-2">
                    <Text className="text-orange-500 font-bold">₹{item.price}</Text>
                    {item.oldPrice > item.price && (
                        <Text className="text-gray-400 text-xs line-through">₹{item.oldPrice}</Text>
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center">
                <ActivityIndicator size="large" color="#FD5B00" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="px-4 py-3 flex-row items-center border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text className="text-lg font-bold flex-1" numberOfLines={1}>
                    {dealInfo?.title || "Daily Deal"}
                </Text>
            </View>

            {/* Content */}
            <FlatList
                data={products}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                contentContainerStyle={{ padding: 8 }}
                ListEmptyComponent={
                    <View className="flex-1 justify-center items-center mt-20">
                        <Text className="text-gray-500">No products found in this deal.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    )
}

export default DailyDealProducts
