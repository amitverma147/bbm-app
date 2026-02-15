import { View, Text, FlatList, TouchableOpacity, Image, SafeAreaView, Dimensions } from 'react-native'
import React from 'react'
import { useCart } from '../../contexts/CartContext'
import { useRouter } from 'expo-router'
import { Ionicons, Feather } from '@expo/vector-icons'

const { width } = Dimensions.get('window')

const CartScreen = () => {
    const { cartItems, getCartTotal, updateQuantity, removeFromCart } = useCart()
    const router = useRouter()
    const total = getCartTotal()

    const renderItem = ({ item }: { item: any }) => (
        <View className="bg-white p-4 mb-4 rounded-xl flex-row items-center shadow-sm mx-4 mt-2">
            <Image
                source={{ uri: item.image || item.image_url || 'https://via.placeholder.com/80' }}
                className="w-20 h-20 rounded-lg bg-gray-100"
                resizeMode="cover"
            />
            <View className="flex-1 ml-4 justify-between h-20">
                <View>
                    <Text numberOfLines={1} className="font-bold text-gray-800 text-base">
                        {item.name}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-1">
                        {item.variant_name || item.unit || 'Standard'}
                    </Text>
                </View>

                <View className="flex-row justify-between items-center mt-2">
                    <Text className="font-bold text-blue-600 text-lg">
                        ₹{item.price}
                    </Text>

                    {/* Quantity Control */}
                    <View className="flex-row items-center bg-blue-50 rounded-lg border border-blue-100">
                        <TouchableOpacity
                            onPress={() => {
                                if (item.quantity > 1) {
                                    updateQuantity(item.id, item.quantity - 1)
                                } else {
                                    removeFromCart(item)
                                }
                            }}
                            className="p-2"
                        >
                            <Feather name="minus" size={16} color="#2563EB" />
                        </TouchableOpacity>

                        <Text className="font-bold text-blue-700 mx-2 text-base">
                            {item.quantity}
                        </Text>

                        <TouchableOpacity
                            onPress={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2"
                        >
                            <Feather name="plus" size={16} color="#2563EB" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    )

    if (cartItems.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center p-6">
                <View className="w-40 h-40 bg-blue-100 rounded-full items-center justify-center mb-6">
                    <Feather name="shopping-cart" size={64} color="#3B82F6" />
                </View>
                <Text className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</Text>
                <Text className="text-gray-500 text-center mb-8 px-4">
                    Looks like you haven't added anything to your cart yet.
                </Text>
                <TouchableOpacity
                    onPress={() => router.push('/')}
                    className="bg-blue-600 py-3 px-8 rounded-full shadow-lg"
                >
                    <Text className="text-white font-bold text-lg">Start Shopping</Text>
                </TouchableOpacity>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="px-4 py-4 bg-white shadow-sm mb-2 flex-row items-center justify-between">
                <Text className="text-2xl font-black text-gray-800">My Cart</Text>
                <Text className="text-gray-500 font-medium">
                    {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
                </Text>
            </View>

            <FlatList
                data={cartItems}
                keyExtractor={(item) => `${item.id}-${item.variant_id || 'default'}`}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            />

            {/* Footer */}
            <View className="absolute bottom-0 w-full bg-white border-t border-gray-100 p-4 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <View className="flex-row justify-between mb-4">
                    <Text className="text-gray-500 font-medium">Total Amount</Text>
                    <Text className="text-2xl font-black text-gray-900">₹{total}</Text>
                </View>

                <TouchableOpacity
                    className="bg-green-600 py-4 rounded-xl items-center shadow-lg active:bg-green-700"
                    onPress={() => {
                        // Navigate to Checkout or Address Selection
                        // For now just alert
                        alert('Proceeding to Checkout')
                    }}
                >
                    <Text className="text-white font-bold text-lg tracking-wide">
                        PROCEED TO CHECKOUT
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

export default CartScreen
