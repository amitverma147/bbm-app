import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../constants/Config";

const TrackOrderSection = () => {
    const { currentUser, getAccessToken } = useAuth();
    const [orderId, setOrderId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [trackingData, setTrackingData] = useState<any>(null);
    const [userOrders, setUserOrders] = useState<any[]>([]);

    useEffect(() => {
        if (currentUser?.id) {
            fetchUserOrders();
        }
    }, [currentUser]);

    const fetchUserOrders = async () => {
        try {
            setLoading(true);
            const token = await getAccessToken();
            if (!token) {
                setUserOrders([]);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/order/my-orders`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setUserOrders(data.orders || []);
            }
        } catch (err) {
            console.error("Error fetching user orders:", err);
            setUserOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleTrackOrder = async () => {
        if (!orderId.trim()) {
            setError("Please enter an order ID");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setTrackingData(null);

            const response = await fetch(`${API_BASE_URL}/tracking/order/${orderId}`, {
                headers: { "Content-Type": "application/json" },
            });

            const data = await response.json();
            if (data.success) {
                setTrackingData(data);
            } else {
                setError("Order not found or tracking unavailable");
            }
        } catch (err) {
            console.error("Error tracking order:", err);
            setError("Order not found. Please check the order ID.");
        } finally {
            setLoading(false);
        }
    };

    const handleOrderClick = async (order: any) => {
        setOrderId(order.id);
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_BASE_URL}/tracking/order/${order.id}`, {
                headers: { "Content-Type": "application/json" },
            });

            const data = await response.json();
            if (data.success) {
                setTrackingData(data);
            } else {
                setError("Failed to fetch tracking details");
            }
        } catch (err) {
            console.error("Error fetching tracking:", err);
            setError("Failed to load tracking information");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case "pending": return "text-orange-600 bg-orange-100 border-orange-300";
            case "confirmed": return "text-blue-600 bg-blue-100 border-blue-300";
            case "shipped": return "text-purple-600 bg-purple-100 border-purple-300";
            case "delivered": return "text-green-600 bg-green-100 border-green-300";
            case "cancelled": return "text-red-600 bg-red-100 border-red-300";
            default: return "text-gray-600 bg-gray-100 border-gray-300";
        }
    };

    const getJourneySteps = (status: string) => {
        const allSteps = [
            { id: "pending", label: "Pending", icon: "time-outline" as any },
            { id: "confirmed", label: "Confirmed", icon: "checkmark-circle-outline" as any },
            { id: "processing", label: "Processing", icon: "settings-outline" as any },
            { id: "shipped", label: "Shipped", icon: "car-outline" as any },
            { id: "delivered", label: "Delivered", icon: "cube-outline" as any },
        ];

        const statusOrder = ["pending", "confirmed", "processing", "shipped", "delivered"];
        const currentIndex = statusOrder.indexOf(status?.toLowerCase() || "");

        return allSteps.map((step, index) => ({
            ...step,
            isActive: index === currentIndex,
            isCompleted: index < currentIndex,
        }));
    };

    if (!currentUser) {
        return (
            <View className="flex-1 items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-gray-100">
                <Ionicons name="car-outline" size={64} color="#9ca3af" />
                <Text className="text-xl font-bold mt-4 text-gray-800">Login Required</Text>
                <Text className="text-gray-500 text-center mt-2">Please login to track your orders</Text>
            </View>
        );
    }

    return (
        <View className="flex-1">
            {trackingData ? (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
                    {/* Order Info Card */}
                    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
                        <View className="flex-row items-start justify-between mb-4">
                            <View>
                                <Text className="text-lg font-bold text-gray-900">Order Details</Text>
                                <Text className="text-xs text-gray-500">#{trackingData.order?.id?.substring(0, 10)}</Text>
                            </View>
                            <View className={`px-2 py-1 rounded border ${getStatusColor(trackingData.order?.status)}`}>
                                <Text className="text-[10px] font-bold uppercase">{trackingData.order?.status}</Text>
                            </View>
                        </View>

                        <View className="mb-4">
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-gray-600">Placed on</Text>
                                <Text className="font-semibold text-gray-900">{new Date(trackingData.order?.created_at).toLocaleDateString()}</Text>
                            </View>
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-gray-600">Total Amount</Text>
                                <Text className="font-bold text-[#FF6B00]">₹{trackingData.order?.total}</Text>
                            </View>
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-gray-600">Payment Mode</Text>
                                <Text className="font-semibold text-gray-900 uppercase">
                                    {trackingData.order?.payment_method === "cod" || trackingData.order?.payment_method === "COD" ? "Cash on Delivery" : "Online"}
                                </Text>
                            </View>
                        </View>

                        <View className="border-t border-gray-100 pt-4">
                            <Text className="font-semibold text-gray-900 mb-3">Order Items ({trackingData.order?.order_items?.length || 0})</Text>
                            {trackingData.order?.order_items?.map((item: any, index: number) => {
                                const variantTitle = item.variant?.title;
                                const prodName = item.product?.name || item.product_name || "Product";
                                const name = variantTitle && variantTitle !== 'Default' ? `${prodName} (${variantTitle})` : prodName;
                                const img = item.variant?.media?.[0]?.url || item.product?.image || item.image || item.product_image;

                                return (
                                    <View key={index} className="flex-row py-2 justify-between items-center border-b border-gray-50 last:border-b-0">
                                        <View className="flex-row items-center flex-1">
                                            {img ? (
                                                <Image source={{ uri: img }} className="w-10 h-10 rounded-md bg-gray-100 mr-3" resizeMode="cover" />
                                            ) : (
                                                <View className="w-10 h-10 rounded-md bg-gray-100 mr-3 items-center justify-center">
                                                    <Ionicons name="cube-outline" size={16} color="#9ca3af" />
                                                </View>
                                            )}
                                            <View className="flex-1 pr-2">
                                                <Text className="font-medium text-gray-900 text-xs" numberOfLines={1}>{name}</Text>
                                                <Text className="text-[10px] text-gray-500">Qty: {item.quantity}</Text>
                                            </View>
                                        </View>
                                        <Text className="font-semibold text-gray-900">₹{item.price}</Text>
                                    </View>
                                )
                            })}
                        </View>
                    </View>

                    {/* Journey Steps Card */}
                    <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
                        <Text className="text-lg font-bold text-gray-900 mb-6">Order Journey</Text>
                        <View>
                            {getJourneySteps(trackingData.order?.status).map((step, index, arr) => (
                                <View key={step.id} className="flex-row gap-4">
                                    <View className="items-center">
                                        <View className={`w-10 h-10 rounded-full items-center justify-center border-2 ${step.isActive ? "bg-[#FF6B00] border-[#FF6B00]" :
                                                step.isCompleted ? "bg-gray-200 border-gray-300" : "bg-white border-gray-300"
                                            }`}>
                                            <Ionicons name={step.icon} size={20} color={step.isActive ? "white" : step.isCompleted ? "#6b7280" : "#9ca3af"} />
                                        </View>
                                        {index < arr.length - 1 && (
                                            <View className={`w-0.5 h-10 ${step.isCompleted ? "bg-gray-300" : "bg-gray-200"}`} />
                                        )}
                                    </View>
                                    <View className="flex-1 pt-2 pb-6">
                                        <Text className={`font-semibold ${step.isActive ? "text-gray-900" : "text-gray-500"}`}>{step.label}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity onPress={() => { setTrackingData(null); setOrderId(""); }} className="mb-8 p-3 flex-row items-center justify-center">
                        <Ionicons name="arrow-back" size={16} color="#FF6B00" />
                        <Text className="text-[#FF6B00] font-bold ml-2">Back to Orders</Text>
                    </TouchableOpacity>
                </ScrollView>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
                    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
                        <Text className="text-lg font-bold text-gray-900 mb-2">Track by ID</Text>
                        <View className="flex-row border border-gray-300 rounded-lg overflow-hidden bg-gray-50 h-12">
                            <TextInput
                                className="flex-1 px-4 text-gray-800"
                                placeholder="Enter Order ID"
                                value={orderId}
                                onChangeText={setOrderId}
                            />
                            <TouchableOpacity onPress={handleTrackOrder} className="bg-[#FF6B00] px-6 justify-center items-center">
                                {loading ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white font-bold">Track</Text>}
                            </TouchableOpacity>
                        </View>
                        {error && <Text className="text-red-500 text-xs mt-2">{error}</Text>}
                    </View>

                    {userOrders.length > 0 ? (
                        <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                            <Text className="text-lg font-bold text-gray-900 mb-2">Your Orders</Text>
                            <Text className="text-sm text-gray-500 mb-4">Tap an order to track</Text>
                            <View>
                                {userOrders.map((order) => (
                                    <TouchableOpacity
                                        key={order.id}
                                        onPress={() => handleOrderClick(order)}
                                        className="border border-gray-200 rounded-lg p-3 mb-3"
                                    >
                                        <View className="flex-row justify-between items-center mb-2">
                                            <Text className="font-semibold text-gray-900 text-xs">Order #{order.id?.substring(0, 10)}</Text>
                                            <View className={`px-2 py-0.5 rounded border ${getStatusColor(order.status)}`}>
                                                <Text className="text-[9px] font-bold uppercase">{order.status}</Text>
                                            </View>
                                        </View>
                                        <View className="flex-row justify-between items-center pt-2 border-t border-gray-100">
                                            <Text className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</Text>
                                            <Text className="font-bold text-[#FF6B00] text-sm">₹{order.total}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ) : !loading && (
                        <View className="bg-white rounded-xl p-8 items-center border border-gray-200 shadow-sm mt-4">
                            <Ionicons name="cube-outline" size={48} color="#d1d5db" />
                            <Text className="font-semibold text-gray-800 mt-2">No active orders</Text>
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
};

export default TrackOrderSection;
