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
import OrderActionModal from "./OrderActionModal";

// ----------------------------------------------------------------------
// Types & Helpers
// ----------------------------------------------------------------------
type TabType = "history" | "returns";

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

    // UI Tabs
    const [activeTab, setActiveTab] = useState<TabType>("history");

    // Fetch States
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Returns & Refunds
    const [returnRequests, setReturnRequests] = useState<any[]>([]);
    const [refundRequests, setRefundRequests] = useState<any[]>([]);

    // Detail States
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [orderDetails, setOrderDetails] = useState<any>(null);
    const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);

    // Modal Form States
    const [modalVisible, setModalVisible] = useState(false);
    const [modalAction, setModalAction] = useState<"track" | "cancel" | "return" | null>(null);

    const [eligibility, setEligibility] = useState<any>(null);
    const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
    const [orderItems, setOrderItems] = useState<any[]>([]);

    // Effects
    // ----------------------------------------------------------------------
    useEffect(() => {
        if (currentUser?.id) {
            fetchAllData();
        }
    }, [currentUser]);

    const fetchAllData = async () => {
        setLoading(true);
        await Promise.all([
            fetchOrders(),
            fetchReturnRequests(),
            fetchRefundRequests()
        ]);
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

    const fetchReturnRequests = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/return-orders/user/${currentUser?.id}`);
            if (response.ok) {
                const data = await response.json();
                setReturnRequests(data.return_requests || []);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchRefundRequests = async () => {
        try {
            const token = await getAccessToken();
            const response = await fetch(`${API_BASE_URL}/refund/my-requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setRefundRequests(data.refundRequests || []);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // ----------------------------------------------------------------------
    // Handlers
    // ----------------------------------------------------------------------
    const handleViewDetails = async (order: any) => {
        setSelectedOrder(order);
        setLoadingOrderDetails(true);
        setOrderDetails(null);
        setEligibility(null);
        setModalVisible(false);

        try {
            const token = await getAccessToken();
            const response = await fetch(`${API_BASE_URL}/order/${order.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.order) {
                    setOrderDetails(result.order);
                    if (result.order.order_items) {
                        const items = result.order.order_items.map((item: any) => ({
                            order_item_id: item.id,
                            product_name: item.variant?.title || item.product?.name || item.product_name || "Product",
                            quantity: item.quantity,
                            price: item.price,
                            selected: false,
                            return_quantity: item.quantity,
                        }));
                        setOrderItems(items);
                    }
                }
            }
        } catch (err) {
            console.error("Error fetching order details:", err);
        } finally {
            setLoadingOrderDetails(false);
        }
    };

    const openModal = (action: "track" | "cancel" | "return") => {
        setModalAction(action);
        setModalVisible(true);
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

    // ----------------- SUB-VIEW: Order Details & Returns -----------------
    if (selectedOrder) {
        return (
            <View className="bg-white flex-1 p-4 rounded-xl shadow-sm border border-gray-100">
                {/* Header */}
                <View className="flex-row items-center border-b border-gray-100 pb-4 mb-4">
                    <TouchableOpacity onPress={() => {
                        setSelectedOrder(null);
                    }} className="p-2 -ml-2 rounded-full">
                        <Ionicons name="arrow-back" size={24} color="#4b5563" />
                    </TouchableOpacity>
                    <View className="flex-1 ml-2">
                        <Text className="text-lg font-bold text-gray-900">
                            Order #{String(selectedOrder.id).slice(-8).toUpperCase()}
                        </Text>
                        <Text className="text-sm text-gray-500">
                            {new Date(selectedOrder.created_at).toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                {loadingOrderDetails ? (
                    <View className="py-12 items-center justify-center">
                        <ActivityIndicator size="large" color="#FF6B00" />
                    </View>
                ) : orderDetails ? (
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View className={`p-4 rounded-xl flex-row items-center justify-between mb-4 border ${getStatusColor(orderDetails.status)}`}>
                            <View className="flex-row items-center">
                                <Ionicons name={orderDetails.status === 'delivered' ? 'checkmark-circle' : 'time'} size={24} color="inherit" style={{ opacity: 0.8 }} />
                                <Text className="font-bold text-lg capitalize ml-2">{orderDetails.status}</Text>
                            </View>

                            {(orderDetails.status === 'delivered' || orderDetails.status === 'pending') && (
                                <View className="flex-row gap-2">
                                    <TouchableOpacity
                                        onPress={() => openModal('track')}
                                        className="bg-white/70 px-3 py-1.5 rounded-lg border border-white/80"
                                    >
                                        <Text className="font-bold text-xs">Track</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => openModal(orderDetails.status === 'delivered' ? 'return' : 'cancel')}
                                        className="bg-white/50 px-3 py-1.5 rounded-lg border border-white/60"
                                    >
                                        <Text className="font-bold text-xs">{orderDetails.status === 'delivered' ? 'Return' : 'Cancel'}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* More Order Data details inspired by Web */}
                        <View className="mb-6 mx-2 border-l-2 border-orange-100 pl-4">
                            <Text className="text-gray-500 text-xs mb-1">Receiver</Text>
                            <Text className="font-semibold text-gray-900 mb-2">{orderDetails.receiver_name || currentUser.name}, {orderDetails.mobile || currentUser.phone}</Text>

                            <Text className="text-gray-500 text-xs mb-1">Address</Text>
                            <Text className="font-semibold text-gray-900 mb-2">{orderDetails.address || "Address unavailable"}</Text>

                            <Text className="text-gray-500 text-xs mb-1">Payment</Text>
                            <Text className="font-bold text-gray-900 uppercase">
                                {orderDetails.payment_method === "cod" || orderDetails.payment_method === "COD" ? "Cash on Delivery" : orderDetails.payment_method?.replace(/_/g, " ")}
                            </Text>
                        </View>

                        <Text className="font-bold text-gray-900 mb-3">{orderDetails.order_items?.length || 0} Items</Text>
                        <View className="bg-gray-50 rounded-xl p-3 mb-6 border border-gray-100">
                            {orderDetails.order_items?.map((item: any, idx: number) => {
                                const variantTitle = item.variant?.title;
                                const prodName = item.product?.name || item.product_name || "Product";
                                const name = variantTitle ? `${prodName} (${variantTitle})` : prodName;
                                const img = item.variant?.media?.[0]?.url || item.product?.image || item.image;

                                return (
                                    <View key={idx} className="flex-row py-3 items-center border-b border-gray-200 last:border-b-0">
                                        <View className="w-14 h-14 bg-white rounded-lg border border-gray-200 overflow-hidden ml-1 mr-3 justify-center items-center">
                                            {img ? (
                                                <Image source={{ uri: img }} className="w-full h-full" resizeMode="cover" />
                                            ) : (
                                                <Ionicons name="cube-outline" size={24} color="#d1d5db" />
                                            )}
                                        </View>
                                        <View className="flex-1">
                                            <Text className="font-semibold text-gray-900 text-sm" numberOfLines={2}>{name}</Text>
                                            <Text className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</Text>
                                        </View>
                                        <View className="items-end pl-2">
                                            <Text className="font-bold text-gray-900">₹{item.price}</Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

                        <Text className="font-bold text-gray-900 mb-3">Bill Summary</Text>
                        <View className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6">
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-gray-600">Item Total</Text>
                                <Text className="font-semibold text-gray-900">₹{orderDetails.subtotal}</Text>
                            </View>
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-gray-600">Handling Fee</Text>
                                <Text className="font-semibold text-gray-900">₹{orderDetails.handling_charge || 0}</Text>
                            </View>
                            {Number(orderDetails.shipping) > 0 && (
                                <View className="flex-row justify-between mb-2">
                                    <Text className="text-gray-600">Delivery Fee</Text>
                                    <Text className="font-semibold text-gray-900">₹{orderDetails.shipping}</Text>
                                </View>
                            )}
                            {Number(orderDetails.coupon_discount) > 0 && (
                                <View className="flex-row justify-between mb-2">
                                    <Text className="text-green-600">Discount</Text>
                                    <Text className="font-semibold text-green-600">- ₹{orderDetails.coupon_discount}</Text>
                                </View>
                            )}
                            <View className="border-t border-gray-200 my-2 pt-2 flex-row justify-between items-center">
                                <Text className="font-bold text-gray-900">Total Bill</Text>
                                <Text className="font-bold text-lg text-gray-900">₹{orderDetails.total}</Text>
                            </View>
                        </View>
                    </ScrollView>
                ) : (
                    <Text className="text-center text-gray-500 mt-10">Order details not available</Text>
                )}
            </View>
        );
    }

    // ----------------- MAIN VIEW -----------------
    return (
        <View className="flex-1 w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            {/* Top Sub-tabs */}
            <View className="flex-row mb-4 bg-gray-100 rounded-lg p-1">
                <TouchableOpacity
                    onPress={() => setActiveTab("history")}
                    className={`flex-1 py-1.5 rounded-md items-center ${activeTab === 'history' ? 'bg-white shadow-sm' : ''}`}
                >
                    <Text className={`font-bold text-xs ${activeTab === 'history' ? 'text-gray-900' : 'text-gray-500'}`}>All Orders</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab("returns")}
                    className={`flex-1 py-1.5 rounded-md items-center ${activeTab === 'returns' ? 'bg-white shadow-sm' : ''}`}
                >
                    <Text className={`font-bold text-xs ${activeTab === 'returns' ? 'text-gray-900' : 'text-gray-500'}`}>Returns & Refunds</Text>
                </TouchableOpacity>
            </View>

            {/* List Views */}
            {activeTab === "history" && (
                orders.length > 0 ? (
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
                )
            )}

            {activeTab === "returns" && (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
                    {returnRequests.length === 0 && refundRequests.length === 0 && (
                        <View className="items-center justify-center py-10">
                            <Ionicons name="swap-horizontal-outline" size={48} color="#d1d5db" />
                            <Text className="text-gray-500 font-medium mt-4">No returns or refunds</Text>
                            <Text className="text-gray-400 text-xs text-center mt-1 px-4">If you return an order from the order details page, it will appear here.</Text>
                        </View>
                    )}

                    {returnRequests.length > 0 && (
                        <View className="mb-4">
                            <Text className="font-bold text-gray-800 mb-3 px-1">Returns</Text>
                            {returnRequests.map((req) => (
                                <View key={req.id} className="bg-white border border-gray-200 rounded-xl p-4 mb-3 shadow-sm">
                                    <View className="flex-row justify-between mb-2">
                                        <Text className="font-bold text-gray-900 text-sm capitalize">{req.return_type} Request</Text>
                                        <View className={`px-2 py-0.5 rounded border ${getStatusColor(req.status)}`}>
                                            <Text className="text-[10px] font-bold uppercase">{req.status}</Text>
                                        </View>
                                    </View>
                                    <Text className="text-xs text-gray-500">Order #{String(req.order_id).slice(-8).toUpperCase()}</Text>
                                    {req.reason && <Text className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded">Reason: {req.reason}</Text>}
                                </View>
                            ))}
                        </View>
                    )}

                    {refundRequests.length > 0 && (
                        <View className="mb-4">
                            <Text className="font-bold text-gray-800 mt-2 mb-3 px-1">Refunds</Text>
                            {refundRequests.map((req) => (
                                <View key={req.id} className="bg-white border border-gray-200 rounded-xl p-4 mb-3 shadow-sm">
                                    <View className="flex-row justify-between mb-2">
                                        <Text className="font-bold text-gray-900 text-sm">Refund #{String(req.id).slice(-8).toUpperCase()}</Text>
                                        <View className={`px-2 py-0.5 rounded border ${getStatusColor(req.status)}`}>
                                            <Text className="text-[10px] font-bold uppercase">{req.status}</Text>
                                        </View>
                                    </View>
                                    <View className="flex-row justify-between mt-1 items-end">
                                        <Text className="text-xs text-gray-500">Order #{String(req.order_id).slice(-8).toUpperCase()}</Text>
                                        <Text className="font-bold text-[#FF6B00]">₹{req.amount}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            )}

            {/* Mount Order Action Modal */}
            {selectedOrder && (
                <OrderActionModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    actionType={modalAction}
                    order={selectedOrder}
                    onSuccess={() => {
                        setModalVisible(false);
                        setSelectedOrder(null);
                        fetchAllData(); // Refresh list to show return requests
                    }}
                />
            )}
        </View>
    );
};

export default OrdersSection;
