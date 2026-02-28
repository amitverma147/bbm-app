import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, ScrollView, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { getProductsByStore } from '../../services/productService'
import ProductCard from '../../components/ProductCard'
import { Stack } from 'expo-router'
import { getBrands, Brand } from '../../services/categoryService'

const StoreListing = () => {
    const { id, name, image } = useLocalSearchParams();
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sortBy, setSortBy] = useState<'default' | 'price_low' | 'price_high'>('default');
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
    const [showBrandMenu, setShowBrandMenu] = useState(false);

    useEffect(() => {
        loadProducts();
        loadBrands();
    }, [id]);

    const loadProducts = async () => {
        setLoading(true);
        const data = await getProductsByStore(id as string);
        setProducts(data);
        setLoading(false);
    };

    const loadBrands = async () => {
        const data = await getBrands();
        setBrands(data);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([loadProducts(), loadBrands()]);
        setRefreshing(false);
    };

    const toggleBrand = (brandId: string) => {
        setSelectedBrandIds(prev =>
            prev.includes(brandId) ? prev.filter(b => b !== brandId) : [...prev, brandId]
        );
    };

    const closeAllMenus = () => {
        setShowSortMenu(false);
        setShowBrandMenu(false);
    };

    const displayProducts = (() => {
        const productList = Array.isArray(products) ? products : [];
        let list = [...productList];
        if (selectedBrandIds.length > 0) {
            list = list.filter(p => {
                const pid = p.brand_id || p.brand?.id;
                return pid && selectedBrandIds.includes(pid);
            });
        }
        if (sortBy === 'price_low') list.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        else if (sortBy === 'price_high') list.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        return list;
    })();

    const selectedBrands = brands.filter(b => selectedBrandIds.includes(b.id));
    const sortLabel = sortBy === 'price_low' ? 'Price: Low to High' : sortBy === 'price_high' ? 'Price: High to Low' : 'Relevance';

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
            </View>

            {/* Sub-header / Filters */}
            <View className="bg-white border-b border-gray-100 px-3 py-2">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row items-center">
                        {/* Filter icon */}
                        <View className="w-9 h-9 items-center justify-center border border-gray-300 rounded-lg mr-2">
                            <MaterialCommunityIcons name="filter-variant" size={18} color="#374151" />
                        </View>

                        {/* Sort dropdown button */}
                        <TouchableOpacity
                            onPress={() => { setShowBrandMenu(false); setShowSortMenu(v => !v); }}
                            className={`flex-row items-center border rounded-lg px-3 py-2 mr-2 ${
                                sortBy !== 'default' ? 'bg-orange-50 border-orange-400' : 'bg-white border-gray-300'
                            }`}
                        >
                            <Text className={`text-sm font-medium mr-1 ${
                                sortBy !== 'default' ? 'text-orange-600' : 'text-gray-900'
                            }`}>
                                {sortBy === 'default' ? 'Sort by' : sortLabel}
                            </Text>
                            <Feather name={showSortMenu ? 'chevron-up' : 'chevron-down'} size={14} color={sortBy !== 'default' ? '#EA580C' : '#6B7280'} />
                        </TouchableOpacity>

                        {/* Brand dropdown button */}
                        <TouchableOpacity
                            onPress={() => { setShowSortMenu(false); setShowBrandMenu(v => !v); }}
                            className={`flex-row items-center border rounded-lg px-3 py-2 mr-3 ${
                                selectedBrandIds.length > 0 ? 'bg-orange-50 border-orange-400' : 'bg-white border-gray-300'
                            }`}
                        >
                            <Text className={`text-sm font-medium mr-1 ${
                                selectedBrandIds.length > 0 ? 'text-orange-600' : 'text-gray-900'
                            }`}>
                                Brand{selectedBrandIds.length > 0 ? ` (${selectedBrandIds.length})` : ''}
                            </Text>
                            <Feather name={showBrandMenu ? 'chevron-up' : 'chevron-down'} size={14} color={selectedBrandIds.length > 0 ? '#EA580C' : '#6B7280'} />
                        </TouchableOpacity>

                        {/* Active brand chips */}
                        {selectedBrands.map(br => (
                            <View key={br.id} className="flex-row items-center bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 mr-2">
                                <Image source={{ uri: br.image_url }} className="w-5 h-5 rounded mr-1.5" resizeMode="cover" />
                                <Text className="text-sm font-medium text-gray-900 mr-1.5" numberOfLines={1}>{br.name}</Text>
                                <TouchableOpacity onPress={() => toggleBrand(br.id)}>
                                    <Feather name="x" size={14} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </ScrollView>

                {/* Sort floating menu */}
                {showSortMenu && (
                    <View className="absolute top-14 left-14 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden" style={{ width: 210 }}>
                        {[
                            { key: 'default', label: 'Relevance' },
                            { key: 'price_low', label: 'Price: Low to High' },
                            { key: 'price_high', label: 'Price: High to Low' },
                        ].map(opt => (
                            <TouchableOpacity
                                key={opt.key}
                                onPress={() => { setSortBy(opt.key as any); setShowSortMenu(false); }}
                                className={`flex-row items-center px-4 py-3 border-b border-gray-50 ${sortBy === opt.key ? 'bg-orange-50' : 'bg-white'}`}
                            >
                                <View className={`w-4 h-4 rounded-full border-2 mr-3 items-center justify-center ${sortBy === opt.key ? 'border-orange-600' : 'border-gray-300'}`}>
                                    {sortBy === opt.key && <View className="w-2 h-2 rounded-full bg-orange-600" />}
                                </View>
                                <Text className={`text-sm ${sortBy === opt.key ? 'font-bold text-orange-600' : 'text-gray-700'}`}>{opt.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Brand floating menu */}
                {showBrandMenu && (
                    <View className="absolute top-14 left-32 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden" style={{ width: 220, maxHeight: 280 }}>
                        <ScrollView>
                            {brands.length === 0 ? (
                                <View className="py-6 items-center">
                                    <ActivityIndicator size="small" color="#EA580C" />
                                </View>
                            ) : (
                                brands.map(br => {
                                    const isChecked = selectedBrandIds.includes(br.id);
                                    return (
                                        <TouchableOpacity
                                            key={br.id}
                                            onPress={() => toggleBrand(br.id)}
                                            className={`flex-row items-center px-4 py-3 border-b border-gray-50 ${isChecked ? 'bg-orange-50' : 'bg-white'}`}
                                        >
                                            <Image source={{ uri: br.image_url }} className="w-8 h-8 rounded-lg mr-3" resizeMode="cover" />
                                            <Text className={`flex-1 text-sm ${isChecked ? 'font-bold text-orange-600' : 'text-gray-800'}`} numberOfLines={1}>
                                                {br.name}
                                            </Text>
                                            <View className={`w-5 h-5 rounded-md items-center justify-center ${
                                                isChecked ? 'bg-orange-600' : 'border-2 border-gray-300 bg-white'
                                            }`}>
                                                {isChecked && <Feather name="check" size={12} color="white" />}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                            {selectedBrandIds.length > 0 && (
                                <TouchableOpacity
                                    onPress={() => { setSelectedBrandIds([]); setShowBrandMenu(false); }}
                                    className="px-4 py-3 items-center bg-gray-50"
                                >
                                    <Text className="text-sm font-bold text-red-500">Clear Brand Filter</Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </View>
                )}
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
                <View style={{ flex: 1 }}>
                    <FlatList
                        ListHeaderComponent={renderHeader}
                        data={displayProducts}
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
                                <Text className="text-gray-400 mt-4 text-lg font-bold">
                                    {selectedBrandIds.length > 0 ? 'No products match your filters' : 'No items available'}
                                </Text>
                                <Text className="text-gray-400 text-sm text-center px-10 mt-2">
                                    {selectedBrandIds.length > 0 ? 'Try removing the brand filter.' : "This store hasn't added any products yet."}
                                </Text>
                                {selectedBrandIds.length > 0 && (
                                    <TouchableOpacity
                                        onPress={() => setSelectedBrandIds([])}
                                        className="mt-4 bg-orange-600 px-5 py-2.5 rounded-xl"
                                    >
                                        <Text className="text-white font-bold text-sm">Clear Brand Filter</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        }
                    />

                    {/* Tap outside to close menus */}
                    {(showSortMenu || showBrandMenu) && (
                        <TouchableOpacity
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                            onPress={closeAllMenus}
                            activeOpacity={1}
                        />
                    )}
                </View>
            )}
        </SafeAreaView>
    )
}

export default StoreListing
