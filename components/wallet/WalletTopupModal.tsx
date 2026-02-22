import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';
import * as walletService from '../../services/walletService';
import RazorpayCheckout from 'react-native-razorpay';

interface WalletTopupModalProps {
    visible: boolean;
    onClose: () => void;
}

const WalletTopupModal: React.FC<WalletTopupModalProps> = ({ visible, onClose }) => {
    const { refreshWallet } = useWallet();
    const { getAccessToken, userProfile } = useAuth();
    const [amount, setAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const predefinedAmounts = [100, 250, 500, 1000, 2000, 5000];

    // Fallback key, usually you'd get this from env or API
    const RAZORPAY_KEY = 'rzp_test_1DP5mmOlF5G5ag';

    const handleAmountSelect = (val: number) => {
        setAmount(val.toString());
        setError(null);
    };

    const validateAmount = () => {
        const num = parseFloat(amount);
        if (!amount || isNaN(num)) {
            setError('Please enter a valid amount');
            return false;
        }
        if (num < 1) {
            setError('Minimum amount is ₹1');
            return false;
        }
        if (num > 50000) {
            setError('Maximum amount is ₹50,000');
            return false;
        }
        return true;
    };

    const handleAddMoney = async () => {
        if (!validateAmount()) return;

        setIsProcessing(true);
        setError(null);

        try {
            const token = await getAccessToken();
            if (!token) throw new Error('Authentication required');

            // 1. Create topup order
            const orderData = await walletService.createWalletTopupOrder(parseFloat(amount), token);

            if (!orderData.success) {
                throw new Error(orderData.error || 'Failed to initiate topup');
            }

            const options = {
                description: 'Wallet Topup',
                image: 'https://i.imgur.com/3g7nmJC.png', // Optional icon
                currency: orderData.currency,
                key: RAZORPAY_KEY,
                amount: orderData.amount,
                name: 'BigBest Mart',
                order_id: orderData.order_id,
                prefill: {
                    email: userProfile?.email || '',
                    contact: userProfile?.phone || '',
                    name: userProfile?.name || 'User'
                },
                theme: { color: '#f97316' }
            };

            // 3. Launch Native Checkout
            if (!RazorpayCheckout) {
                Alert.alert(
                    "Native Module Required",
                    "Razorpay requires a custom development build. Please run 'npx expo prebuild' and then 'npx expo run:android' or 'npx expo run:ios' instead of Expo Go.",
                );
                setIsProcessing(false);
                return;
            }

            RazorpayCheckout.open(options).then(async (data: any) => {
                try {
                    // Verify payment
                    const verifyData = {
                        razorpay_order_id: data.razorpay_order_id,
                        razorpay_payment_id: data.razorpay_payment_id,
                        razorpay_signature: data.razorpay_signature,
                        amount: parseFloat(amount),
                    };

                    const result = await walletService.verifyWalletTopup(verifyData, token);

                    if (result.success) {
                        Alert.alert("Success", `₹${amount} added to your wallet!`);
                        refreshWallet();
                        onClose();
                    } else {
                        Alert.alert("Payment Verification Failed", result.error || "Please contact support if amount was deducted.");
                        setError(result.error);
                    }
                } catch (verifyErr: any) {
                    Alert.alert("Error", verifyErr.message || "Failed to verify transaction");
                    setError(verifyErr.message);
                } finally {
                    setIsProcessing(false);
                }
            }).catch((error: any) => {
                console.error("Razorpay Error:", error);
                Alert.alert(`Error: ${error.code} | ${error.description}`);
                setError(error.description || "Payment cancelled or failed");
                setIsProcessing(false);
            });

        } catch (err: any) {
            console.error('Topup error:', err);
            setError(err.message || 'Payment initiation failed');
            setIsProcessing(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 justify-end bg-black/50"
            >
                <View className="bg-white rounded-t-[40px] p-6 pb-10">

                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-black text-gray-900">Add Money</Text>
                        <TouchableOpacity onPress={onClose} className="p-2 bg-gray-100 rounded-full">
                            <Ionicons name="close" size={20} color="#4B5563" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                            Select Amount
                        </Text>

                        <View className="flex-row flex-wrap justify-between gap-3 mb-6">
                            {predefinedAmounts.map((preset) => (
                                <TouchableOpacity
                                    key={preset}
                                    onPress={() => handleAmountSelect(preset)}
                                    className={`w-[30%] py-3 rounded-2xl border items-center ${amount === preset.toString()
                                        ? "bg-orange-500 border-orange-500"
                                        : "bg-white border-gray-100"
                                        }`}
                                >
                                    <Text className={`font-bold ${amount === preset.toString() ? "text-white" : "text-gray-900"
                                        }`}>
                                        ₹{preset}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Or enter custom amount
                        </Text>
                        <View className="flex-row items-center border border-gray-100 bg-gray-50/50 rounded-2xl px-4 py-4 mb-6">
                            <Text className="text-lg font-black text-gray-900 mr-2">₹</Text>
                            <TextInput
                                value={amount}
                                onChangeText={setAmount}
                                placeholder="Enter amount (1 - 50,000)"
                                keyboardType="numeric"
                                className="flex-1 text-lg font-bold text-gray-900"
                            />
                        </View>

                        {error && (
                            <View className="bg-red-50 p-3 rounded-xl mb-6 border border-red-100">
                                <Text className="text-red-600 text-xs font-medium text-center">{error}</Text>
                            </View>
                        )}

                        <View className="bg-gray-50 rounded-2xl p-4 mb-8">
                            <View className="flex-row items-center mb-2">
                                <Feather name="shield" size={14} color="#16A34A" />
                                <Text className="text-gray-900 font-bold text-xs ml-2">Secure Payment</Text>
                            </View>
                            <Text className="text-gray-500 text-[10px] leading-4">
                                Payments are processed securely via Razorpay. Your balance will be updated instantly after a successful transaction.
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={handleAddMoney}
                            disabled={isProcessing || !amount}
                            className={`bg-orange-500 py-4 rounded-2xl items-center shadow-lg shadow-orange-900/40 ${isProcessing || !amount ? "opacity-50" : ""
                                }`}
                        >
                            {isProcessing ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-black text-base uppercase tracking-wider">
                                    Proceed to Pay ₹{amount || '0'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default WalletTopupModal;

