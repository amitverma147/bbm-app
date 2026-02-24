import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useCart } from '../contexts/CartContext';

const FloatingCartBar = ({ offset = 0 }: { offset?: number }) => {
    const { getCartTotal, getTotalItems } = useCart();
    const router = useRouter();
    const segments = useSegments();
    const [slideAnim] = useState(new Animated.Value(200));

    const totalItems = getTotalItems();
    const cartTotal = getCartTotal();

    // Hide if on cart or checkout pages
    const isCartPage = (segments as any).includes('cart') || (segments as any).includes('checkout');

    useEffect(() => {
        if (totalItems > 0 && !isCartPage) {
            showBar();
        } else {
            hideBar();
        }
    }, [totalItems, isCartPage]);

    const showBar = () => {
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8
        }).start();
    };

    const hideBar = () => {
        Animated.timing(slideAnim, {
            toValue: 200,
            duration: 300,
            useNativeDriver: true
        }).start();
    };

    if (totalItems === 0) return null;

    return (
        <Animated.View
            style={{
                transform: [{ translateY: slideAnim }],
                bottom: 80 + offset // Base offset to sit above tabs
            }}
            className="absolute left-0 right-0 z-[60] px-4"
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push('/tracking/dummy')}
                className="bg-[#22c55e] rounded-2xl flex-row items-center justify-between px-5 py-3.5 shadow-2xl border border-green-400"
            >
                <View className="flex-row items-center">
                    <View className="bg-white/20 p-1.5 rounded-lg mr-3">
                        <Feather name="shopping-cart" size={18} color="white" />
                    </View>
                    <View>
                        <Text className="text-white font-black text-xs uppercase tracking-tight">
                            {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
                        </Text>
                        <Text className="text-white font-black text-lg -mt-1">
                            ₹{cartTotal.toFixed(2)}
                        </Text>
                    </View>
                </View>

                <View className="flex-row items-center bg-white/20 px-4 py-2 rounded-xl">
                    <Text className="text-white font-black text-sm mr-1">TRACK RIDER</Text>
                    <Ionicons name="map" size={16} color="white" />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default FloatingCartBar;
