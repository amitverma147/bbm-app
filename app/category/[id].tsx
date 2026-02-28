import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
    ActivityIndicator, FlatList, Image, RefreshControl, ScrollView,
    Text, TouchableOpacity, View
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import ProductCard from '../../components/ProductCard'
import { getProductsBySubcategory, getProductsByGroup } from '../../services/productService'
import { getGroupsBySubcategory, getBrands, Group, Brand } from '../../services/categoryService'
import { API_BASE_URL } from '../../constants/Config'

const CategoryListing = () => {
    const { id, name } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sortBy, setSortBy] = useState<'default' | 'price_low' | 'price_high'>('default');
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
    const [showBrandMenu, setShowBrandMenu] = useState(false);

    useEffect(() => {
        loadGroups();
        loadBrands();
    }, [id]);

    useEffect(() => {
        loadProducts();
    }, [id, selectedGroupId]);

    const loadGroups = async () => {
        setLoadingGroups(true);
        const groupsData = await getGroupsBySubcategory(id as string);
        setGroups(groupsData);
        setLoadingGroups(false);
    };

    const loadProducts = async () => {
        setLoading(true);
        try {
            if (!selectedGroupId) {
                const data = await getProductsBySubcategory(id as string);
                setProducts(data);
            } else {
                const data = await getProductsByGroup(selectedGroupId);
                setProducts(data);
            }
        } catch (error) {
            console.error('Error loading products:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([loadProducts(), loadGroups(), loadBrands()]);
        setRefreshing(false);
    };

    const loadBrands = async () => {
        const data = await getBrands();
        setBrands(data);
    };

    const handleSelectGroup = (groupId: string | null) => {
        setSelectedGroupId(groupId);
        setSelectedBrandIds([]); // reset brand filter on group change
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

    const filteredAndSortedProducts = () => {
        let list = Array.isArray(products) ? [...products] : [];
        // Brand filter (client-side)
        if (selectedBrandIds.length > 0) {
            list = list.filter(p => {
                const pid = p.brand_id || p.brand?.id;
                return pid && selectedBrandIds.includes(pid);
            });
        }
        // Sort
        if (sortBy === 'price_low') list.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        else if (sortBy === 'price_high') list.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        return list;
    };

    const displayProducts = filteredAndSortedProducts();
    const sortLabel = sortBy === 'price_low' ? 'Price: Low to High' : sortBy === 'price_high' ? 'Price: High to Low' : 'Relevance';
    const activeGroups = groups.filter(g => g.active);
    const selectedBrands = brands.filter(b => selectedBrandIds.includes(b.id));

    const renderItem = ({ item }: { item: any }) => (
        <View className="flex-1 px-1.5 mb-3">
            <ProductCard item={item} gridStyle={true} />
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text className="flex-1 ml-2 text-lg font-bold text-gray-900" numberOfLines={1}>
                    {name || 'Category'}
                </Text>
                <TouchableOpacity className="p-2">
                    <Ionicons name="search" size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            {/* Top Filter Bar */}
            <View className="bg-white border-b border-gray-100 px-3 py-2">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row items-center">
                        {/* Filter Icon */}
                        <View className="w-9 h-9 items-center justify-center border border-gray-300 rounded-lg mr-2">
                            <MaterialCommunityIcons name="filter-variant" size={18} color="#374151" />
                        </View>

                        {/* Sort Dropdown */}
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

                        {/* Brand Dropdown */}
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

                        {/* Active group chip */}
                        {selectedGroupId && (() => {
                            const grp = groups.find(g => g.id === selectedGroupId);
                            if (!grp) return null;
                            const imgUri = grp.image_url?.startsWith('http')
                                ? grp.image_url
                                : grp.image_url ? `${API_BASE_URL.replace('/api', '')}/${grp.image_url}` : null;
                            return (
                                <View className="flex-row items-center bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 mr-2">
                                    {imgUri && (
                                        <Image source={{ uri: imgUri }} className="w-6 h-6 rounded mr-1.5" resizeMode="cover" />
                                    )}
                                    <Text className="text-sm font-medium text-gray-900 mr-1.5" numberOfLines={1}>{grp.name}</Text>
                                    <TouchableOpacity onPress={() => setSelectedGroupId(null)}>
                                        <Feather name="x" size={14} color="#9CA3AF" />
                                    </TouchableOpacity>
                                </View>
                            );
                        })()}
                    </View>
                </ScrollView>

                {/* Sort dropdown menu */}
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

                {/* Brand dropdown menu */}
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

            {/* Body: Left Groups Sidebar + Right Product Grid */}
            <View className="flex-1 flex-row">

                {/* Left Sidebar - Groups */}
                <View className="bg-gray-50/80 border-r border-gray-100" style={{ width: 80 }}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* All option */}
                        <TouchableOpacity
                            onPress={() => handleSelectGroup(null)}
                            activeOpacity={0.7}
                            className={`flex-row border-b border-orange-100 ${!selectedGroupId ? 'bg-orange-50/70' : 'bg-gray-50/80'}`}
                        >
                            {/* Orange left indicator bar */}
                            <View className={`w-1 rounded-r-full my-2 ${!selectedGroupId ? 'bg-orange-600' : 'bg-transparent'}`} />
                            {/* Content */}
                            <View className="flex-1 items-center py-4">
                                <View className={`w-12 h-12 rounded-xl items-center justify-center mb-1 ${!selectedGroupId ? 'bg-white/80 border border-orange-200' : 'bg-white border border-gray-100'}`}>
                                    <MaterialCommunityIcons
                                        name="view-grid"
                                        size={22}
                                        color={!selectedGroupId ? '#EA580C' : '#9CA3AF'}
                                    />
                                </View>
                                <Text className={`text-[10px] text-center px-1 font-bold ${!selectedGroupId ? 'text-orange-600' : 'text-gray-500'}`} numberOfLines={2}>
                                    All
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {loadingGroups ? (
                            <View className="py-6 items-center">
                                <ActivityIndicator size="small" color="#EA580C" />
                            </View>
                        ) : (
                            activeGroups.map((group) => {
                                const isSelected = selectedGroupId === group.id;
                                const imgUri = group.image_url?.startsWith('http')
                                    ? group.image_url
                                    : group.image_url ? `${API_BASE_URL.replace('/api', '')}/${group.image_url}` : null;
                                return (
                                    <TouchableOpacity
                                        key={group.id}
                                        onPress={() => handleSelectGroup(group.id)}
                                        activeOpacity={0.7}
                                        className={`flex-row border-b border-orange-100 ${isSelected ? 'bg-orange-50/70' : 'bg-gray-50/80'}`}
                                    >
                                        {/* Orange left indicator bar */}
                                        <View className={`w-1 rounded-r-full my-2 ${isSelected ? 'bg-orange-600' : 'bg-transparent'}`} />
                                        {/* Content */}
                                        <View className="flex-1 items-center py-4">
                                            <View className={`w-12 h-12 rounded-xl items-center justify-center mb-1 overflow-hidden ${isSelected ? 'bg-white/80 border border-orange-200' : 'bg-white border border-gray-100'}`}>
                                                {imgUri ? (
                                                    <Image source={{ uri: imgUri }} className="w-10 h-10" resizeMode="contain" />
                                                ) : (
                                                    <MaterialCommunityIcons name="tag-outline" size={22} color={isSelected ? '#EA580C' : '#9CA3AF'} />
                                                )}
                                            </View>
                                            <Text
                                                className={`text-[10px] text-center px-1 font-bold ${isSelected ? 'text-orange-600' : 'text-gray-500'}`}
                                                numberOfLines={2}
                                            >
                                                {group.name}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                        <View style={{ height: insets.bottom + 100 }} />
                    </ScrollView>
                </View>

                {/* Right: Product Grid */}
                {loading && !refreshing ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#EA580C" />
                        <Text className="mt-4 text-gray-500 font-medium text-sm">Loading products...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={displayProducts}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        style={{ flex: 1 }}
                        contentContainerStyle={{ padding: 6, paddingBottom: insets.bottom + 150 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EA580C']} />
                        }
                        ListHeaderComponent={
                            <Text className="text-xs text-gray-400 font-medium px-1.5 mb-2">
                                {displayProducts.length} Products
                                {selectedGroupId ? ` in ${groups.find(g => g.id === selectedGroupId)?.name ?? ''}` : ''}
                                {selectedBrandIds.length > 0 ? ` · ${selectedBrands.map(b => b.name).join(', ')}` : ''}
                            </Text>
                        }
                        ListEmptyComponent={
                            <View className="flex-1 items-center justify-center pt-16 px-4">
                                <Feather name="shopping-bag" size={56} color="#D1D5DB" />
                                <Text className="text-gray-400 mt-4 text-base font-bold text-center">
                                    No products match your filters
                                </Text>
                                <Text className="text-gray-400 text-xs text-center mt-2">
                                    Try changing the group or brand filter.
                                </Text>
                                <TouchableOpacity
                                    onPress={() => { setSelectedGroupId(null); setSelectedBrandIds([]); }}
                                    className="mt-4 bg-orange-600 px-5 py-2.5 rounded-xl"
                                >
                                    <Text className="text-white font-bold text-sm">Clear All Filters</Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                )}
            </View>

            {/* Tap outside to close menus */}
            {(showSortMenu || showBrandMenu) && (
                <TouchableOpacity
                    className="absolute inset-0"
                    onPress={closeAllMenus}
                    activeOpacity={1}
                />
            )}
        </SafeAreaView>
    );
}

export default CategoryListing
