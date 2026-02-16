import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../contexts/CartContext";
import { useLocation } from "../contexts/LocationContext";
import { useAuth } from "../contexts/AuthContext";
import { searchAll } from "../services/searchService";
import LocationPickerModal from "./LocationPickerModal";
import AddressDetailsFormModal from "./AddressDetailsFormModal";
import AddressListModal from "./AddressListModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants/Config";


const QUICK_ACCESS = [
  {
    id: "1",
    title: "QWIK",
    active: true,
    color: "#E11D48",
    borderColor: "#FECDD3",
  },
  {
    id: "2",
    title: "Eato",
    active: false,
    color: "#059669",
    borderColor: "#6EE7B7",
  },
  {
    id: "3",
    title: "Star",
    active: false,
    color: "#2A2B75",
    borderColor: "#E8C488",
  },
  {
    id: "4",
    title: "Bazaar",
    active: false,
    color: "#7C3AED",
    borderColor: "#C4B5FD",
  },
];

const Header = () => {
  const router = useRouter();
  const { getCartTotal } = useCart();
  const { location, pincode, selectedAddress, fetchAddresses, setSelectedAddress } = useLocation();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const cartTotal = getCartTotal();

  // -- Location Modal State --
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showAddressList, setShowAddressList] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<any>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // -- Search Handler --
  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length > 2) {
      try {
        const results = await searchAll(text);
        console.log("Search results:", results);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // -- Location Handlers --
  const handleLocationPress = () => {
    setShowAddressList(true);
  };

  const handleAddNewAddress = () => {
    setShowAddressList(false);
    setTimeout(() => setShowLocationPicker(true), 500);
  };

  const handleSelectAddress = (address: any) => {
    setSelectedAddress(address);
    setShowAddressList(false);
  };

  const handleLocationPicked = (loc: any) => {
    setPickedLocation(loc);
    setShowLocationPicker(false);
    setTimeout(() => setShowAddressForm(true), 500); // Small delay for smooth transition
  };

  const handleSaveAddress = async (addressData: any) => {
    setIsSavingAddress(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        Alert.alert("Login Required", "Please login to save your address.");
        router.push("/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/user/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(addressData)
      });

      const result = await response.json();

      if (result.success) {
        setShowAddressForm(false);
        fetchAddresses(); // Refresh addresses in context
        Alert.alert("Success", "Address saved successfully");

        // Optimistically select the new address
        if (result.address || result.data) {
          const rawAddr = result.address || result.data;
          // Normalize the address to match what GET /user/addresses returns
          const normalizedAddr = {
            ...rawAddr,
            address_line_1: rawAddr.address_line_1 || rawAddr.street_address,
            // Ensure other fields are present if needed
          };
          setSelectedAddress(normalizedAddr);
        }
      } else {
        Alert.alert("Error", result.message || "Failed to save address");
      }

    } catch (error) {
      console.error("Save address error:", error);
      Alert.alert("Error", "Something went wrong while saving address");
    } finally {
      setIsSavingAddress(false);
    }
  };


  // Determine display string for location
  const displayLocation = selectedAddress
    ? `${selectedAddress.address_line_1 || selectedAddress.street_address || ''}, ${selectedAddress.city}`
    : (location ? location : "Select Location");

  return (
    <SafeAreaView edges={["top"]} className="bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View className="bg-white pb-4 shadow-sm border-b border-gray-100 rounded-b-[24px]">
        {/* Top Row: Brand & Location + Actions */}
        <View className="flex-row items-center justify-between px-5 pt-3 pb-4">
          {/* Left: Brand & Location */}
          <TouchableOpacity
            className="flex-1 mr-4"
            onPress={handleLocationPress}
          >
            <View className="flex-row items-center mb-1">
              <View className="bg-orange-600 rounded-lg p-1 mr-2 shadow-sm">
                <Ionicons name="cart" size={14} color="white" />
              </View>
              <Text className="text-xl font-black text-gray-900 tracking-tight">
                BigBest<Text className="text-orange-600">Mart</Text>
              </Text>
            </View>

            <View className="flex-row items-center bg-gray-50 self-start px-2 py-1 rounded-full border border-gray-100">
              <Ionicons name="location" size={12} color="#EA580C" />
              <Text
                className="text-[11px] font-bold text-gray-700 ml-1 mr-1 max-w-[120px]"
                numberOfLines={1}
              >
                {displayLocation}
              </Text>
              <Ionicons name="chevron-down" size={12} color="#9CA3AF" />
            </View>
          </TouchableOpacity>

          {/* Right: Actions */}
          <View className="flex-row items-start gap-4">
            {/* Wallet / Cart */}
            <TouchableOpacity
              onPress={() => router.push("/cart")}
              className="items-center"
            >
              <View className="relative">
                <View className="bg-gray-50 w-10 h-10 rounded-full items-center justify-center border border-gray-100 shadow-sm">
                  <Ionicons
                    name="bag-handle-outline"
                    size={20}
                    color="#1F2937"
                  />
                </View>
                {cartTotal > 0 && (
                  <View className="absolute -top-1 -right-1 bg-orange-600 w-4 h-4 rounded-full items-center justify-center border-[1.5px] border-white">
                    <Text className="text-[8px] font-bold text-white">{cartTotal}</Text>
                  </View>
                )}
              </View>
              <Text className="text-[10px] font-bold text-gray-900 mt-1">
                CART
              </Text>
            </TouchableOpacity>

            {/* Profile */}
            <TouchableOpacity
              onPress={() => router.push("/profile")}
              className="items-center"
            >
              <View className="bg-gray-900 w-10 h-10 rounded-full items-center justify-center shadow-lg shadow-orange-200">
                <Ionicons name="person" size={18} color="white" />
              </View>
              <Text className="text-[10px] font-bold text-transparent mt-1">
                .
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar - Floating effect */}
        <View className="px-5 mb-5 relative z-10">
          <View className="flex-row items-center bg-white rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border border-gray-100 h-14 px-4">
            <Ionicons name="search" size={22} color="#F97316" />
            <TextInput
              placeholder="Search explicitly..."
              className="flex-1 mx-3 text-gray-800 text-[15px] font-medium"
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={handleSearch}
            />
            <View className="h-6 w-[1px] bg-gray-200 mx-2" />
            <TouchableOpacity>
              <Ionicons name="mic" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Tabs - Modern Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          className="pb-1"
        >
          {QUICK_ACCESS.map((item) => (
            <TouchableOpacity
              key={item.id}
              className={`mr-3 flex-row items-center px-4 py-2.5 rounded-2xl border ${item.active
                ? "bg-gray-900 border-gray-900 shadow-md"
                : "bg-white border-gray-200"
                }`}
            >
              <Ionicons
                name={
                  item.title === "QWIK"
                    ? "flash"
                    : item.title === "Eato"
                      ? "restaurant"
                      : item.title === "Star"
                        ? "star"
                        : "grid"
                }
                size={16}
                color={item.active ? "#FDBA74" : "#64748B"}
                className="mr-2"
              />
              <Text
                className={`text-xs font-bold ml-1.5 ${item.active ? "text-white" : "text-gray-600"
                  }`}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Modals for Location Selection */}
      <AddressListModal
        visible={showAddressList}
        onClose={() => setShowAddressList(false)}
        onAddNew={handleAddNewAddress}
        onSelect={handleSelectAddress}
      />

      <LocationPickerModal
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onConfirm={handleLocationPicked}
      />

      <AddressDetailsFormModal
        visible={showAddressForm}
        onClose={() => setShowAddressForm(false)}
        onBack={() => {
          setShowAddressForm(false);
          setShowLocationPicker(true);
        }}
        onSave={handleSaveAddress}
        initialLocation={pickedLocation}
        loading={isSavingAddress}
      />

    </SafeAreaView>
  );
};

export default Header;
