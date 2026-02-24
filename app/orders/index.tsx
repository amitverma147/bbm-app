import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../constants/Config';
import { useAuth } from '../../contexts/AuthContext';

const OrdersScreen = () => {
    const router = useRouter();
    const { currentUser } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'Tracking' | 'History'>('Tracking');

    const fetchOrders = async () => {
        try {
            if (!currentUser?.id) return;

            const token = await AsyncStorage.getItem('auth_token');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/order/user/${currentUser.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();
            if (result.success) {
                setOrders(result.orders || []);
            } else {
                console.log("Failed to fetch orders:", result.error || result.message);
                setOrders([]);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
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
            onPress={() => router.push(`/orders/${item.id || item._id}` as any)}
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
                <Text className="text-base font-bold text-gray-900">₹{item.total}</Text>
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

            <View className="flex-row bg-white px-4 border-b border-gray-100">
                {['Tracking', 'History'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab as any)}
                        className={`flex-1 py-4 items-center ${activeTab === tab ? 'border-b-2 border-orange-600' : ''}`}
                    >
                        <Text className={`font-bold ${activeTab === tab ? 'text-orange-600' : 'text-gray-400'}`}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#EA580C" />
                </View>
            ) : (
                <FlatList
                    data={orders.filter(o =>
                        activeTab === 'Tracking' ? ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status?.toLowerCase()) :
                            ['delivered', 'cancelled', 'returned'].includes(o.status?.toLowerCase())
                    )}
                    renderItem={renderOrderItem}
                    keyExtractor={(item) => item.id || item._id}
                    contentContainerStyle={{ paddingVertical: 16 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EA580C']} />
                    }
                    ListEmptyComponent={
                        <View className="flex-1 justify-center items-center pt-20">
                            <Feather name="package" size={48} color="#D1D5DB" />
                            <Text className="text-gray-500 mt-4 font-medium px-10 text-center">No orders found in {activeTab}</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

export default OrdersScreen;
