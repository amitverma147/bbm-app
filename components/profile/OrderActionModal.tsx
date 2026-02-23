import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../../constants/Config";
import { useAuth } from "../../contexts/AuthContext";

interface OrderActionModalProps {
    visible: boolean;
    onClose: () => void;
    actionType: "track" | "cancel" | "return" | null;
    order: any;
    onSuccess?: () => void;
}

const OrderActionModal: React.FC<OrderActionModalProps> = ({
    visible,
    onClose,
    actionType,
    order,
    onSuccess,
}) => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [trackingData, setTrackingData] = useState<any[] | null>(null);
    const [returnStep, setReturnStep] = useState(1); // 1: Eligibility/Reason, 2: Bank Details
    const [formData, setFormData] = useState({
        reason: "",
        details: "",
        accountHolderName: "",
        accountNumber: "",
        ifscCode: "",
        bankName: "",
    });
    const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
    const [eligibilityData, setEligibilityData] = useState<any>(null);

    // Reset state on open
    useEffect(() => {
        if (visible && actionType && order) {
            setLoading(false);
            setReturnStep(1);
            setFormData({
                reason: "",
                details: "",
                accountHolderName: "",
                accountNumber: "",
                ifscCode: "",
                bankName: "",
            });
            setSelectedItems({});
            setTrackingData(null);
            setEligibilityData(null);

            if (actionType === "track") {
                fetchTracking();
            } else if (actionType === "return" || actionType === "cancel") {
                fetchEligibility();
            }
        }
    }, [visible, actionType, order]);

    const fetchTracking = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/tracking/order/${order.id}`);
            const data = await res.json();
            if (data.success) {
                setTrackingData(data.tracking);
            } else {
                Alert.alert("Error", "Failed to clear tracking information.");
            }
        } catch (err) {
            Alert.alert("Error", "Could not load tracking information.");
        } finally {
            setLoading(false);
        }
    };

    const fetchEligibility = async () => {
        try {
            setLoading(true);
            const res = await fetch(
                `${API_BASE_URL}/return-orders/eligibility/${order.id}`
            );
            const data = await res.json();
            if (data.success) {
                setEligibilityData(data);
            } else {
                Alert.alert("Error", "Failed to check eligibility.");
            }
        } catch (err) {
            console.error("Eligibility Error:", err);
            Alert.alert("Error", "Could not check eligibility.");
        } finally {
            setLoading(false);
        }
    };

    const needsBankDetails = actionType === "return" || actionType === "cancel";

    const handleReturnSubmit = async () => {
        if (returnStep === 1) {
            if (!formData.reason) return Alert.alert("Required", "Please select a reason");

            if (actionType === "return") {
                const hasItems = Object.values(selectedItems).some((val) => val);
                if (!hasItems) return Alert.alert("Required", "Please select at least one item to return");
            }

            if (needsBankDetails) {
                setReturnStep(2);
                return;
            }
        }

        try {
            setLoading(true);

            if (returnStep === 2) {
                if (
                    !formData.accountHolderName ||
                    !formData.accountNumber ||
                    !formData.ifscCode ||
                    !formData.bankName
                ) {
                    Alert.alert("Required", "Please fill in all bank details");
                    setLoading(false);
                    return;
                }
            }

            const payload = {
                order_id: order.id,
                user_id: currentUser?.id || order.user_id,
                return_type: actionType === "cancel" ? "cancellation" : "return",
                reason: formData.reason,
                additional_details: formData.details,
                ...(needsBankDetails && {
                    bank_account_holder_name: formData.accountHolderName,
                    bank_account_number: formData.accountNumber,
                    bank_ifsc_code: formData.ifscCode,
                    bank_name: formData.bankName,
                }),
                items:
                    actionType === "cancel"
                        ? order.order_items?.map((item: any) => ({
                            order_item_id: item.id,
                            quantity: item.quantity,
                            reason: formData.reason,
                        }))
                        : order.order_items
                            ?.filter((item: any) => selectedItems[item.id])
                            ?.map((item: any) => ({
                                order_item_id: item.id,
                                quantity: item.quantity,
                                reason: formData.reason,
                            })),
            };

            if (!payload.items || payload.items.length === 0) {
                Alert.alert("Error", "Please select at least one item to return");
                setLoading(false);
                return;
            }

            const res = await fetch(`${API_BASE_URL}/return-orders/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await res.json();
            if (result.success) {
                Alert.alert(
                    "Success",
                    actionType === "cancel"
                        ? "Cancellation request submitted!"
                        : "Return request submitted! Refund initiated."
                );
                onSuccess?.();
                onClose();
            } else {
                Alert.alert("Error", result.error || result.message || "Failed to submit request");
            }
        } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to submit request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/50">
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    style={{ maxHeight: "90%" }}
                >
                    <View className="bg-white rounded-t-3xl overflow-hidden h-full">
                        {/* Header */}
                        <View className="flex-row items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                            <Text className="text-lg font-bold text-gray-900 capitalize">
                                {actionType === "track" ? "Track Order" : `${actionType} Order`}
                            </Text>
                            <TouchableOpacity onPress={onClose} className="p-2 rounded-full bg-gray-200">
                                <Ionicons name="close" size={20} color="#4b5563" />
                            </TouchableOpacity>
                        </View>

                        {/* Content */}
                        <ScrollView className="p-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                            {loading && !trackingData && !eligibilityData && returnStep === 1 ? (
                                <View className="py-12 items-center">
                                    <ActivityIndicator size="large" color="#FF6B00" />
                                </View>
                            ) : (
                                <>
                                    {/* Tracking View */}
                                    {actionType === "track" && trackingData && (
                                        <View className="px-2">
                                            {trackingData.length > 0 ? (
                                                <View className="relative ml-4 pl-4 border-l-2 border-gray-200">
                                                    {trackingData.map((track, idx) => (
                                                        <View key={track.id || idx} className="mb-8 relative">
                                                            <View
                                                                className={`absolute -left-[27px] w-6 h-6 rounded-full border-2 bg-white items-center justify-center ${idx === trackingData.length - 1
                                                                        ? "border-green-500"
                                                                        : "border-gray-300"
                                                                    }`}
                                                            >
                                                                <View
                                                                    className={`w-2 h-2 rounded-full ${idx === trackingData.length - 1 ? "bg-green-500" : "bg-gray-300"
                                                                        }`}
                                                                />
                                                            </View>
                                                            <View className="-mt-1">
                                                                <Text className="font-bold text-gray-900 text-base">{track.status}</Text>
                                                                <Text className="text-sm text-gray-600 mt-1">{track.description}</Text>
                                                                <Text className="text-xs text-gray-400 mt-1">
                                                                    {new Date(track.timestamp).toLocaleString()}
                                                                </Text>
                                                                {track.location && (
                                                                    <View className="flex-row items-center mt-1">
                                                                        <Ionicons name="location-outline" size={12} color="#4b5563" />
                                                                        <Text className="text-xs font-medium text-gray-600 ml-1">
                                                                            {track.location}
                                                                        </Text>
                                                                    </View>
                                                                )}
                                                            </View>
                                                        </View>
                                                    ))}
                                                </View>
                                            ) : (
                                                <View className="py-10 items-center">
                                                    <Ionicons name="cube-outline" size={48} color="#d1d5db" />
                                                    <Text className="text-gray-500 mt-4 text-center">
                                                        No tracking information available yet.
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    )}

                                    {/* Cancel / Return View */}
                                    {(actionType === "cancel" || actionType === "return") && (
                                        <View className="space-y-4">
                                            {returnStep === 1 ? (
                                                <>
                                                    <View className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-4">
                                                        <Text className="text-sm text-gray-700">
                                                            {actionType === "return"
                                                                ? "Select items you wish to return. Refunds will be processed to your bank account."
                                                                : "Cancellation refunds will be processed to your bank account."}
                                                        </Text>
                                                    </View>

                                                    {/* Item Selection */}
                                                    {actionType === "return" && (
                                                        <View className="mb-4">
                                                            <Text className="font-bold text-gray-800 mb-2">Select Items to Return</Text>
                                                            <View className="space-y-2 max-h-60">
                                                                {order?.order_items?.map((item: any) => {
                                                                    const variant = item.variant;
                                                                    const product = variant?.product || item.product || item.products || {};
                                                                    const baseName = product.name || product.product_name || item.name || "Product";
                                                                    const variantTitle = variant?.title || item.variant_title;
                                                                    const productName = variantTitle ? `${baseName} (${variantTitle})` : baseName;

                                                                    const itemEligibility = eligibilityData?.eligibility?.item_eligibility?.[item.id];
                                                                    const isEligible = itemEligibility ? itemEligibility.is_eligible !== false : true;

                                                                    return (
                                                                        <TouchableOpacity
                                                                            key={item.id}
                                                                            disabled={!isEligible}
                                                                            onPress={() =>
                                                                                setSelectedItems((prev) => ({
                                                                                    ...prev,
                                                                                    [item.id]: !prev[item.id],
                                                                                }))
                                                                            }
                                                                            className={`flex-row items-center p-3 rounded-lg border mb-2 ${selectedItems[item.id] ? "border-[#FF6B00] bg-orange-50" : "border-gray-200"
                                                                                } ${!isEligible ? "opacity-50" : ""}`}
                                                                        >
                                                                            <Ionicons
                                                                                name={selectedItems[item.id] ? "checkbox" : "square-outline"}
                                                                                size={24}
                                                                                color={selectedItems[item.id] ? "#FF6B00" : "#9ca3af"}
                                                                            />
                                                                            <View className="flex-1 ml-3">
                                                                                <Text className="font-medium text-sm text-gray-900">
                                                                                    {productName} <Text className="text-gray-500 font-normal">(x{item.quantity})</Text>
                                                                                </Text>
                                                                                {!isEligible && itemEligibility?.reason && (
                                                                                    <Text className="text-xs text-red-500 mt-1">{itemEligibility.reason}</Text>
                                                                                )}
                                                                            </View>
                                                                            <Text className="font-semibold text-gray-800">₹{item.price}</Text>
                                                                        </TouchableOpacity>
                                                                    );
                                                                })}
                                                            </View>
                                                        </View>
                                                    )}

                                                    <View className="mb-4">
                                                        <Text className="font-bold text-gray-800 mb-1">Reason for {actionType}</Text>
                                                        {/* Simple text input since RN Picker can be bulky */}
                                                        <TextInput
                                                            className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-lg text-gray-900"
                                                            placeholder={`Why are you ${actionType === 'return' ? 'returning' : 'canceling'}?`}
                                                            value={formData.reason}
                                                            onChangeText={(t) => setFormData({ ...formData, reason: t })}
                                                        />
                                                        {/* In a real app we might use an ActionSheet or Picker for reasons */}
                                                    </View>

                                                    <View className="mb-4">
                                                        <Text className="font-bold text-gray-800 mb-1">Additional Details (Optional)</Text>
                                                        <TextInput
                                                            className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-lg text-gray-900 h-24"
                                                            placeholder="Please provide more details..."
                                                            multiline
                                                            textAlignVertical="top"
                                                            value={formData.details}
                                                            onChangeText={(t) => setFormData({ ...formData, details: t })}
                                                        />
                                                    </View>
                                                </>
                                            ) : (
                                                // Step 2: Bank Details
                                                <View className="space-y-4 mb-4">
                                                    <View className="bg-blue-50 p-3 rounded-xl border border-blue-200 mb-4">
                                                        <Text className="font-bold text-blue-900">Refund Details Required</Text>
                                                        <Text className="text-sm text-blue-800 mt-1">We need your bank details to process the refund securely.</Text>
                                                    </View>

                                                    <View className="mb-3">
                                                        <Text className="font-semibold text-gray-800 mb-1">Account Holder Name</Text>
                                                        <TextInput
                                                            className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-lg text-gray-900"
                                                            value={formData.accountHolderName}
                                                            onChangeText={(t) => setFormData({ ...formData, accountHolderName: t })}
                                                        />
                                                    </View>

                                                    <View className="mb-3">
                                                        <Text className="font-semibold text-gray-800 mb-1">Account Number</Text>
                                                        <TextInput
                                                            className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-lg text-gray-900"
                                                            keyboardType="numeric"
                                                            value={formData.accountNumber}
                                                            onChangeText={(t) => setFormData({ ...formData, accountNumber: t })}
                                                        />
                                                    </View>

                                                    <View className="mb-3">
                                                        <Text className="font-semibold text-gray-800 mb-1">IFSC Code</Text>
                                                        <TextInput
                                                            className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-lg text-gray-900"
                                                            autoCapitalize="characters"
                                                            value={formData.ifscCode}
                                                            onChangeText={(t) => setFormData({ ...formData, ifscCode: t.toUpperCase() })}
                                                        />
                                                    </View>

                                                    <View className="mb-3">
                                                        <Text className="font-semibold text-gray-800 mb-1">Bank Name</Text>
                                                        <TextInput
                                                            className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-lg text-gray-900"
                                                            value={formData.bankName}
                                                            onChangeText={(t) => setFormData({ ...formData, bankName: t })}
                                                        />
                                                    </View>
                                                </View>
                                            )}

                                            <View className="flex-row gap-3 pt-2">
                                                {returnStep === 2 && (
                                                    <TouchableOpacity
                                                        onPress={() => setReturnStep(1)}
                                                        className="flex-1 py-4 rounded-xl border border-gray-300 items-center justify-center bg-white"
                                                    >
                                                        <Text className="font-bold text-gray-700">Back</Text>
                                                    </TouchableOpacity>
                                                )}
                                                <TouchableOpacity
                                                    onPress={handleReturnSubmit}
                                                    disabled={loading}
                                                    className={`flex-1 py-4 rounded-xl items-center justify-center ${loading ? 'bg-orange-300' : 'bg-[#FF6B00]'}`}
                                                >
                                                    {loading ? (
                                                        <ActivityIndicator size="small" color="#FFF" />
                                                    ) : (
                                                        <Text className="font-bold text-white text-base">
                                                            {returnStep === 1 && needsBankDetails ? "Next" : "Submit Request"}
                                                        </Text>
                                                    )}
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}
                                </>
                            )}
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

export default OrderActionModal;
