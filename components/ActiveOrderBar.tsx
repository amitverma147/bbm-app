import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../constants/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ActiveOrderBar = ({ offset = 0 }: { offset?: number }) => {
    const { currentUser, isAuthenticated } = useAuth();
    const router = useRouter();
    const segments = useSegments();
    const [activeOrder, setActiveOrder] = useState<any>(null);
    const [slideAnim] = useState(new Animated.Value(100));

    useEffect(() => {
        if (isAuthenticated && currentUser) {
            fetchActiveOrder();
            const interval = setInterval(fetchActiveOrder, 30000); // Check every 30s
            return () => clearInterval(interval);
        } else {
            setActiveOrder(null);
            hideBar();
        }
    }, [isAuthenticated, currentUser]);

    const fetchActiveOrder = async () => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/order/user/${currentUser.id}?limit=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();
            if (result.success && result.orders?.length > 0) {
                const latest = result.orders[0];
                // Only show if status is not Delivered or Cancelled
                const activeStatuses = ['pending', 'confirmed', 'processing', 'shipped'];
                if (activeStatuses.includes(latest.status?.toLowerCase())) {
                    setActiveOrder(latest);
                    showBar();
                } else {
                    setActiveOrder(null);
                    hideBar();
                }
            } else {
                setActiveOrder(null);
                hideBar();
            }
        } catch (error) {
            console.log("Error fetching active order for bar:", error);
        }
    };

    const showBar = () => {
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7
        }).start();
    };

    const hideBar = () => {
        Animated.timing(slideAnim, {
            toValue: 200,
            duration: 300,
            useNativeDriver: true
        }).start();
    };

    // Only show on the landing page (index)
    const currentSegments = segments as any;
    const isLandingPage = currentSegments.length === 1 && currentSegments[0] === '(tabs)' || (currentSegments.length === 2 && currentSegments[0] === '(tabs)' && currentSegments[1] === 'index');

    if (!activeOrder || !isLandingPage) return null;

    const getStatusInfo = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pending': return { text: 'Order Received', icon: 'clock-outline', color: '#F59E0B' };
            case 'confirmed': return { text: 'Order Confirmed', icon: 'check-circle-outline', color: '#10B981' };
            case 'processing': return { text: 'Preparing Order', icon: 'silverware-fork-knife', color: '#3B82F6' };
            case 'shipped': return { text: 'Out for Delivery', icon: 'truck-delivery', color: '#9333EA' };
            default: return { text: status, icon: 'package-variant', color: '#4B5563' };
        }
    };

    const statusInfo = getStatusInfo(activeOrder.status);

    return (
        <Animated.View
            style={{
                transform: [{ translateY: slideAnim }],
                bottom: 80 + offset,
                marginBottom: 10
            }}
            className="absolute left-0 right-0 z-50 px-4"
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push(`/orders/${activeOrder.id || activeOrder._id}` as any)}
                className="bg-white rounded-2xl flex-row items-center p-3 shadow-xl border border-gray-100 mb-2"
            >
                <View className="bg-orange-50 p-2 rounded-xl mr-3">
                    <MaterialCommunityIcons name={statusInfo.icon as any} size={24} color="#FD5B00" />
                </View>

                <View className="flex-1">
                    <Text className="text-gray-900 font-bold text-sm">
                        {statusInfo.text}
                    </Text>
                    <Text className="text-gray-500 text-xs">
                        #{String(activeOrder.order_id || activeOrder.id || activeOrder._id || '').slice(-8).toUpperCase()} • Tracking active
                    </Text>
                </View>

                <View className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-full">
                    <Text className="text-orange-600 font-bold text-xs mr-1">TRACK</Text>
                    <Feather name="arrow-right" size={12} color="#FD5B00" />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default ActiveOrderBar;
