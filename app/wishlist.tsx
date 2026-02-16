import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/Config';
import { useCart } from '../contexts/CartContext';

const WishlistScreen = () => {
    const router = useRouter();
    const { addToCart } = useCart();
    const [wishlistItems, setWishlistItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchWishlist = async () => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (!token) return;

            // Assuming GET /wishlist endpoint exists
            const response = await fetch(`${API_BASE_URL}/wishlist`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setWishlistItems(result.data || []);
            } else {
                // For now, if endpoint fails, just show empty
                console.log("Fetch wishlist failed:", result.message);
            }
        } catch (error) {
            console.error("Error fetching wishlist:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWishlist();
    }, []);

    const handleRemove = async (id: string) => {
        // Implement remove logic
        Alert.alert("Remove", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Remove", style: 'destructive',
                onPress: async () => {
                    try {
                        const token = await AsyncStorage.getItem('auth_token');
                        await fetch(`${API_BASE_URL}/wishlist/${id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        setWishlistItems(prev => prev.filter(item => item._id !== id));
                    } catch (error) {
                        Alert.alert("Error", "Failed to remove item");
                    }
                }
            }
        ]);
    };

    const handleAddToCart = (item: any) => {
        addToCart(item); // Adjust if item structure differs
        Alert.alert("Success", "Added to cart!");
    };

    const renderItem = ({ item }: { item: any }) => (
        <View className="flex-row bg-white p-4 mb-3 mx-4 rounded-xl border border-gray-100 shadow-sm">
            <View className="w-20 h-20 bg-gray-50 rounded-lg mr-4 items-center justify-center">
                {item.image ? (
                    <Image source={{ uri: item.image }} className="w-full h-full rounded-lg" resizeMode="contain" />
                ) : (
                    <Feather name="image" size={24} color="#9CA3AF" />
                )}
            </View>
            <View className="flex-1 justify-between">
                <View>
                    <Text className="text-sm font-bold text-gray-900" numberOfLines={2}>{item.name}</Text>
                    <Text className="text-orange-600 font-bold mt-1">₹{item.price}</Text>
                </View>
                <View className="flex-row justify-between items-center mt-2">
                    <TouchableOpacity onPress={() => handleAddToCart(item)} className="bg-orange-50 px-3 py-1.5 rounded-lg">
                        <Text className="text-orange-700 text-xs font-bold">Add to Cart</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRemove(item._id)} className="p-2">
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-white">
            <SafeAreaView edges={["top"]} className="bg-white flex-1">
                <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3 w-10 h-10 rounded-full bg-gray-50 items-center justify-center border border-gray-100">
                        <Ionicons name="chevron-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-900">My Wishlist</Text>
                </View>

                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#EA580C" />
                    </View>
                ) : (
                    <FlatList
                        data={wishlistItems}
                        renderItem={renderItem}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={{ paddingVertical: 20 }}
                        ListEmptyComponent={
                            <View className="items-center justify-center py-20 px-10">
                                <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-4">
                                    <Feather name="heart" size={32} color="#D1D5DB" />
                                </View>
                                <Text className="text-lg font-bold text-gray-900 mb-2">Your wishlist is empty</Text>
                                <Text className="text-gray-500 text-center mb-6">Save items you love here to buy them later.</Text>
                                <TouchableOpacity onPress={() => router.push('/')} className="bg-gray-900 px-6 py-3 rounded-xl">
                                    <Text className="text-white font-bold">Start Exploring</Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    );
};

export default WishlistScreen;
