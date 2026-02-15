import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { FontAwesome5 } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

const CATEGORIES = [
    { id: '1', name: 'Vegetables', icon: 'carrot', color: '#e8f5e9' },
    { id: '2', name: 'Fruits', icon: 'apple-alt', color: '#fff3e0' },
    { id: '3', name: 'Dairy', icon: 'cheese', color: '#e3f2fd' },
    { id: '4', name: 'Bakery', icon: 'bread-slice', color: '#fbe9e7' },
    { id: '5', name: 'Snacks', icon: 'cookie', color: '#fff8e1' },
    { id: '6', name: 'Drinks', icon: 'wine-bottle', color: '#f3e5f5' },
    { id: '7', name: 'Personal', icon: 'pump-soap', color: '#e0f2f1' },
    { id: '8', name: 'Home', icon: 'home', color: '#eceff1' },
]

const CategoriesGrid = () => {
    const router = useRouter();
    return (
        <View className="px-4 mb-6">
            <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-bold text-gray-900">Explore by Category</Text>
                <TouchableOpacity onPress={() => router.push('/categories')}>
                    <Text className="text-green-600 font-bold text-xs">View All</Text>
                </TouchableOpacity>
            </View>
            <View className="flex-row flex-wrap justify-between">
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity key={cat.id} className="w-[23%] mb-4 items-center" onPress={() => router.push('/categories')}>
                        <View style={{ backgroundColor: cat.color }} className="w-16 h-16 rounded-2xl items-center justify-center mb-2">
                            <FontAwesome5 name={cat.icon} size={24} color="#333" />
                        </View>
                        <Text className="text-xs font-medium text-center text-gray-700">{cat.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    )
}

export default CategoriesGrid;
