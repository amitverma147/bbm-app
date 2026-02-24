import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import Reanimated from 'react-native-reanimated';

const OrderTrackingScreen = () => {
    const router = useRouter();

    // Live Tracking Animation
    const riderPos = useSharedValue(0);
    const pulseScale = useSharedValue(1);

    useEffect(() => {
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
    }, []);

    const riderStyle = useAnimatedStyle(() => ({
        left: `${riderPos.value * 80 + 10}%`,
    }));

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
        opacity: 2 - pulseScale.value,
    }));

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100 z-10 shadow-sm">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <Ionicons name="close" size={24} color="#1F2937" />
                </TouchableOpacity>
                <View className="items-center">
                    <Text className="text-sm font-black text-gray-900">Arriving in 12 mins</Text>
                    <Text className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Order #1289ABC</Text>
                </View>
                <TouchableOpacity className="p-2 -mr-2">
                    <Feather name="help-circle" size={22} color="#4B5563" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Live Tracking Map Section (Mock) */}
                <View className="bg-gray-50 relative border-b border-gray-100/50" style={{ height: 300 }}>
                    {/* Mock Grid/Map Background */}
                    <View className="absolute inset-0 opacity-20">
                        {[...Array(15)].map((_, i) => (
                            <View key={i} className="absolute h-full w-[2px] bg-green-900/10" style={{ left: `${i * 8}%` }} />
                        ))}
                        {[...Array(10)].map((_, i) => (
                            <View key={i} className="absolute w-full h-[2px] bg-green-900/10" style={{ top: `${i * 12}%` }} />
                        ))}
                    </View>

                    {/* Store Marker */}
                    <View className="absolute top-[30%] left-[10%] items-center z-10">
                        <View className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-md border-2 border-green-500">
                            <MaterialCommunityIcons name="store" size={20} color="#10B981" />
                        </View>
                        <View className="bg-green-600 px-2 py-1 rounded-md mt-1 shadow-sm">
                            <Text className="text-[9px] font-black tracking-widest text-white uppercase">Store</Text>
                        </View>
                    </View>

                    {/* Delivery Path visualization */}
                    <View className="absolute top-[35%] left-[20%] right-[20%] h-2 bg-green-200/50 rounded-full border border-green-300/30 overflow-hidden">
                        <View className="w-1/2 h-full bg-green-500/30 rounded-full" />
                    </View>

                    {/* Home Marker */}
                    <View className="absolute top-[30%] right-[10%] items-center z-10">
                        <Reanimated.View style={pulseStyle} className="absolute w-14 h-14 rounded-full bg-green-200" />
                        <View className="w-10 h-10 rounded-full bg-green-600 items-center justify-center shadow-lg border-2 border-white">
                            <Feather name="home" size={20} color="white" />
                        </View>
                        <View className="bg-green-700 px-2 py-1 rounded-md mt-1 shadow-sm">
                            <Text className="text-[9px] font-black tracking-widest text-white uppercase">Home</Text>
                        </View>
                    </View>

                    {/* Animated Rider */}
                    <Reanimated.View style={riderStyle} className="absolute top-[28%] items-center z-20">
                        <View className="bg-white p-2 rounded-full shadow-lg border-2 border-gray-100">
                            <MaterialCommunityIcons name="moped" size={28} color="#10B981" />
                        </View>
                        <View className="bg-gray-900 px-3 py-1.5 rounded-xl mt-1.5 shadow-md flex-row items-center border border-gray-700">
                            <View className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse" />
                            <Text className="text-[10px] font-black text-white tracking-wide">Rider is on the way</Text>
                        </View>
                    </Reanimated.View>
                </View>

                {/* Rider Info Card */}
                <View className="px-4 -mt-6">
                    <View className="bg-white rounded-3xl p-5 shadow-xl border border-gray-100 flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                            <View className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden border-2 border-green-500 shadow-sm">
                                <Image source={{ uri: 'https://i.pravatar.cc/150?u=a04258114e29026702d' }} className="w-full h-full" />
                            </View>
                            <View className="ml-4 flex-1">
                                <Text className="text-lg font-black text-gray-900">Vikram Singh</Text>
                                <View className="flex-row items-center mt-1">
                                    <View className="flex-row items-center bg-green-50 px-2 py-0.5 rounded-md border border-green-200 mr-2">
                                        <Ionicons name="star" size={12} color="#10B981" />
                                        <Text className="text-xs font-black text-green-700 ml-1">4.9</Text>
                                    </View>
                                    <Text className="text-xs font-bold text-gray-500">2,410 deliveries</Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity className="w-12 h-12 bg-green-100 rounded-full items-center justify-center border border-green-200 shadow-sm ml-2">
                            <Feather name="phone" size={20} color="#10B981" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Status Timeline */}
                <View className="px-4 mt-6 mb-8">
                    <Text className="text-lg font-black text-gray-900 mb-4">Order Status</Text>

                    {[
                        { title: 'Order placed', time: '12:45 PM', completed: true },
                        { title: 'Order packed', time: '12:51 PM', completed: true },
                        { title: 'Out for delivery', time: '12:55 PM', completed: true },
                        { title: 'Arriving soon', time: 'Est. 01:07 PM', completed: false, active: true }
                    ].map((step, index, array) => (
                        <View key={index} className="flex-row mb-6">
                            <View className="items-center mr-4">
                                <View className={`w-5 h-5 rounded-full items-center justify-center z-10 border-2 ${step.completed ? 'bg-green-500 border-green-500' : step.active ? 'bg-white border-green-500' : 'bg-gray-100 border-gray-200'}`}>
                                    {step.completed && <Ionicons name="checkmark" size={12} color="white" />}
                                    {step.active && <View className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />}
                                </View>
                                {index !== array.length - 1 && (
                                    <View className={`absolute top-5 bottom-[-24px] w-0.5 ${step.completed ? 'bg-green-500' : 'bg-gray-200'}`} />
                                )}
                            </View>
                            <View className="flex-1 mt-[-2px]">
                                <Text className={`text-base font-bold ${step.completed || step.active ? 'text-gray-900' : 'text-gray-400'}`}>{step.title}</Text>
                                <Text className={`text-xs mt-1 font-bold ${step.active ? 'text-green-600' : 'text-gray-500'}`}>{step.time}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View className="h-20" />
            </ScrollView>
        </SafeAreaView>
    );
};

export default OrderTrackingScreen;
