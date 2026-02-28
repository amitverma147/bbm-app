import {
    View, Text, ActivityIndicator, FlatList, TouchableOpacity,
    Image, ScrollView, RefreshControl
} from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { API_BASE_URL } from '../../constants/Config'
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import ProductCard from '../../components/ProductCard'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { getBrands, Brand } from '../../services/categoryService'

const DailyDealProducts = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [products, setProducts] = useState<any[]>([]);
    const [dealInfo, setDealInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [sortBy, setSortBy] = useState<'default' | 'price_low' | 'price_high'>('default');
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
    const [showBrandMenu, setShowBrandMenu] = useState(false);

    useEffect(() => {
        if (id) {
            fetchDeal();
            loadBrands();
        }
    }, [id]);

    const fetchDeal = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/daily-deals-product/daily-deal/${id}`);
            const data = await response.json();
            if (data.success) {
                setProducts(data.products || []);
                setDealInfo(data.dailyDeal);
            }
        } catch (error) {
            console.error('DailyDeal fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadBrands = async () => {
        const data = await getBrands();
        setBrands(data);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchDeal(), loadBrands()]);
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
        let list = Array.isArray(products) ? [...products] : [];
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

    const renderItem = ({ item }: { item: any }) => (
        <View className="flex-1 px-1.5 mb-3">
            <ProductCard item={item} gridStyle={true} />
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text className="flex-1 ml-2 text-lg font-bold text-gray-900" numberOfLines={1}>
                    {dealInfo?.title || 'Daily Deal'}
                </Text>
                <TouchableOpacity className="p-2">
                    <Ionicons name="search" size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#EA580C" />
                    <Text className="mt-4 text-gray-500 font-medium text-sm">Loading deal products...</Text>
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    {/* ─── Hero Banner ──────────────────────────────── */}
                    <View className="mx-3 mt-3 mb-3 rounded-2xl overflow-hidden bg-orange-100" style={{ height: 180 }}>
                        {dealInfo?.image_url ? (
                            <Image
                                source={{ uri: dealInfo.image_url }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                            />
                        ) : (
                            <View className="flex-1 items-center justify-center">
                                <MaterialCommunityIcons name="tag-multiple" size={64} color="#EA580C" />
                            </View>
                        )}
                        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} className="bg-black/50 px-4 pb-4 pt-6">
                            <Text className="text-white text-xl font-bold" numberOfLines={2}>
                                {dealInfo?.title || 'Daily Deal'}
                            </Text>
                            {dealInfo?.discount ? (
                                <View className="flex-row items-center mt-1.5">
                                    <View className="bg-orange-500 rounded-full px-3 py-0.5">
                                        <Text className="text-white text-xs font-bold">{dealInfo.discount}</Text>
                                    </View>
                                </View>
                            ) : null}
                        </View>
                    </View>

                    {/* ─── Filter Bar ───────────────────────────────── */}
                    <View className="bg-white mx-3 mb-3 rounded-2xl border border-gray-100 px-3 py-2" style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View className="flex-row items-center">
                                {/* Filter label */}
                                <View className="flex-row items-center mr-3">
                                    <MaterialCommunityIcons name="filter-variant" size={18} color="#374151" />
                                    <Text className="text-sm font-semibold text-gray-700 ml-1.5">Filters</Text>
                                </View>
                                <View className="w-px h-5 bg-gray-200 mr-3" />

                                {/* Sort dropdown button */}
                                <TouchableOpacity
                                    onPress={() => { setShowBrandMenu(false); setShowSortMenu(v => !v); }}
                                    className={`flex-row items-center border rounded-lg px-3 py-2 mr-2 ${sortBy !== 'default' ? 'bg-orange-50 border-orange-400' : 'bg-white border-gray-300'}`}
                                >
                                    <Text className={`text-sm font-medium mr-1 ${sortBy !== 'default' ? 'text-orange-600' : 'text-gray-900'}`}>
                                        {sortBy === 'default' ? 'Sort by' : sortLabel}
                                    </Text>
                                    <Feather name={showSortMenu ? 'chevron-up' : 'chevron-down'} size={14} color={sortBy !== 'default' ? '#EA580C' : '#6B7280'} />
                                </TouchableOpacity>

                                {/* Brand dropdown button */}
                                <TouchableOpacity
                                    onPress={() => { setShowSortMenu(false); setShowBrandMenu(v => !v); }}
                                    className={`flex-row items-center border rounded-lg px-3 py-2 mr-3 ${selectedBrandIds.length > 0 ? 'bg-orange-50 border-orange-400' : 'bg-white border-gray-300'}`}
                                >
                                    <Text className={`text-sm font-medium mr-1 ${selectedBrandIds.length > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
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
                    </View>

                    {/* Product count */}
                    {displayProducts.length > 0 && (
                        <Text className="text-xs text-gray-400 font-medium px-4 pb-2">
                            {displayProducts.length} Products
                            {selectedBrandIds.length > 0 ? ` · ${selectedBrands.map(b => b.name).join(', ')}` : ''}
                        </Text>
                    )}

                    {/* ─── Product Grid ─────────────────────────────── */}
                    <FlatList
                        data={displayProducts}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id?.toString()}
                        numColumns={2}
                        style={{ flex: 1 }}
                        contentContainerStyle={{ paddingHorizontal: 6, paddingBottom: insets.bottom + 80 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EA580C']} />
                        }
                        ListEmptyComponent={
                            <View className="mx-3 bg-white rounded-2xl items-center py-12 px-6" style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 }}>
                                <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
                                    <Feather name="inbox" size={36} color="#9CA3AF" />
                                </View>
                                <Text className="text-gray-800 text-lg font-bold text-center mb-2">No Products Found</Text>
                                <Text className="text-gray-400 text-sm text-center mb-6">
                                    {selectedBrandIds.length > 0
                                        ? 'No products available for the selected brand.'
                                        : 'No products available for this deal at the moment.'}
                                </Text>
                                {selectedBrandIds.length > 0 ? (
                                    <TouchableOpacity onPress={() => setSelectedBrandIds([])} className="bg-orange-600 px-8 py-3 rounded-xl">
                                        <Text className="text-white font-bold text-sm">Clear Filters</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity onPress={() => router.push('/' as any)} className="bg-orange-600 px-8 py-3 rounded-xl">
                                        <Text className="text-white font-bold text-sm">Back to Home</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        }
                    />

                    {/* ─── Sort floating menu ───────────────────────── */}
                    {showSortMenu && (
                        <View className="absolute bg-white border border-gray-200 rounded-xl overflow-hidden" style={{ top: 230, left: 60, zIndex: 100, width: 210, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 }}>
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

                    {/* ─── Brand floating menu ──────────────────────── */}
                    {showBrandMenu && (
                        <View className="absolute bg-white border border-gray-200 rounded-xl overflow-hidden" style={{ top: 230, left: 160, zIndex: 100, width: 220, maxHeight: 280, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 }}>
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
                                                <Text className={`flex-1 text-sm ${isChecked ? 'font-bold text-orange-600' : 'text-gray-800'}`} numberOfLines={1}>{br.name}</Text>
                                                <View className={`w-5 h-5 rounded-md items-center justify-center ${isChecked ? 'bg-orange-600' : 'border-2 border-gray-300 bg-white'}`}>
                                                    {isChecked && <Feather name="check" size={12} color="white" />}
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })
                                )}
                                {selectedBrandIds.length > 0 && (
                                    <TouchableOpacity onPress={() => { setSelectedBrandIds([]); setShowBrandMenu(false); }} className="px-4 py-3 items-center bg-gray-50">
                                        <Text className="text-sm font-bold text-red-500">Clear Brand Filter</Text>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        </View>
                    )}

                    {/* Tap outside overlay */}
                    {(showSortMenu || showBrandMenu) && (
                        <TouchableOpacity
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }}
                            onPress={closeAllMenus}
                            activeOpacity={1}
                        />
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}

export default DailyDealProducts
