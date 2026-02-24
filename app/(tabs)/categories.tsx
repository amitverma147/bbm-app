import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../../constants/Config";
import { Stack } from "expo-router";

interface Category {
    id: number;
    name: string;
    image: string;
    subcategories: any[];
}

const CategoriesScreen = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/categories/section/shop_by_category/categories`,
            );
            const data = await response.json();

            if (data.success && data.categories) {
                setCategories(data.categories);
            } else if (Array.isArray(data)) {
                setCategories(data);
            }
        } catch (error) {
            console.error("CategoriesScreen error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubcategoryPress = (category: any, subcategory: any) => {
        router.push({
            pathname: `/category/${subcategory.id}` as any,
            params: {
                name: subcategory.name,
            },
        });
    };

    if (loading)
        return (
            <View className="flex-1 justify-center bg-white">
                <ActivityIndicator color="#FD5B00" />
            </View>
        );

    return (
        <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
            <Stack.Screen options={{ title: "Categories", headerShown: false }} />

            <View className="px-4 py-4 border-b border-gray-100">
                <Text className="text-2xl font-black text-gray-900">
                    All Categories
                </Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="py-2">
                    {categories.map((category) => (
                        <View key={category.id} className="mb-6 w-full">
                            <Text className="px-4 font-bold text-gray-900 mb-2">
                                {category.name}
                            </Text>
                            <View className="flex-row flex-wrap w-full">
                                {category.subcategories &&
                                    category.subcategories.map((sub: any) => (
                                        <TouchableOpacity
                                            key={sub.id}
                                            className="w-[25%] p-2 items-center"
                                            onPress={() => handleSubcategoryPress(category, sub)}
                                        >
                                            <View className="w-[80px] h-[80px] mb-2 items-center justify-center bg-gray-50 rounded-xl overflow-hidden">
                                                {(() => {
                                                    const imageUrl = sub.image_url || sub.image || sub.icon;
                                                    let finalUri = null;
                                                    if (imageUrl) {
                                                        if (imageUrl.startsWith("http")) finalUri = imageUrl;
                                                        else {
                                                            const baseUrl = API_BASE_URL.replace("/api", "");
                                                            finalUri = `${baseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
                                                        }
                                                    }
                                                    return finalUri ? (
                                                        <Image
                                                            source={{ uri: finalUri }}
                                                            className="w-full h-full"
                                                            resizeMode="contain"
                                                        />
                                                    ) : (
                                                        <View className="w-full h-full bg-orange-50 items-center justify-center">
                                                            <Text className="text-[8px] text-orange-400 font-bold text-center px-1">{sub.name}</Text>
                                                        </View>
                                                    );
                                                })()}
                                            </View>
                                            <Text
                                                className="text-[10px] text-center text-gray-700 font-medium"
                                                numberOfLines={2}
                                            >
                                                {sub.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                            </View>
                        </View>
                    ))}
                    {categories.length === 0 && (
                        <View className="flex-1 items-center justify-center py-20">
                            <Text className="text-gray-400">No categories found</Text>
                        </View>
                    )}
                </View>
                <View className="h-20" />
            </ScrollView>
        </SafeAreaView>
    );
};

export default CategoriesScreen;
