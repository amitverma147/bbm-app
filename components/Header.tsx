import { View, Text, TextInput, TouchableOpacity, ScrollView, StatusBar, Platform } from 'react-native'
import React, { useState, useEffect } from 'react'
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons'
import { searchAll } from '../services/searchService'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

// Start with a mock user/auth state
const MOCK_USER = {
    id: '123',
    name: 'User',
    isLoggedIn: false,
    avatar: null
};

const QUICK_ACCESS = [
    { id: '1', title: 'QWIK', active: true, color: '#E11D48', borderColor: '#FECDD3' },
    { id: '2', title: 'Eato', active: false, color: '#059669', borderColor: '#6EE7B7' },
    { id: '3', title: 'Star', active: false, color: '#2A2B75', borderColor: '#E8C488' },
    { id: '4', title: 'Bazaar', active: false, color: '#7C3AED', borderColor: '#C4B5FD' },
];

const Header = () => {
    const router = useRouter();
    const [location, setLocation] = useState('Detecting location...');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [user, setUser] = useState(MOCK_USER);

    // Simulate location detection
    useEffect(() => {
        setTimeout(() => {
            setLocation('Home - 123 Street, City');
        }, 1500);
    }, []);

    const handleSearch = async (text: string) => {
        setSearchQuery(text);
        if (text.length > 2) {
            setIsSearching(true);
            try {
                const results = await searchAll(text);
                console.log('Search results:', results);
            } catch (e) {
                console.error(e);
            } finally {
                setIsSearching(false);
            }
        }
    };

    return (
        <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View className="bg-white pb-2 border-b border-gray-100">
                {/* Top Row: Location & Login/Signup */}
                <View className="flex-row items-center justify-between px-4 py-2">
                    {/* Left: Location */}
                    <TouchableOpacity className="flex-1 mr-4 flex-row items-center">
                        <MaterialIcons name="location-pin" size={24} color="#FD5B00" />
                        <View className="ml-2 flex-1">
                            <View className="flex-row items-center">
                                <Text className="text-xs text-gray-500 font-medium mr-1">Deliver to</Text>
                                <MaterialIcons name="keyboard-arrow-down" size={18} color="#FD5B00" />
                            </View>
                            <Text className="text-sm font-bold text-gray-800" numberOfLines={1}>
                                {location}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* Right: Login/Signup Buttons */}
                    <View className="flex-row items-center gap-2">
                        <TouchableOpacity onPress={() => router.push('/login')} className="bg-[#FD5B00] px-3 py-1.5 rounded-md">
                            <Text className="text-white font-bold text-xs">Login</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/signup')} className="bg-white border border-[#FD5B00] px-3 py-1.5 rounded-md">
                            <Text className="text-[#FD5B00] font-bold text-xs">Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Second Row: Quick Access Pills (Tabs) */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                    {QUICK_ACCESS.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={{
                                backgroundColor: item.active ? '#E11D48' : '#fff',
                                borderColor: item.active ? '#E11D48' : '#f3f4f6',
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                                elevation: 2
                            }}
                            className={`px-6 py-2 rounded-full mr-3 border items-center justify-center`}
                        >
                            <Text className={`${item.active ? 'text-white' : 'text-[#FD5B00]'} font-bold text-xs uppercase tracking-wide`}>
                                {item.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Third Row: Search Bar */}
                <View className="px-4 mt-1 pb-2">
                    <View className="flex-row items-center bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-11">
                        <TextInput
                            placeholder="Search..."
                            className="flex-1 pl-4 text-gray-800 font-medium text-base h-full"
                            placeholderTextColor="#9CA3AF"
                            value={searchQuery}
                            onChangeText={handleSearch}
                        />
                        <TouchableOpacity className="bg-[#FD5B00] h-full w-11 items-center justify-center">
                            <Ionicons name="search" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    )
}

export default Header
