import { View, Text, SafeAreaView } from 'react-native'
import React from 'react'

const MenuScreen = () => {
    return (
        <SafeAreaView className="flex-1 justify-center items-center bg-white">
            <Text className="text-xl font-bold text-gray-800">Menu</Text>
            <Text className="text-gray-500 mt-2">Account settings and more.</Text>
        </SafeAreaView>
    )
}

export default MenuScreen
