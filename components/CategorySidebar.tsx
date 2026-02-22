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
                            className={`items-center py-4 border-b border-gray-50 bg-gray-50/50 ${isSelected ? 'bg-white border-l-4 border-l-[#FD5B00]' : ''}`}
                        >
                            <View className={`w-12 h-12 rounded-full items-center justify-center mb-1 ${isSelected ? 'bg-orange-50' : 'bg-gray-100'}`}>
                                {/* Placeholder for icon/image */}
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
                                        <Image source={{ uri: finalUri }} className="w-8 h-8" resizeMode="contain" />
                                    ) : (
                                        <FontAwesome5 name="th-large" size={16} color={isSelected ? '#FD5B00' : 'gray'} />
                                    );
                                })()}
                            </View>
                            <Text className={`text-[10px] text-center px-1 font-medium ${isSelected ? 'text-[#FD5B00]' : 'text-gray-500'}`}>
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
