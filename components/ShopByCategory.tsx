import { View, Text, Image, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { API_BASE_URL } from '../constants/Config'

interface Category {
    id: number;
    name: string;
    image: string;
    subcategories: any[];
}

const ShopByCategory = ({ sectionName }: { sectionName?: string }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            // Webservice: productService.getCategoriesForSection("shop_by_category")
            // Endpoint: /api/categories/section/:sectionKey/categories
            const response = await fetch(`${API_BASE_URL}/categories/section/shop_by_category/categories`);
            const data = await response.json();

            if (data.success && data.categories) {
                setCategories(data.categories);
            } else if (Array.isArray(data)) {
                setCategories(data);
            }
        } catch (error) {
            console.error("ShopByCategory error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubcategoryPress = (category: any, subcategory: any) => {
        router.push({
            pathname: '/categories',
            params: {
                categoryId: category.id,
                subCategoryId: subcategory.id,
                categoryName: category.name
            }
        });
    }

    if (loading) return <View className="h-40 justify-center"><ActivityIndicator color="#FD5B00" /></View>;
    if (categories.length === 0) return null;

    return (
        <View className="bg-white py-6">
            <View className="px-4 mb-4">
                <Text className="text-2xl font-black text-center text-orange-600">{sectionName || "Shop by Category"}</Text>
            </View>

            {categories.map((category) => (
                <View key={category.id} className="mb-6">
                    <Text className="px-4 font-bold text-gray-900 mb-2">{category.name}</Text>
                    <View className="flex-row flex-wrap px-2">
                        {category.subcategories && category.subcategories.map((sub: any) => (
                            <TouchableOpacity
                                key={sub.id}
                                className="w-[25%] p-2 items-center"
                                onPress={() => handleSubcategoryPress(category, sub)}
                            >
                                <View className="w-16 h-16 bg-gray-50 rounded-full mb-2 overflow-hidden items-center justify-center">
                                    {sub.image_url ? (
                                        <Image source={{ uri: sub.image_url }} className="w-full h-full" resizeMode="cover" />
                                    ) : null}
                                </View>
                                <Text className="text-[10px] text-center text-gray-700 font-medium" numberOfLines={2}>{sub.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            ))}
        </View>
    )
}

export default ShopByCategory
