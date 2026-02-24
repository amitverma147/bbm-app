import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../constants/Config';
import { useAuth } from '../../contexts/AuthContext';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';

const OrderDetailsScreen = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { currentUser } = useAuth();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [eligibility, setEligibility] = useState<any>(null);
    const [showReturnModal, setShowReturnModal] = useState(false);

    // Selected items for return
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [returnReason, setReturnReason] = useState('');
    const [additionalDetails, setAdditionalDetails] = useState('');
    const [bankDetails, setBankDetails] = useState({
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        accountHolder: ''
    });

    // Live Tracking Animation
    const riderPos = useSharedValue(0);
    const pulseScale = useSharedValue(1);

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    useEffect(() => {
        if (order?.status?.toLowerCase() === 'shipped') {
            riderPos.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 5000 }),
                    withTiming(0, { duration: 0 })
                ),
                -1
            );
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(1.2, { duration: 1000 }),
                    withTiming(1, { duration: 1000 })
                ),
                -1
            );
        }
    }, [order?.status]);

    const riderStyle = useAnimatedStyle(() => ({
        left: `${riderPos.value * 80 + 10}%`,
    }));

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
        opacity: 2 - pulseScale.value,
    }));

    const fetchOrderDetails = async () => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}/order/details/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setOrder(result.data);
                checkEligibility(id as string, token);
            }
        } catch (error) {
            console.error("Error fetching order details:", error);
            Alert.alert("Error", "Failed to load order details");
        } finally {
            setLoading(false);
        }
    };

    const checkEligibility = async (orderId: string, token: string | null) => {
        try {
            const response = await fetch(`${API_BASE_URL}/return-orders/eligibility/${orderId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setEligibility(result.data);
            }
        } catch (error) {
            console.log("Eligibility check failed:", error);
        }
    };

    const toggleItemSelection = (itemId: string) => {
        if (selectedItems.includes(itemId)) {
            setSelectedItems(selectedItems.filter(id => id !== itemId));
        } else {
            setSelectedItems([...selectedItems, itemId]);
        }
    };

    const handleReturnSubmit = async () => {
        if (selectedItems.length === 0) {
            Alert.alert("Error", "Please select at least one item to return");
            return;
        }
        if (!returnReason) {
            Alert.alert("Error", "Please select a reason");
            return;
        }

        // Validate bank details if required (simplified check)
        if (!bankDetails.accountNumber || !bankDetails.ifscCode) {
            Alert.alert("Error", "Please provide bank details for refund");
            return;
        }

        setSubmitting(true);
        try {
            const token = await AsyncStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}/return-orders/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    orderId: id,
                    items: selectedItems,
                    reason: returnReason,
                    details: additionalDetails,
                    bankDetails
                })
            });

            const result = await response.json();
            if (result.success) {
                Alert.alert("Success", "Request submitted successfully");
                setShowReturnModal(false);
                fetchOrderDetails(); // Refresh
            } else {
                Alert.alert("Error", result.message || "Submission failed");
            }
        } catch (error) {
            Alert.alert("Error", "Communication error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#EA580C" />
                <Text className="mt-4 text-gray-500 font-medium">Fetching details...</Text>
            </View>
        );
    }

    if (!order) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50 p-6">
                <Feather name="alert-circle" size={48} color="#9CA3AF" />
                <Text className="mt-4 text-lg font-bold text-gray-900">Order not found</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-orange-600 px-6 py-3 rounded-xl">
                    <Text className="text-white font-bold">Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isActive = ['pending', 'confirmed', 'processing', 'shipped'].includes(order.status?.toLowerCase());

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <View className="items-center">
                    <Text className="text-sm font-bold text-gray-900">Order Details</Text>
                    <Text className="text-[10px] text-gray-500">ID: #{order.order_id || id?.toString().slice(-8).toUpperCase()}</Text>
                </View>
                <TouchableOpacity className="p-2 -mr-2">
                    <Feather name="help-circle" size={22} color="#4B5563" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Live Tracking Map Section (Mock) */}
                {isActive && (
                    <View className="bg-white p-4 mb-3">
                        <View className="flex-row justify-between items-center mb-3">
                            <View>
                                <Text className="text-lg font-bold text-gray-900">Live Tracking</Text>
                                <Text className="text-xs text-green-600 font-medium">Arriving in 15-20 mins</Text>
                            </View>
                            <TouchableOpacity className="bg-orange-50 px-3 py-1.5 rounded-full flex-row items-center border border-orange-100">
                                <Feather name="phone" size={14} color="#EA580C" />
                                <Text className="text-orange-600 text-xs font-bold ml-1">Call Rider</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="h-40 bg-blue-50 rounded-3xl overflow-hidden relative border border-blue-100">
                            {/* Mock Grid/Map Background */}
                            <View className="absolute inset-0 opacity-10">
                                {[...Array(10)].map((_, i) => (
                                    <View key={i} className="absolute h-full w-[1px] bg-blue-900" style={{ left: `${i * 10}%` }} />
                                ))}
                                {[...Array(6)].map((_, i) => (
                                    <View key={i} className="absolute w-full h-[1px] bg-blue-900" style={{ top: `${i * 20}%` }} />
                                ))}
                            </View>

                            {/* Delivery Path */}
                            <View className="absolute top-[50%] left-[10%] right-[10%] h-1 bg-blue-300/30 rounded-full" />

                            {/* Store Marker */}
                            <View className="absolute top-[40%] left-[5%] items-center">
                                <View className="w-8 h-8 rounded-full bg-white items-center justify-center shadow-sm border border-gray-100">
                                    <MaterialCommunityIcons name="store" size={18} color="#EA580C" />
                                </View>
                                <Text className="text-[8px] font-bold text-gray-500 mt-1">STORE</Text>
                            </View>

                            {/* Home Marker */}
                            <View className="absolute top-[40%] right-[5%] items-center">
                                <Animated.View style={pulseStyle} className="absolute w-10 h-10 rounded-full bg-orange-200" />
                                <View className="w-8 h-8 rounded-full bg-orange-600 items-center justify-center shadow-lg">
                                    <Feather name="home" size={18} color="white" />
                                </View>
                                <Text className="text-[8px] font-bold text-orange-600 mt-1">YOU</Text>
                            </View>

                            {/* Animated Rider */}
                            <Animated.View style={riderStyle} className="absolute top-[35%] items-center">
                                <View className="bg-white p-1.5 rounded-full shadow-md border border-gray-50">
                                    <MaterialCommunityIcons name="moped" size={24} color="#EA580C" />
                                </View>
                                <View className="bg-orange-600 px-2 py-0.5 rounded-md mt-1">
                                    <Text className="text-[8px] font-bold text-white">Rider is on the way</Text>
                                </View>
                            </Animated.View>
                        </View>

                        <View className="flex-row items-center mt-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                            <View className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                <Image source={{ uri: 'https://i.pravatar.cc/100' }} className="w-10 h-10" />
                            </View>
                            <View className="flex-1 ml-3">
                                <Text className="text-sm font-bold text-gray-900">Rahul Sharma</Text>
                                <Text className="text-xs text-gray-500">Your delivery partner</Text>
                            </View>
                            <View className="flex-row items-center bg-white px-2 py-1 rounded-lg border border-gray-100">
                                <Ionicons name="star" size={12} color="#F59E0B" />
                                <Text className="text-xs font-bold text-gray-900 ml-1">4.8</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Status and Items Section */}
                <View className="bg-white p-4 mb-3">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-base font-bold text-gray-900">Order Items</Text>
                        <View className={`px-2 py-1 rounded-md ${order.status === 'Delivered' ? 'bg-green-100' : 'bg-orange-100'}`}>
                            <Text className={`text-[10px] font-bold ${order.status === 'Delivered' ? 'text-green-700' : 'text-orange-700'}`}>
                                {order.status?.toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    {order.items?.map((item: any, index: number) => (
                        <View key={index} className={`flex-row items-center py-3 ${index !== order.items.length - 1 ? 'border-b border-gray-50' : ''}`}>
                            <View className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden mr-3">
                                <Image source={{ uri: item.image || 'https://via.placeholder.com/150' }} className="w-full h-full" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>{item.product_name}</Text>
                                <Text className="text-xs text-gray-500 mt-1">Qty: {item.quantity} • ₹{item.price}</Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-sm font-bold text-gray-900">₹{item.total}</Text>
                                {eligibility?.is_eligible && (
                                    <TouchableOpacity
                                        onPress={() => toggleItemSelection(item.id || item._id)}
                                        className={`mt-2 w-6 h-6 rounded-md border items-center justify-center ${selectedItems.includes(item.id || item._id) ? 'bg-orange-600 border-orange-600' : 'border-gray-300'}`}
                                    >
                                        {selectedItems.includes(item.id || item._id) && <Ionicons name="checkmark" size={16} color="white" />}
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))}
                </View>

                {/* Return/Cancel Prompt */}
                {eligibility?.is_eligible && (
                    <View className="bg-orange-50 p-4 mx-4 rounded-2xl border border-orange-100 mb-3">
                        <View className="flex-row items-center mb-2">
                            <MaterialCommunityIcons name="keyboard-return" size={20} color="#EA580C" />
                            <Text className="text-orange-800 font-bold ml-2">Need to Return or Cancel?</Text>
                        </View>
                        <Text className="text-xs text-orange-700 mb-3">
                            You can return items within {eligibility?.remaining_days} days. Select items above to proceed.
                        </Text>
                        <TouchableOpacity
                            onPress={() => setShowReturnModal(true)}
                            disabled={selectedItems.length === 0}
                            className={`py-3 rounded-xl items-center ${selectedItems.length > 0 ? 'bg-orange-600 shadow-sm' : 'bg-gray-300'}`}
                        >
                            <Text className="text-white font-bold">
                                {selectedItems.length > 0 ? `Return ${selectedItems.length} Item(s)` : 'Select items to return'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Submitting Status If Requesting */}
                {order.return_requests?.length > 0 && (
                    <View className="bg-blue-50 p-4 mx-4 rounded-2xl border border-blue-100 mb-3">
                        <Text className="text-blue-800 font-bold mb-1">Return Request Active</Text>
                        <Text className="text-xs text-blue-700">Status: {order.return_requests[0].status}</Text>
                    </View>
                )}

                {/* Billing Summary */}
                <View className="bg-white p-4 mb-3">
                    <Text className="text-base font-bold text-gray-900 mb-4">Payment Summary</Text>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-gray-500 text-sm">Item Total</Text>
                        <Text className="text-gray-900 text-sm font-medium">₹{order.total_amount}</Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-gray-500 text-sm">Delivery Fee</Text>
                        <Text className="text-green-600 text-sm font-medium">FREE</Text>
                    </View>
                    <View className="flex-row justify-between pt-2 border-t border-gray-50 mt-2">
                        <Text className="text-gray-900 font-bold">Total Pay</Text>
                        <Text className="text-orange-600 font-bold">₹{order.total_amount}</Text>
                    </View>
                </View>

                {/* Shipping Details */}
                <View className="bg-white p-4 mb-3">
                    <Text className="text-base font-bold text-gray-900 mb-3">Shipping Address</Text>
                    <View className="flex-row items-start">
                        <Feather name="map-pin" size={16} color="#4B5563" style={{ marginTop: 2 }} />
                        <View className="ml-2 flex-1">
                            <Text className="text-sm font-bold text-gray-900">{order.shipping_address?.name || currentUser?.name}</Text>
                            <Text className="text-xs text-gray-500 mt-1 leading-4">
                                {order.shipping_address?.flat_no}, {order.shipping_address?.area}, {order.shipping_address?.landmark}, {order.shipping_address?.city}, {order.shipping_address?.pincode}
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="h-20" />
            </ScrollView>

            {/* Return Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showReturnModal}
                onRequestClose={() => setShowReturnModal(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl h-[85%] p-4">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-gray-900">Return Request</Text>
                            <TouchableOpacity onPress={() => setShowReturnModal(false)} className="bg-gray-100 p-2 rounded-full">
                                <Ionicons name="close" size={24} color="#4B5563" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                            {/* Selected Items Summary */}
                            <Text className="text-sm font-bold text-gray-900 mb-3">Items being returned ({selectedItems.length})</Text>
                            <View className="bg-gray-50 p-3 rounded-2xl mb-4">
                                {order.items?.filter((i: any) => selectedItems.includes(i.id || i._id)).map((item: any, idx: number) => (
                                    <View key={idx} className="flex-row items-center mb-2">
                                        <View className="w-8 h-8 rounded bg-gray-200 mr-2" />
                                        <Text className="flex-1 text-xs text-gray-700" numberOfLines={1}>{item.product_name}</Text>
                                    </View>
                                ))}
                            </View>

                            <Text className="text-sm font-bold text-gray-900 mb-3">Reason for Return</Text>
                            {['Defective Item', 'Incorrect Size', 'Different from description', 'Changed my mind'].map((reason) => (
                                <TouchableOpacity
                                    key={reason}
                                    onPress={() => setReturnReason(reason)}
                                    className={`flex-row items-center p-3 rounded-xl mb-2 border ${returnReason === reason ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}
                                >
                                    <View className={`w-4 h-4 rounded-full border items-center justify-center mr-3 ${returnReason === reason ? 'border-orange-600' : 'border-gray-300'}`}>
                                        {returnReason === reason && <View className="w-2 h-2 rounded-full bg-orange-600" />}
                                    </View>
                                    <Text className={`text-sm ${returnReason === reason ? 'text-orange-900 font-bold' : 'text-gray-700'}`}>{reason}</Text>
                                </TouchableOpacity>
                            ))}

                            <Text className="text-sm font-bold text-gray-900 mb-3 mt-4">Bank Details (for Refund)</Text>
                            <View className="space-y-3">
                                <TextInput
                                    placeholder="Account Holder Name"
                                    className="bg-gray-50 p-4 rounded-xl text-sm border border-gray-100"
                                    value={bankDetails.accountHolder}
                                    onChangeText={(t) => setBankDetails({ ...bankDetails, accountHolder: t })}
                                />
                                <TextInput
                                    placeholder="Account Number"
                                    keyboardType="numeric"
                                    className="bg-gray-50 p-4 rounded-xl text-sm border border-gray-100 mt-2"
                                    value={bankDetails.accountNumber}
                                    onChangeText={(t) => setBankDetails({ ...bankDetails, accountNumber: t })}
                                />
                                <TextInput
                                    placeholder="IFSC Code"
                                    autoCapitalize="characters"
                                    className="bg-gray-50 p-4 rounded-xl text-sm border border-gray-100 mt-2"
                                    value={bankDetails.ifscCode}
                                    onChangeText={(t) => setBankDetails({ ...bankDetails, ifscCode: t })}
                                />
                                <TextInput
                                    placeholder="Bank Name"
                                    className="bg-gray-50 p-4 rounded-xl text-sm border border-gray-100 mt-2"
                                    value={bankDetails.bankName}
                                    onChangeText={(t) => setBankDetails({ ...bankDetails, bankName: t })}
                                />
                            </View>

                            <Text className="text-sm font-bold text-gray-900 mb-3 mt-4">Additional Details</Text>
                            <TextInput
                                multiline
                                numberOfLines={4}
                                placeholder="Describe the issue in detail..."
                                className="bg-gray-50 p-4 rounded-xl text-sm border border-gray-100 h-24"
                                style={{ textAlignVertical: 'top' }}
                                value={additionalDetails}
                                onChangeText={setAdditionalDetails}
                            />
                        </ScrollView>

                        <View className="pt-4 border-t border-gray-100">
                            <TouchableOpacity
                                onPress={handleReturnSubmit}
                                disabled={submitting}
                                className={`py-4 rounded-2xl items-center flex-row justify-center ${submitting ? 'bg-gray-400' : 'bg-orange-600'}`}
                            >
                                {submitting && <ActivityIndicator color="white" className="mr-2" size="small" />}
                                <Text className="text-white font-bold text-lg">Submit Request</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default OrderDetailsScreen;
