import {
    Feather,
    Ionicons,
    MaterialIcons
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const USER_DATA = {
  name: "ABHISHEK KUMAR",
  phone: "73886 06785",
  initial: "A",
};

const MenuItem = ({ icon, title, subtitle, onPress }: any) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center py-4 border-b border-dashed border-gray-100"
  >
    <View className="mr-4">{icon}</View>
    <View className="flex-1">
      <Text className="text-[15px] font-semibold text-gray-900">{title}</Text>
      {subtitle && (
        <Text className="text-xs text-gray-500 mt-0.5">{subtitle}</Text>
      )}
    </View>
    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
  </TouchableOpacity>
);

const SectionHeader = ({ title }: { title: string }) => (
  <Text className="text-base font-bold text-gray-900 mb-2 mt-6">{title}</Text>
);

const Profile = () => {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={["top"]} className="bg-white flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 bg-white">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full border border-gray-100 items-center justify-center mr-3 bg-gray-50 active:bg-gray-200"
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 tracking-tight">
            Settings
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          className="bg-gray-50/50"
        >
          {/* User Info - Premium Card */}
          <View className="mx-4 mt-0 p-5 bg-white rounded-b-3xl shadow-sm border-x border-b border-gray-100 flex-row items-center mb-6">
            <View className="w-16 h-16 rounded-full bg-orange-100 items-center justify-center mr-4 border border-orange-200">
              <Text className="text-2xl font-black text-orange-600">
                {USER_DATA.initial}
              </Text>
            </View>
            <View>
              <Text className="text-xl font-black text-gray-900 mb-1 tracking-tight">
                {USER_DATA.name}
              </Text>
              <Text className="text-gray-500 font-medium tracking-wide">
                {USER_DATA.phone}
              </Text>
              <TouchableOpacity className="mt-2 flex-row items-center">
                <Text className="text-orange-600 font-bold text-xs mr-1">
                  Edit Profile
                </Text>
                <Ionicons name="chevron-forward" size={12} color="#EA580C" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions Grid - Elevated */}
          <View className="flex-row justify-between px-4 mt-6 mb-6">
            {[
              {
                icon: <Feather name="shopping-bag" size={24} color="#EA580C" />,
                label: "Your\nOrders",
                route: "/orders",
              },
              {
                icon: (
                  <MaterialIcons
                    name="support-agent"
                    size={24}
                    color="#EA580C"
                  />
                ),
                label: "Help &\nSupport",
                route: "/support",
              },
              {
                icon: <Feather name="heart" size={24} color="#EA580C" />,
                label: "Your\nWishlist",
                route: "/wishlist",
              },
            ].map((item, idx) => (
              <TouchableOpacity
                key={idx}
                className="bg-white p-4 rounded-2xl w-[31%] items-center justify-center shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-50 h-28 active:scale-95 transition-transform"
              >
                <View className="mb-3 bg-orange-50 p-3 rounded-full">
                  {item.icon}
                </View>
                <Text className="text-xs font-bold text-gray-800 text-center leading-4">
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Wallet Banner - Modern Gradient Look */}
          <View className="mx-4 mb-8">
            <View className="bg-gray-900 rounded-3xl overflow-hidden shadow-lg shadow-gray-300">
              <TouchableOpacity className="flex-row justify-between items-center p-5 border-b border-gray-800">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-xl bg-orange-500 items-center justify-center mr-4 shadow-lg shadow-orange-900/50">
                    <Ionicons name="wallet" size={20} color="white" />
                  </View>
                  <View>
                    <Text className="font-bold text-white text-lg">
                      BigBest Wallet
                    </Text>
                    <Text className="text-gray-400 text-xs font-medium">
                      Safe & Secure Payments
                    </Text>
                  </View>
                </View>
                <View className="bg-gray-800/50 p-2 rounded-full">
                  <Ionicons name="chevron-forward" size={20} color="white" />
                </View>
              </TouchableOpacity>
              <View className="flex-row justify-between items-center px-5 py-4 bg-gray-800">
                <Text className="text-gray-400 font-medium">
                  Balance:{" "}
                  <Text className="font-bold text-white text-lg">₹0</Text>
                </Text>
                <TouchableOpacity className="bg-white px-5 py-2 rounded-xl shadow-sm active:bg-gray-100">
                  <Text className="text-xs font-black text-gray-900 uppercase tracking-wider">
                    Add Money
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Your Information Section */}
          <View className="bg-white px-5 py-4 mx-4 rounded-3xl shadow-sm border border-gray-100 mb-6">
            <SectionHeader title="Account Settings" />

            <MenuItem
              icon={<Feather name="heart" size={20} color="#4B5563" />}
              title="Your Wishlist"
              onPress={() => {}}
            />
            <MenuItem
              icon={<Ionicons name="card-outline" size={20} color="#4B5563" />}
              title="E-Gift Cards"
              onPress={() => {}}
            />
            <MenuItem
              icon={
                <Ionicons name="location-outline" size={20} color="#4B5563" />
              }
              title="Saved Addresses"
              subtitle="2 Addresses"
              onPress={() => {}}
            />
            <MenuItem
              icon={
                <Ionicons name="person-outline" size={20} color="#4B5563" />
              }
              title="Profile Settings"
              onPress={() => {}}
            />
            <MenuItem
              icon={
                <Ionicons name="wallet-outline" size={20} color="#4B5563" />
              }
              title="Payment Methods"
              onPress={() => {}}
            />
          </View>

          {/* Other Information Section */}
          <View className="bg-white px-5 py-4 mx-4 rounded-3xl shadow-sm border border-gray-100 mb-8">
            <SectionHeader title="App Settings" />

            <MenuItem
              icon={
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color="#4B5563"
                />
              }
              title="Notifications"
              onPress={() => {}}
            />
            <MenuItem
              icon={
                <Ionicons name="language-outline" size={20} color="#4B5563" />
              }
              title="Language"
              subtitle="English"
              onPress={() => {}}
            />
            <MenuItem
              icon={
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#4B5563"
                />
              }
              title="About Us"
              onPress={() => {}}
            />
          </View>

          {/* Logout */}
          <View className="px-4 mb-2">
            <TouchableOpacity className="bg-red-50 border border-red-100 py-4 rounded-2xl items-center flex-row justify-center active:bg-red-100">
              <Ionicons
                name="log-out-outline"
                size={20}
                color="#EF4444"
                className="mr-2"
              />
              <Text className="font-bold text-red-600 text-base">Log Out</Text>
            </TouchableOpacity>
            <Text className="text-center text-gray-300 text-[10px] mt-6 font-bold tracking-widest uppercase">
              Version 26.2.3
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default Profile;
