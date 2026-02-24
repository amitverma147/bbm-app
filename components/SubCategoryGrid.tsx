import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native'
import React from 'react'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

interface SubCategoryGridProps {
    category: any;
}

const SubCategoryGrid = ({ category }: SubCategoryGridProps) => {
    const router = useRouter();

    if (!category) return (
        <View className="flex-1 items-center justify-center bg-gray-50">
            <ActivityIndicator color="#EA580C" />
        </View>
    );

    // Backend hierarchy returns 'subcategories'
    // Fallback logic for data extraction
    const data = category.subcategories || category.groups || [];

    return (
        <View className="flex-1 bg-gray-50">
            <View className="p-5 bg-white border-b border-gray-100 shadow-sm">
                <Text className="text-xl font-extrabold text-gray-900 tracking-tight">{category.name}</Text>
                <Text className="text-xs text-gray-500 font-medium mt-1">
                    {data.length > 0 ? `Explore ${data.length} collections` : 'No subcategories found'}
                </Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="flex-row flex-wrap p-4 justify-between">
                    {data.map((item: any) => {
                        // Handle backend image properties
                        const imageUrl = item.image_url || item.icon || item.image;

                        return (
                            <TouchableOpacity
                                key={item.id}
                                activeOpacity={0.8}
                                onPress={() => router.push(`/category/${item.id}`)}
                                className="w-[31%] bg-white rounded-2xl mb-4 p-2 items-center shadow-sm border border-gray-100"
                            >
                                <View className="w-full aspect-square bg-blue-50/50 rounded-xl mb-2 items-center justify-center overflow-hidden">
                                    {imageUrl ? (
                                        <Image
                                            source={{ uri: imageUrl }}
                                            className="w-full h-full"
                                            resizeMode="contain"
                                        />
                                    ) : (
                                        <Feather name="box" size={24} color="#FD5B00" />
                                    )}
                                </View>
                                <Text className="text-[10px] font-bold text-center text-gray-900 h-8" numberOfLines={2}>
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {data.length === 0 && (
                    <View className="flex-1 items-center justify-center pt-20">
                        <Feather name="folder-minus" size={48} color="#D1D5DB" />
                        <Text className="text-gray-400 mt-4 font-medium">Coming Soon</Text>
                    </View>
                )}

                <View className="h-24" />
            </ScrollView>
        </View>
    )
}

export default SubCategoryGrid
