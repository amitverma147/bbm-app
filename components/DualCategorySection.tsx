import { View, Text, TouchableOpacity, Dimensions, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { getCategoriesHierarchy, getMappedCategoryForSection } from '../services/categoryService'
import { LinearGradient } from 'expo-linear-gradient'
import { Image } from 'expo-image'
import { API_BASE_URL } from '../constants/Config'

const { width } = Dimensions.get('window')

interface DualCategorySectionProps {
    sectionLeftKey: string;
    sectionRightKey: string;
}

const DualCategorySection = ({ sectionLeftKey, sectionRightKey }: DualCategorySectionProps) => {
    const [leftCategory, setLeftCategory] = useState<any>(null);
    const [rightCategory, setRightCategory] = useState<any>(null);
    const [leftSubcategories, setLeftSubcategories] = useState<any[]>([]);
    const [rightSubcategories, setRightSubcategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            // 1. Fetch mappings
            const [leftMappingRes, rightMappingRes] = await Promise.all([
                getMappedCategoryForSection(sectionLeftKey),
                getMappedCategoryForSection(sectionRightKey),
            ]);

            const leftId = leftMappingRes?.id;
            const rightId = rightMappingRes?.id;

            if (!leftId && !rightId) {
                setLoading(false);
                return;
            }

            // 2. Fetch hierarchy
            const response = await getCategoriesHierarchy();

            if (response.success && response.categories) {
                // 3. Resolve full category objects
                if (leftId) {
                    const leftCat = response.categories.find((c: any) => c.id == leftId);
                    if (leftCat) {
                        setLeftCategory(leftCat);
                        setLeftSubcategories(leftCat.subcategories || []);
                    }
                }

                if (rightId) {
                    const rightCat = response.categories.find((c: any) => c.id == rightId);
                    if (rightCat) {
                        setRightCategory(rightCat);
                        setRightSubcategories(rightCat.subcategories || []);
                    }
                }
            }

        } catch (error) {
            console.error("DualCategory fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <View className="px-4 mb-4">
            <View style={{ width: width - 32, height: 200 }} className="bg-gray-200 rounded-xl animate-pulse mb-4" />
            <View style={{ width: width - 32, height: 200 }} className="bg-gray-200 rounded-xl animate-pulse" />
        </View>
    );

    if (!leftCategory && !rightCategory) return null;

    const renderCard = (category: any, subcategories: any[], title: string, subtitle: string, colors: readonly [string, string, ...string[]], themeColor: string) => {
        if (!category) return null;

        return (
            <LinearGradient
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: width - 32 }} // Full width with some margin
                className="rounded-xl p-5 h-72 justify-center relative mx-4 mb-4"
            >
                {/* Header */}
                <View className="mb-4 px-2">
                    <View className="self-start px-3 py-1.5 rounded-full mb-2 bg-white/50 border border-white/20">
                        <Text style={{ color: themeColor }} className="text-xs font-bold">
                            {category.name}
                        </Text>
                    </View>
                    <Text className="text-2xl font-black text-gray-800 leading-tight">{title}</Text>
                    <Text className="text-sm font-bold text-gray-600 mt-1">{subtitle}</Text>
                </View>

                {/* Subcategories List */}
                {subcategories.length > 0 ? (
                    <FlatList
                        data={subcategories}
                        keyExtractor={(item) => item.id.toString()}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="flex-1 mt-2"
                        contentContainerStyle={{ paddingHorizontal: 0 }}
                        renderItem={({ item }) => {
                            // Construct Image URL safely
                            const imageUrl = item.image || item.image_url;
                            const baseUrl = API_BASE_URL.replace('/api', '');
                            const fullImageUrl = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`) : 'https://via.placeholder.com/80';

                            return (
                                <TouchableOpacity
                                    onPress={() => router.push(`/categories?id=${category.id}`)}
                                    className="mr-4 items-center bg-white rounded-xl p-3 w-32 h-40 justify-between shadow-sm"
                                >
                                    <Image
                                        source={{ uri: fullImageUrl }}
                                        className="w-20 h-20 rounded-lg mb-2"
                                        contentFit="contain"
                                    />
                                    <Text numberOfLines={2} className="text-xs text-center font-bold text-gray-800">
                                        {item.name}
                                    </Text>
                                    <Text className="text-[10px] text-green-600 font-bold">UP TO 60% OFF</Text>
                                </TouchableOpacity>
                            )
                        }}
                    />
                ) : (
                    <View className="flex-1 justify-center items-center">
                        <Text className="text-sm text-gray-500">No deals available</Text>
                    </View>
                )}
            </LinearGradient>
        )
    }

    return (
        <View className="mb-2">
            {renderCard(
                leftCategory,
                leftSubcategories,
                "Best Selling",
                "UP TO 60% OFF",
                ['#E0F2FE', '#DBEAFE', '#EFF6FF'],
                '#1e40af' // blue-800
            )}
            {renderCard(
                rightCategory,
                rightSubcategories,
                "Trending Now",
                "UP TO 90% OFF",
                ['#FFE4C4', '#FFEBCD', '#F5DEB3'],
                '#78350f' // amber-900
            )}
        </View>
    )
}

export default DualCategorySection
