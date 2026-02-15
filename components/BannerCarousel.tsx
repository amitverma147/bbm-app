import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native'
import React from 'react'

const { width } = Dimensions.get('window')

const BANNERS = [
    { id: '1', color: '#FFCDD2', title: '50% OFF', subtitle: 'On fresh vegetables' },
    { id: '2', color: '#C8E6C9', title: 'Free Delivery', subtitle: 'On orders above ₹199' },
    { id: '3', color: '#BBDEFB', title: 'Summer Special', subtitle: 'Cold drinks & ice creams' },
]

const BannerCarousel = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-4 pl-4">
        {BANNERS.map((banner) => (
            <View key={banner.id} style={{ backgroundColor: banner.color, width: width * 0.75 }} className="h-40 rounded-2xl mr-4 p-5 justify-between">
                <View>
                    <Text className="text-2xl font-bold text-gray-800">{banner.title}</Text>
                    <Text className="text-base text-gray-700 mt-1">{banner.subtitle}</Text>
                </View>
                <TouchableOpacity className="bg-black/80 self-start px-4 py-2 rounded-lg">
                    <Text className="text-white font-bold text-xs">Shop Now</Text>
                </TouchableOpacity>
            </View>
        ))}
        <View className="w-1" />
    </ScrollView>
)

export default BannerCarousel
