import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native'
import React from 'react'

interface SubCategoryGridProps {
    category: any;
    subcategories?: any[]; // Allow passing subcategories if available
}

// Dummy subcategories generator if none provided
const generateDummySubcats = (catName: string) => {
    return Array(6).fill(null).map((_, i) => ({
        id: `sub-${i}`,
        name: `${catName} ${i + 1}`,
        image: 'https://via.placeholder.com/100'
    }));
}

const SubCategoryGrid = ({ category }: SubCategoryGridProps) => {
    if (!category) return <View className="flex-1 items-center justify-center"><Text>Select a category</Text></View>;

    // Use passed subcategories or generate dummy ones for now
    const data = category.subcategories || generateDummySubcats(category.name);

    return (
        <View className="flex-1 bg-white">
            <View className="p-4 border-b border-gray-50">
                <Text className="text-lg font-bold text-gray-800">{category.name}</Text>
                <Text className="text-xs text-gray-500">{data.length} items</Text>
            </View>

            <ScrollView className="flex-1 p-3">
                <View className="flex-row flex-wrap justify-between">
                    {data.map((item: any) => (
                        <TouchableOpacity key={item.id} className="w-[48%] bg-white rounded-xl border border-gray-100 mb-3 p-3 items-center shadow-sm">
                            <View className="w-16 h-16 bg-gray-50 rounded-lg mb-2 items-center justify-center">
                                <Image source={{ uri: item.image }} className="w-full h-full rounded-lg" resizeMode="cover" />
                            </View>
                            <Text className="text-xs font-semibold text-center text-gray-800" numberOfLines={2}>{item.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <View className="h-20" />
            </ScrollView>
        </View>
    )
}

export default SubCategoryGrid
