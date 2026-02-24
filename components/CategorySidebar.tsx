import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { FontAwesome5 } from '@expo/vector-icons';
import { API_BASE_URL } from '../constants/Config';

interface CategorySidebarProps {
    categories: any[];
    selectedCategory: any;
    onSelectCategory: (category: any) => void;
}

const CategorySidebar = ({ categories, selectedCategory, onSelectCategory }: CategorySidebarProps) => {
    return (
        <View className="w-[25%] bg-white border-r border-gray-100">
            <ScrollView showsVerticalScrollIndicator={false}>
                {categories.map((item) => {
                    const isSelected = selectedCategory?.id === item.id;
                    return (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => onSelectCategory(item)}
                            activeOpacity={0.7}
                            className={`items-center py-5 border-b border-gray-50 ${isSelected ? 'bg-white' : 'bg-gray-50/80'}`}
                        >
                            {isSelected && <View className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-600 rounded-r-full" />}
                            <View className={`w-14 h-14 rounded-2xl items-center justify-center mb-1.5 ${isSelected ? 'bg-orange-50 shadow-sm' : 'bg-white border border-gray-100'}`}>
                                {(() => {
                                    const imageUrl = item.image_url || item.image || item.icon;
                                    let finalUri = null;
                                    if (imageUrl) {
                                        if (imageUrl.startsWith("http")) finalUri = imageUrl;
                                        else {
                                            const baseUrl = API_BASE_URL.replace("/api", "");
                                            finalUri = `${baseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
                                        }
                                    }
                                    return finalUri ? (
                                        <Image source={{ uri: finalUri }} className="w-10 h-10" resizeMode="contain" />
                                    ) : (
                                        <FontAwesome5 name="th-large" size={20} color={isSelected ? '#EA580C' : '#9CA3AF'} />
                                    );
                                })()}
                            </View>
                            <Text className={`text-[10px] text-center px-1 font-bold ${isSelected ? 'text-orange-600' : 'text-gray-500'}`} numberOfLines={2}>
                                {item.name}
                            </Text>
                        </TouchableOpacity>
                    )
                })}
                <View className="h-20" />
            </ScrollView>
        </View>
    )
}

export default CategorySidebar
