import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, ScrollView, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { getProductsByStore } from '../../services/productService'
import ProductCard from '../../components/ProductCard'
import { Stack } from 'expo-router'

const StoreListing = () => {
    const { id, name, image } = useLocalSearchParams();
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sortBy, setSortBy] = useState<'default' | 'price_low' | 'price_high'>('default');

    useEffect(() => {
        loadProducts();
    }, [id]);

    const loadProducts = async () => {
        setLoading(true);
        const data = await getProductsByStore(id as string);
        setProducts(data);
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadProducts();
        setRefreshing(false);
    };

    const sortedProducts = () => {
        const productList = Array.isArray(products) ? products : [];
        let sorted = [...productList];
        if (sortBy === 'price_low') {
            sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        } else if (sortBy === 'price_high') {
            sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        }
        return sorted;
    };

    const renderHeader = () => (
        <View className="mb-4">
            {/* Store Banner */}
            <View className="h-48 bg-gray-100 relative">
                {image ? (
                    <Image source={{ uri: image as string }} className="w-full h-full" resizeMode="cover" />
                ) : (
                    <View className="w-full h-full items-center justify-center bg-orange-50">
                        <MaterialCommunityIcons name="store" size={64} color="#EA580C" />
                    </View>
                )}
                {/* Overlay with store info */}
                <View className="absolute inset-x-0 bottom-0 bg-black/40 p-4">
                    <Text className="text-white text-2xl font-bold">{name || 'Store Detail'}</Text>
                    <View className="flex-row items-center mt-1">
                        <Ionicons name="star" size={14} color="#FBBF24" />
                        <Text className="text-white text-xs font-bold ml-1">4.5 • Reliable Seller</Text>
                    </View>
                </View>
            </View>

            {/* Sub-header / Filters */}
            <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
                    <TouchableOpacity
                        onPress={() => setSortBy('default')}
                        className={`px-4 py-2 rounded-full mr-2 border ${sortBy === 'default' ? 'bg-orange-600 border-orange-600' : 'bg-white border-gray-200'}`}
                    >
                        <Text className={`text-xs font-bold ${sortBy === 'default' ? 'text-white' : 'text-gray-600'}`}>Recommended</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setSortBy('price_low')}
                        className={`px-4 py-2 rounded-full mr-2 border ${sortBy === 'price_low' ? 'bg-orange-600 border-orange-600' : 'bg-white border-gray-200'}`}
                    >
                        <Text className={`text-xs font-bold ${sortBy === 'price_low' ? 'text-white' : 'text-gray-600'}`}>Price: Low to High</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setSortBy('price_high')}
                        className={`px-4 py-2 rounded-full mr-2 border ${sortBy === 'price_high' ? 'bg-orange-600 border-orange-600' : 'bg-white border-gray-200'}`}
                    >
                        <Text className={`text-xs font-bold ${sortBy === 'price_high' ? 'text-white' : 'text-gray-600'}`}>Price: High to Low</Text>
                    </TouchableOpacity>
                </ScrollView>
                <TouchableOpacity className="ml-2 flex-row items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                    <MaterialCommunityIcons name="filter-variant" size={16} color="#1F2937" />
                    <Text className="text-xs font-bold ml-1 text-gray-900">Filter</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderItem = ({ item }: { item: any }) => (
        <View className="flex-1 px-2 mb-4">
            <ProductCard
                item={item}
                gridStyle={true}
            />
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Header */}
            <View className="flex-row items-center px-4 py-3 bg-white z-10">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 bg-gray-100 rounded-full">
                    <Ionicons name="arrow-back" size={20} color="#1F2937" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-gray-900 ml-4 flex-1" numberOfLines={1}>
                    {name}
                </Text>
                <TouchableOpacity className="p-2 bg-gray-100 rounded-full">
                    <Ionicons name="search" size={20} color="#1F2937" />
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#EA580C" />
                    <Text className="mt-4 text-gray-500 font-medium">Loading store products...</Text>
                </View>
            ) : (
                <FlatList
                    ListHeaderComponent={renderHeader}
                    data={sortedProducts()}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EA580C']} />
                    }
                    ListEmptyComponent={
                        <View className="flex-1 items-center justify-center pt-20">
                            <Feather name="shopping-bag" size={64} color="#D1D5DB" />
                            <Text className="text-gray-400 mt-4 text-lg font-bold">No items available</Text>
                            <Text className="text-gray-400 text-sm text-center px-10 mt-2">
                                This store hasn't added any products to this category yet.
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    )
}

export default StoreListing
