import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import React from 'react'
import ProductCard from './ProductCard'
import { useCart } from '../contexts/CartContext'

interface ProductSectionProps {
    title: string;
    data: any[];
}

const ProductSection = ({ title, data }: ProductSectionProps) => {
    const { addToCart } = useCart();

    // console.log(`ProductSection '${title}' data length:`, data?.length);
    if (!data || data.length === 0) return null;

    return (
        <View className="mb-6">
            <View className="flex-row items-center justify-between px-4 mb-3">
                <Text className="text-lg font-bold text-gray-900">{title}</Text>
                <TouchableOpacity>
                    <Text className="text-green-600 font-bold text-xs">See all</Text>
                </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 16, paddingRight: 16 }}>
                {Array.isArray(data) && data.map((item) => (
                    <ProductCard key={item.id} item={item} onAdd={addToCart} />
                ))}
            </ScrollView>
        </View>
    )
}

export default React.memo(ProductSection);
