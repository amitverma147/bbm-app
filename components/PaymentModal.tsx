import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface PaymentModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectMethod: (method: 'COD' | 'WALLET' | 'ONLINE') => void;
    walletBalance: number;
    isWalletFrozen: boolean;
    totalAmount: number;
}

const PaymentModal = ({ visible, onClose, onSelectMethod, walletBalance, isWalletFrozen, totalAmount }: PaymentModalProps) => {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white rounded-t-3xl p-6 pb-10">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-black text-gray-900">Select Payment Method</Text>
                        <TouchableOpacity onPress={onClose} className="p-2 bg-gray-100 rounded-full">
                            <Feather name="x" size={24} color="black" />
                        </TouchableOpacity>
                    </View>

                    <Text className="text-gray-500 mb-4 px-1">Total to pay: <Text className="font-bold text-gray-900">₹{totalAmount.toFixed(0)}</Text></Text>

                    <View className="space-y-4">
                        {/* COD */}
                        <TouchableOpacity onPress={() => onSelectMethod('COD')} className="flex-row items-center p-4 bg-gray-50 rounded-2xl border border-gray-200">
                            <View className="bg-orange-100 p-3 rounded-full">
                                <MaterialIcons name="money" size={24} color="#FF6B00" />
                            </View>
                            <View className="ml-4 flex-1">
                                <Text className="font-bold text-lg text-gray-900">Cash on Delivery</Text>
                                <Text className="text-xs text-gray-500">Pay when you receive the order</Text>
                            </View>
                            <Feather name="chevron-right" size={24} color="#9ca3af" />
                        </TouchableOpacity>

                        {/* Wallet */}
                        <TouchableOpacity
                            onPress={() => onSelectMethod('WALLET')}
                            disabled={isWalletFrozen}
                            className={`flex-row items-center p-4 bg-gray-50 rounded-2xl border border-gray-200 ${isWalletFrozen ? 'opacity-50' : ''}`}
                        >
                            <View className="bg-blue-100 p-3 rounded-full">
                                <Ionicons name="wallet-outline" size={24} color="#3B82F6" />
                            </View>
                            <View className="ml-4 flex-1">
                                <Text className="font-bold text-lg text-gray-900">Wallet Balance</Text>
                                <Text className="text-xs text-gray-500">Available: ₹{walletBalance.toFixed(2)}</Text>
                                {walletBalance < totalAmount && <Text className="text-[10px] text-red-500 font-bold mt-1">Insufficient Balance</Text>}
                            </View>
                            <Feather name="chevron-right" size={24} color="#9ca3af" />
                        </TouchableOpacity>

                        {/* Online */}
                        <TouchableOpacity onPress={() => onSelectMethod('ONLINE')} className="flex-row items-center p-4 bg-gray-50 rounded-2xl border border-gray-200">
                            <View className="bg-green-100 p-3 rounded-full">
                                <MaterialIcons name="credit-card" size={24} color="#16a34a" />
                            </View>
                            <View className="ml-4 flex-1">
                                <Text className="font-bold text-lg text-gray-900">Online Payment</Text>
                                <Text className="text-xs text-gray-500">UPI, Cards, Netbanking</Text>
                            </View>
                            <Feather name="chevron-right" size={24} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default PaymentModal;
