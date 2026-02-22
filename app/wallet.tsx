import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWallet } from "../contexts/WalletContext";
import { LinearGradient } from "expo-linear-gradient";
import WalletTopupModal from "../components/wallet/WalletTopupModal";

const { width } = Dimensions.get("window");

const TransactionItem = ({ transaction }: any) => {
    const isCredit = [
        "TOPUP",
        "REFUND",
        "ADMIN_CREDIT",
    ].includes(transaction.transaction_type);

    const isFailed = transaction.status === "FAILED";
    const isPending = transaction.status === "PENDING";

    const formatType = (type: string) => {
        const map: any = {
            TOPUP: "Money Added",
            SPEND: "Payment",
            REFUND: "Refund Received",
            ADMIN_CREDIT: "Admin Credit",
            ADMIN_DEBIT: "Admin Debit",
            REVERSAL: "Payment Reversed",
        };
        return map[type] || type;
    };

    // Determine colors and icons based on status first, then credit/debit
    let iconColor = isCredit ? "#16a34a" : "#4b5563"; // green or gray
    let iconBg = isCredit ? "bg-green-50" : "bg-gray-50";
    let iconName = isCredit ? "arrow-down-left" : "arrow-up-right";
    let amountColor = isCredit ? "text-green-600" : "text-gray-900";

    if (isFailed) {
        iconColor = "#dc2626"; // red
        iconBg = "bg-red-50";
        iconName = "x";
        amountColor = "text-red-500 line-through opacity-70";
    } else if (isPending) {
        iconColor = "#ea580c"; // orange
        iconBg = "bg-orange-50";
        iconName = "clock";
        amountColor = "text-orange-500";
    }

    return (
        <View className="flex-row items-center justify-between p-4 border-b border-gray-50 bg-white">
            <View className="flex-row items-center flex-1 pr-2">
                <View
                    className={`w-11 h-11 rounded-full items-center justify-center ${iconBg}`}
                >
                    <Feather
                        name={iconName as any}
                        size={20}
                        color={iconColor}
                    />
                </View>
                <View className="ml-3 flex-1">
                    <Text className="font-bold text-gray-900 text-sm">
                        {formatType(transaction.transaction_type)}
                    </Text>
                    <Text className="text-[11px] text-gray-400 mt-0.5">
                        {new Date(transaction.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </Text>
                    {transaction.description && (
                        <Text numberOfLines={1} className="text-[10px] text-gray-500 mt-1 italic">
                            {isFailed ? "Failed: " : isPending ? "Pending: " : ""}{transaction.description}
                        </Text>
                    )}
                </View>
            </View>
            <View className="items-end">
                <Text
                    className={`font-black text-sm ${amountColor}`}
                >
                    {isCredit && !isFailed && !isPending ? "+" : (!isFailed && !isPending && !isCredit ? "-" : "")}₹{parseFloat(transaction.amount).toFixed(2)}
                </Text>
                {!isFailed && !isPending && (
                    <Text className="text-[10px] text-gray-400 mt-1">
                        Bal: ₹{parseFloat(transaction.balance_after).toFixed(2)}
                    </Text>
                )}
                {isFailed && (
                    <Text className="text-[10px] text-red-500 mt-1 font-bold">Failed</Text>
                )}
                {isPending && (
                    <Text className="text-[10px] text-orange-500 mt-1 font-bold">Processing</Text>
                )}
            </View>
        </View>
    );
};

const WalletScreen = () => {
    const router = useRouter();
    const {
        balance,
        isFrozen,
        frozenReason,
        transactions,
        loading,
        refreshing,
        refreshWallet,
        error,
    } = useWallet();

    const [showTopupModal, setShowTopupModal] = useState(false);

    const creditCount = transactions.filter((t: any) =>
        ["TOPUP", "REFUND", "ADMIN_CREDIT"].includes(t.transaction_type)
    ).length;

    const debitCount = transactions.filter((t: any) =>
        ["SPEND", "ADMIN_DEBIT"].includes(t.transaction_type)
    ).length;

    if (loading && !refreshing) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#FD5B00" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <SafeAreaView edges={["top"]} className="flex-1 bg-white">
                {/* Header */}
                <View className="flex-row items-center px-4 py-3 bg-white">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-full border border-gray-100 items-center justify-center mr-3 bg-gray-50 active:bg-gray-200"
                    >
                        <Ionicons name="chevron-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-900 tracking-tight">
                        My Wallet
                    </Text>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={refreshWallet}
                            colors={["#FD5B00"]}
                        />
                    }
                    className="flex-1 bg-gray-50/30"
                >
                    {/* Balance Card Section */}
                    <View className="px-4 mt-2">
                        <LinearGradient
                            colors={["#1F2937", "#111827"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            className="rounded-3xl p-6 shadow-xl shadow-gray-400"
                        >
                            <View className="flex-row justify-between items-start mb-8">
                                <View>
                                    <Text className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">
                                        Available Balance
                                    </Text>
                                    <Text className="text-4xl font-black text-white tracking-tighter">
                                        ₹{balance.toFixed(2)}
                                    </Text>
                                </View>
                                <View className="bg-orange-500/20 p-2.5 rounded-2xl">
                                    <Ionicons name="wallet" size={24} color="#F97316" />
                                </View>
                            </View>

                            {isFrozen && (
                                <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-6 flex-row items-center">
                                    <Ionicons name="lock-closed" size={16} color="#EF4444" />
                                    <Text className="text-red-400 text-xs font-bold ml-2">
                                        Frozen: {frozenReason || "Account Restricted"}
                                    </Text>
                                </View>
                            )}

                            <TouchableOpacity
                                onPress={() => setShowTopupModal(true)}
                                disabled={isFrozen}
                                className={`bg-orange-500 flex-row items-center justify-center py-4 rounded-2xl shadow-lg shadow-orange-900/40 active:scale-[0.98] ${isFrozen ? "opacity-50" : ""
                                    }`}
                            >
                                <Ionicons name="add-circle" size={20} color="white" />
                                <Text className="text-white font-black text-base ml-2 uppercase tracking-wider">
                                    Add Money
                                </Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>

                    {/* Stats Summary */}
                    <View className="flex-row justify-between px-4 mt-6">
                        {[
                            { label: "Spent", val: debitCount, color: "#EF4444", icon: "trending-up" },
                            { label: "Added", val: creditCount, color: "#16A34A", icon: "trending-down" },
                            { label: "Total", val: transactions.length, color: "#3B82F6", icon: "list" },
                        ].map((stat, idx) => (
                            <View
                                key={idx}
                                className="bg-white p-4 rounded-2xl w-[31%] items-center shadow-sm border border-gray-100"
                            >
                                <View className="items-center mb-1">
                                    <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        {stat.label}
                                    </Text>
                                    <Text
                                        style={{ color: stat.color }}
                                        className="text-lg font-black mt-0.5"
                                    >
                                        {stat.val}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Activity Section */}
                    <View className="px-4 mt-8 mb-4 flex-row justify-between items-center">
                        <Text className="text-lg font-black text-gray-900">Recent Activity</Text>
                    </View>

                    <View className="mx-4 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                        {transactions.length > 0 ? (
                            transactions.map((t: any) => (
                                <TransactionItem key={t.id} transaction={t} />
                            ))
                        ) : (
                            <View className="py-20 items-center justify-center">
                                <View className="bg-gray-100 p-6 rounded-full mb-4">
                                    <Ionicons name="receipt-outline" size={32} color="#9CA3AF" />
                                </View>
                                <Text className="text-gray-900 font-bold text-base">No transactions yet</Text>
                                <Text className="text-gray-400 text-xs mt-1">Your activity will show up here</Text>
                            </View>
                        )}
                    </View>

                    {/* Features / Info */}
                    <View className="flex-row gap-3 px-4 mb-10">
                        <View className="flex-1 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 items-center">
                            <View className="bg-blue-100 p-2 rounded-xl mb-2">
                                <Ionicons name="flash" size={16} color="#3B82F6" />
                            </View>
                            <Text className="text-blue-900 font-bold text-xs">Instant</Text>
                            <Text className="text-blue-700 text-[10px] mt-0.5">Fast Payments</Text>
                        </View>
                        <View className="flex-1 bg-green-50/50 p-4 rounded-2xl border border-green-100 items-center">
                            <View className="bg-green-100 p-2 rounded-xl mb-2">
                                <Ionicons name="refresh" size={16} color="#16A34A" />
                            </View>
                            <Text className="text-green-900 font-bold text-xs">Refunds</Text>
                            <Text className="text-green-700 text-[10px] mt-0.5">Quick Processing</Text>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>

            <WalletTopupModal
                visible={showTopupModal}
                onClose={() => setShowTopupModal(false)}
            />
        </View>
    );
};

export default WalletScreen;
