import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/Config';
import { useAuth } from '../contexts/AuthContext';

const OrdersScreen = () => {
    const router = useRouter();
    const { currentUser } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = async () => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (!token) {
                // Should be handled by protected route, but double check
                return;
            }

            // Using dummy endpoint for now based on typical structure, check backend if needed
            // Assuming GET /orders or GET /user/orders
            const response = await fetch(`${API_BASE_URL}/orders`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();
            if (result.success) {
                setOrders(result.data || []);
            } else {
                // If API not ready, we might want to show empty or mock
                console.log("Failed to fetch orders or no orders:", result.message);
                setOrders([]);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            Alert.alert("Error", "Failed to load orders");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const renderOrderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            className="bg-white mx-4 mb-4 p-4 rounded-2xl border border-gray-100 shadow-sm"
            onPress={() => router.push(`/orders/${item._id}` as any)}
        >
            <View className="flex-row justify-between items-start mb-3">
                <View>
                    <Text className="text-xs text-gray-500 font-medium mb-1">ORDER ID: {item.order_id || item._id?.toString().slice(-8).toUpperCase()}</Text>
                    <Text className="text-sm font-bold text-gray-900">{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${item.status === 'Delivered' ? 'bg-green-100' :
                        item.status === 'Cancelled' ? 'bg-red-100' : 'bg-orange-100'
                    }`}>
                    <Text className={`text-xs font-bold ${item.status === 'Delivered' ? 'text-green-700' :
                            item.status === 'Cancelled' ? 'text-red-700' : 'text-orange-700'
                        }`}>{item.status}</Text>
                </View>
            </View>

            <View className="border-t border-gray-100 py-3 flex-row items-center">
                <View className="bg-gray-50 p-2 rounded-lg mr-3">
                    <Feather name="package" size={20} color="#4B5563" />
                </View>
                <View className="flex-1">
                    <Text className="text-gray-900 font-medium" numberOfLines={1}>
                        {item.items?.length || 0} Items
                    </Text>
                    <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>
                        {item.items?.map((i: any) => i.product_name).join(', ')}
                    </Text>
                </View>
                <Text className="text-base font-bold text-gray-900">₹{item.total_amount}</Text>
            </View>

            <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-dashed border-gray-100">
                <Text className="text-xs text-gray-500">Tap to view details</Text>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <SafeAreaView edges={["top"]} className="bg-white z-10">
                <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-full border border-gray-100 items-center justify-center mr-3 bg-gray-50 active:bg-gray-200"
                    >
                        <Ionicons name="chevron-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-900 tracking-tight">
                        Your Orders
                    </Text>
                </View>
            </SafeAreaView>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#EA580C" />
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{ paddingVertical: 20, paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#EA580C"]} />
                    }
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20 px-10">
                            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                                <Feather name="shopping-bag" size={32} color="#9CA3AF" />
                            </View>
                            <Text className="text-lg font-bold text-gray-900 mb-2">No orders yet</Text>
                            <Text className="text-gray-500 text-center leading-5 mb-6">
                                Looks like you haven't placed any orders yet. Start shopping now!
                            </Text>
                            <TouchableOpacity
                                onPress={() => router.push('/')}
                                className="bg-orange-600 px-6 py-3 rounded-xl shadow-lg shadow-orange-200"
                            >
                                <Text className="text-white font-bold">Start Shopping</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </View>
    );
};

export default OrdersScreen;
