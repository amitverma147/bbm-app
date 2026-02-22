// Buy Again Tab Component
import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import OrdersSection from "../../components/profile/OrdersSection";
import TrackOrderSection from "../../components/profile/TrackOrderSection";

const BuyAgainScreen = () => {
  const [activeTab, setActiveTab] = useState("orders");

  const tabs = [
    { id: "orders", label: "Orders" },
    { id: "track", label: "Track" },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white pt-12 pb-2 px-4 shadow-sm z-10">
        <Text className="text-2xl font-black text-gray-900 mb-4">My Orders</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className={`px-6 py-2 rounded-full border ${isActive ? "bg-[#FF6B00] border-[#FF6B00]" : "bg-white border-gray-200"
                  }`}
              >
                <Text
                  className={`font-bold ${isActive ? "text-white" : "text-gray-600"
                    }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View className="flex-1 p-4">
        {activeTab === "orders" ? <OrdersSection /> : <TrackOrderSection />}
      </View>
    </View>
  );
};

export default BuyAgainScreen;
