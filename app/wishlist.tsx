import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useCart } from '../contexts/CartContext';
import { getWishlist, removeFromWishlist } from '../services/wishlistService';

const WishlistScreen = () => {
    const router = useRouter();
    const { addToCart } = useCart();
    const [wishlistItems, setWishlistItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchWishlist = useCallback(async () => {
        try {
            const result = await getWishlist();
            if (result.success) {
                setWishlistItems(result.wishlist || []);
            } else {
                console.log("Fetch wishlist failed:", result.error);
            }
        } catch (error) {
            console.error("Error fetching wishlist:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchWishlist();
    };

    const handleRemove = async (productId: string) => {
        Alert.alert("Remove", "Remove this item from wishlist?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Remove", style: 'destructive',
                onPress: async () => {
                    try {
                        const result = await removeFromWishlist(productId);
                        if (result.success) {
                            setWishlistItems(prev => prev.filter(item => item.product_id !== productId));
                        } else {
                            Alert.alert("Error", result.error || "Failed to remove item");
                        }
                    } catch (error) {
                        Alert.alert("Error", "Failed to remove item");
                    }
                }
            }
        ]);
    };

    const handleAddToCart = async (item: any) => {
        const product = item.product || item;
        const cartItem = {
            id: product.id,
            name: product.name,
            price: Number(product.price),
            image: product.image || '',
            quantity: 1,
        };
        await addToCart(cartItem);

        // Optionally remove from wishlist after adding to cart
        try {
            await removeFromWishlist(product.id);
            setWishlistItems(prev => prev.filter(w => w.product_id !== product.id));
        } catch (e) {
            // Ignore - item added to cart even if wishlist removal fails
        }

        Alert.alert("Added to Cart", `${product.name} has been added to your cart.`);
    };

    const handleNavigateToProduct = (productId: string) => {
        router.push(`/product/${productId}` as any);
    };

    const renderItem = ({ item }: { item: any }) => {
        const product = item.product || item;
        const productImage = product.image || product.media?.[0]?.url || null;
        const productName = product.name || 'Product';
        const productPrice = product.price;
        const oldPrice = product.old_price;
        const productWeight = product.weight || product.uom || '';

        return (
            <TouchableOpacity
                onPress={() => handleNavigateToProduct(product.id)}
                activeOpacity={0.7}
                className="flex-row bg-white p-4 mb-3 mx-4 rounded-2xl border border-gray-100 shadow-sm"
            >
                <View className="w-20 h-20 bg-gray-50 rounded-xl mr-4 items-center justify-center overflow-hidden border border-gray-100">
                    {productImage ? (
                        <Image source={{ uri: productImage }} className="w-full h-full rounded-xl" resizeMode="contain" />
                    ) : (
                        <View className="w-full h-full items-center justify-center bg-gray-50">
                            <Feather name="image" size={24} color="#D1D5DB" />
                        </View>
                    )}
                </View>
                <View className="flex-1 justify-between">
                    <View>
                        <Text className="text-sm font-bold text-gray-900" numberOfLines={2}>{productName}</Text>
                        {productWeight ? (
                            <Text className="text-xs text-gray-400 mt-0.5">{productWeight}</Text>
                        ) : null}
                        <View className="flex-row items-center mt-1">
                            <Text className="text-orange-600 font-bold text-base">₹{productPrice}</Text>
                            {oldPrice && Number(oldPrice) > Number(productPrice) && (
                                <Text className="text-gray-400 text-xs line-through ml-2">₹{oldPrice}</Text>
                            )}
                        </View>
                    </View>
                    <View className="flex-row justify-between items-center mt-2">
                        <TouchableOpacity
                            onPress={() => handleAddToCart(item)}
                            className="bg-orange-50 px-4 py-2 rounded-xl flex-row items-center border border-orange-100"
                        >
                            <Feather name="shopping-cart" size={14} color="#EA580C" />
                            <Text className="text-orange-700 text-xs font-bold ml-1.5">Add to Cart</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleRemove(item.product_id || product.id)} className="p-2 bg-red-50 rounded-xl">
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-white">
            <SafeAreaView edges={["top"]} className="bg-white flex-1">
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="mr-3 w-10 h-10 rounded-full bg-gray-50 items-center justify-center border border-gray-100"
                        >
                            <Ionicons name="chevron-back" size={24} color="#1F2937" />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-xl font-bold text-gray-900">My Wishlist</Text>
                            {wishlistItems.length > 0 && (
                                <Text className="text-xs text-gray-400">{wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}</Text>
                            )}
                        </View>
                    </View>
                </View>

                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#EA580C" />
                        <Text className="text-gray-400 mt-3 text-sm">Loading wishlist...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={wishlistItems}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id || item.product_id || Math.random().toString()}
                        contentContainerStyle={{ paddingVertical: 16, paddingBottom: 100 }}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#EA580C']}
                            />
                        }
                        ListEmptyComponent={
                            <View className="items-center justify-center py-20 px-10">
                                <View className="w-24 h-24 bg-orange-50 rounded-full items-center justify-center mb-5">
                                    <Feather name="heart" size={40} color="#FDBA74" />
                                </View>
                                <Text className="text-xl font-bold text-gray-900 mb-2">Your wishlist is empty</Text>
                                <Text className="text-gray-400 text-center mb-8 leading-5">
                                    Save items you love here to buy them later.
                                </Text>
                                <TouchableOpacity
                                    onPress={() => router.push('/(tabs)')}
                                    className="bg-gray-900 px-8 py-3.5 rounded-2xl shadow-lg shadow-gray-400 active:scale-95"
                                >
                                    <Text className="text-white font-bold text-sm">Start Exploring</Text>
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
