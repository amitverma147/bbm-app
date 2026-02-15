import { View } from 'react-native'
import React from 'react'
import Header from '../../components/Header'
import DynamicHome from '../../components/DynamicHome'
import QuickCategories from '../../components/QuickCategories'

const Home = () => {
  return (
    <View className="flex-1 bg-white">
      <Header />
      <DynamicHome ListHeaderComponent={<QuickCategories />} />
      <View className="absolute bottom-0 left-0 right-0 h-20 bg-transparent pointer-events-none" />
    </View>
  )
}

export default Home