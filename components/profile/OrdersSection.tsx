import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Image,
    Alert,
    TextInput,
    Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../constants/Config";
import { useRouter } from "expo-router";

// ----------------------------------------------------------------------
// Types & Helpers
// ----------------------------------------------------------------------

const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
        case "pending": return "text-yellow-600 bg-yellow-100 border-yellow-200";
        case "confirmed": return "text-blue-600 bg-blue-100 border-blue-200";
        case "shipped": return "text-purple-600 bg-purple-100 border-purple-200";
        case "delivered": return "text-green-600 bg-green-100 border-green-200";
        case "cancelled": return "text-red-600 bg-red-100 border-red-200";
        case "returned": return "text-orange-600 bg-orange-100 border-orange-200";
        case "approved": return "text-blue-600 bg-blue-100 border-blue-200";
        case "processing": return "text-purple-600 bg-purple-100 border-purple-200";
        case "completed": return "text-green-600 bg-green-100 border-green-200";
        case "rejected": return "text-red-600 bg-red-100 border-red-200";
        default: return "text-gray-600 bg-gray-100 border-gray-200";
    }
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
const OrdersSection = () => {
    const { currentUser, getAccessToken } = useAuth();
    const router = useRouter();

    // Fetch States
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Effects
    // ----------------------------------------------------------------------
    useEffect(() => {
        if (currentUser?.id) {
            fetchAllData();
        }
    }, [currentUser]);

    const fetchAllData = async () => {
        setLoading(true);
        await fetchOrders();
        setLoading(false);
    };

    // ----------------------------------------------------------------------
    // API Calls
    // ----------------------------------------------------------------------
    const fetchOrders = async () => {
        try {
            const token = await getAccessToken();
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/order/my-orders`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const result = await response.json();
                let fetchedOrders = [];
                if (result && Array.isArray(result)) fetchedOrders = result;
                else if (result && result.orders) fetchedOrders = result.orders;
                else if (result && result.success && result.orders) fetchedOrders = result.orders;
                else fetchedOrders = result.data || [];
                setOrders(fetchedOrders);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    };


    // ----------------------------------------------------------------------
    // Handlers
    // ----------------------------------------------------------------------
    const handleViewDetails = (order: any) => {
        router.push(`/orders/${order.id}`);
    };

    // ----------------------------------------------------------------------
    // Renderers
    // ----------------------------------------------------------------------
    if (!currentUser) {
        return (
            <View className="flex-1 items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-gray-100">
                <Ionicons name="cube-outline" size={64} color="#9ca3af" />
                <Text className="text-xl font-bold mt-4 text-gray-800">Login Required</Text>
                <Text className="text-gray-500 text-center mt-2">Please login to view your orders.</Text>
            </View>
        );
    }

    if (loading && orders.length === 0) {
        return (
            <View className="flex-1 justify-center items-center py-12">
                <ActivityIndicator size="large" color="#FF6B00" />
            </View>
        );
    }

    return (
        <View className="flex-1 w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <Text className="text-lg font-bold text-gray-900 mb-4">All Orders</Text>

            {/* List Views */}
            {orders.length > 0 ? (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
                    {orders.map((order) => (
                        <Pressable
                            key={order.id}
                            onPress={() => handleViewDetails(order)}
                            className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm active:bg-gray-50"
                        >
                            <View className="flex-row justify-between items-center mb-3">
                                <View>
                                    <Text className="font-bold text-gray-900">Order #{String(order.id).slice(-8).toUpperCase()}</Text>
                                    <Text className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</Text>
                                </View>
                                <View className={`px-2.5 py-1 rounded-md border ${getStatusColor(order.status)}`}>
                                    <Text className="text-[10px] font-bold uppercase">{order.status}</Text>
                                </View>
                            </View>
                            <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
                                <View>
                                    <Text className="text-xs text-gray-500 font-medium">
                                        {order.payment_method === 'cod' || order.payment_method === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
                                    </Text>
                                </View>
                                <Text className="text-lg font-bold text-[#FF6B00]">₹{order.total}</Text>
                            </View>
                        </Pressable>
                    ))}
                </ScrollView>
            ) : (
                <View className="flex-1 items-center justify-center p-8">
                    <Ionicons name="receipt-outline" size={64} color="#d1d5db" />
                    <Text className="text-lg font-semibold text-gray-800 mt-4">No orders yet</Text>
                    <Text className="text-gray-500 text-center mt-2">Looks like you haven&apos;t placed any orders yet.</Text>
                </View>
            )}
        </View>
    );
};


export default OrdersSection;
