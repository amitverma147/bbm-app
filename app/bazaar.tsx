import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from '../components/Header';

export default function BazaarPage() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-white">
            <Header />
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                <View className="bg-[#F5F3FF] border border-[#DDD6FE] p-8 rounded-full mb-6 shadow-sm">
                    <Ionicons name="grid" size={72} color="#7C3AED" />
                </View>
                <Text className="text-4xl font-black text-gray-900 mb-6 text-center tracking-tight">
                    Bazaar
                </Text>
                <View className="bg-orange-50 border border-orange-200 p-6 rounded-3xl mb-10 w-full shadow-md">
                    <Text className="text-xl text-orange-800 text-center font-black mb-3">
                        Service Unavailable
                    </Text>
                    <Text className="text-base text-orange-700 text-center leading-relaxed font-bold">
                        This service is not available in your area yet. We will notify you when these services are available.
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => router.push('/')}
                    className="bg-orange-600 px-10 py-4 rounded-full shadow-xl flex-row items-center"
                >
                    <Ionicons name="arrow-back" size={22} color="white" style={{ marginRight: 10 }} />
                    <Text className="text-white font-black text-lg">BACK TO QWIK</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
