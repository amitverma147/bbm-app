import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { Image as ExpoImage } from "expo-image";
import LottieView from "lottie-react-native";
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
import { useLocation } from "../contexts/LocationContext";
import { useAuth } from "../contexts/AuthContext";
import { searchAll } from "../services/searchService";
import LocationPickerModal from "./LocationPickerModal";
import AddressDetailsFormModal from "./AddressDetailsFormModal";
import AddressListModal from "./AddressListModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants/Config";
const logoImage = require('../assets/BigBestMart.gif');

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
  const pathname = usePathname();
  const {
    location,
    pincode,
    selectedAddress,
    fetchAddresses,
    setSelectedAddress,
  } = useLocation();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // -- Location Modal State --
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showAddressList, setShowAddressList] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<any>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // -- Search & Debounce State --
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Debounce hook effect
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        setIsSearching(true);
        try {
          const res = await searchAll(searchQuery.trim());
          if (res.success) {
            setSearchResults(res.results);
            setShowDropdown(true);
          }
        } catch (e) {
          console.error("Search error:", e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults(null);
        setShowDropdown(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // -- Search Handler --
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!showDropdown && text.length > 2) setShowDropdown(true);
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
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        Alert.alert("Login Required", "Please login to save your address.");
        router.push("/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/user/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addressData),
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
    ? `${selectedAddress.address_line_1 || selectedAddress.street_address || ""}, ${selectedAddress.city}`
    : location
      ? location
      : "Select Location";

  return (
    <SafeAreaView edges={["top"]} className="bg-white z-50">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View className="bg-white pb-4 shadow-sm border-b border-gray-100 rounded-b-[24px] z-50">
        {/* Quick Tabs - Tab View */}
        <View className="flex-row items-center justify-between px-4 pt-3 pb-2 w-full">
          {QUICK_ACCESS.map((item) => {
            const isActive =
              (pathname === "/eato" && item.title === "Eato") ||
              (pathname === "/star" && item.title === "Star") ||
              (pathname === "/bazaar" && item.title === "Bazaar") ||
              (pathname !== "/eato" && pathname !== "/star" && pathname !== "/bazaar" && item.title === "QWIK");

            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  if (item.title === "QWIK") router.push("/");
                  else if (item.title === "Eato") router.push("/eato" as any);
                  else if (item.title === "Star") router.push("/star" as any);
                  else if (item.title === "Bazaar") router.push("/bazaar" as any);
                }}
                className={`flex-1 mx-1 flex-col items-center justify-center py-2.5 rounded-[14px] border ${isActive
                  ? "bg-orange-50 border-orange-300"
                  : "bg-white border-gray-200"
                  } shadow-sm`}
              >
                {item.title === "QWIK" ? (
                  <LottieView
                    source={{ uri: 'https://lottie.host/3c3cae43-2f5a-4ff4-8e94-695b04f65270/YlL23dpNak.lottie' }}
                    autoPlay
                    loop
                    speed={3}
                    style={{ width: 32, height: 32, marginBottom: 2 }}
                  />
                ) : (
                  <Ionicons
                    name={
                      item.title === "Eato"
                        ? "restaurant"
                        : item.title === "Star"
                          ? "star"
                          : "grid"
                    }
                    size={22}
                    color={isActive ? "#EA580C" : item.color}
                    style={{ marginBottom: 4 }}
                  />
                )}
                <Text
                  className={`text-[11px] font-black ${isActive ? "text-orange-700" : "text-gray-700"
                    }`}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Middle Row: Brand & Location + Actions */}
        <View className="flex-row items-center justify-between px-5 pt-2 pb-3">
          {/* Left: Brand & Location */}
          <TouchableOpacity
            className="flex-1 mr-4"
            onPress={handleLocationPress}
          >
            <View className="flex-row items-center ">
              <ExpoImage
                source={logoImage}
                style={{ width: 60, height: 60 }}
                contentFit="cover"
                autoplay={true}
              />
              <Text style={{ fontFamily: 'Montserrat_800ExtraBold', fontSize: 18, color: '#111827', letterSpacing: -0.5, marginLeft: 2 }}>
                BIG<Text style={{ color: '#EA580C' }}>BEST</Text>MART
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
        <View className="px-5 mb-2 relative z-50">
          <View className="flex-row items-center bg-white rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border border-gray-100 h-14 px-4 z-50">
            <Ionicons name="search" size={22} color="#F97316" />
            <TextInput
              placeholder="Search explicitly..."
              className="flex-1 mx-3 text-gray-800 text-[15px] font-medium"
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={handleSearch}
              onFocus={() => {
                if (searchQuery.length > 2) setShowDropdown(true);
              }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            />
            {isSearching ? (
              <View className="mr-2">
                <Text className="text-xs text-gray-400">...</Text>
              </View>
            ) : null}
            <View className="h-6 w-[1px] bg-gray-200 mx-2" />
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={searchQuery ? "#64748B" : "transparent"} />
            </TouchableOpacity>
          </View>

          {/* Search Dropdown */}
          {showDropdown && (searchQuery.length > 2) && (
            <View
              className="absolute top-16 left-5 right-5 bg-white rounded-xl shadow-lg border border-gray-100 p-2 max-h-80 overflow-hidden"
              style={{ zIndex: 9999, elevation: 10 }}
            >
              <ScrollView keyboardShouldPersistTaps="handled">
                {isSearching ? (
                  <View className="py-4 items-center">
                    <Text className="text-gray-500 text-sm">Searching...</Text>
                  </View>
                ) : searchResults?.total > 0 ? (
                  <>
                    {/* Products */}
                    {searchResults.products?.length > 0 && (
                      <View className="mb-2">
                        <Text className="text-xs font-bold text-gray-400 mb-1 px-2 uppercase tracking-wider">Products</Text>
                        {searchResults.products.map((product: any) => (
                          <TouchableOpacity
                            key={product.id}
                            className="flex-row items-center p-2 rounded-lg active:bg-orange-50"
                            onPress={() => {
                              setShowDropdown(false);
                              router.push(`/product/${product.id}`);
                            }}
                          >
                            <Ionicons name="search-outline" size={16} color="#9CA3AF" className="mr-2" />
                            <View className="flex-1 ml-2">
                              <Text className="text-sm text-gray-800 font-medium" numberOfLines={1}>{product.name}</Text>
                              {product.category && (
                                <Text className="text-[10px] text-gray-500 mt-0.5">in {product.category}</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* Categories */}
                    {searchResults.categories?.length > 0 && (
                      <View className="mb-2">
                        <Text className="text-xs font-bold text-gray-400 mb-1 px-2 uppercase tracking-wider">Categories</Text>
                        {searchResults.categories.map((cat: any, i: number) => (
                          <TouchableOpacity
                            key={i}
                            className="flex-row items-center p-2 rounded-lg active:bg-orange-50"
                            onPress={() => {
                              setShowDropdown(false);
                              router.push(`/category/${cat.id}` as any);
                            }}
                          >
                            <Ionicons name="apps-outline" size={16} color="#9CA3AF" className="mr-2" />
                            <Text className="text-sm text-gray-800 ml-2 font-medium" numberOfLines={1}>{cat.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* Subcategories */}
                    {searchResults.subcategories?.length > 0 && (
                      <View className="mb-2">
                        <Text className="text-xs font-bold text-gray-400 mb-1 px-2 uppercase tracking-wider">Subcategories</Text>
                        {searchResults.subcategories.map((sub: any, i: number) => (
                          <TouchableOpacity
                            key={i}
                            className="flex-row items-center p-2 rounded-lg active:bg-orange-50"
                            onPress={() => {
                              setShowDropdown(false);
                              router.push(`/category/${sub.id}` as any);
                            }}
                          >
                            <Ionicons name="pricetag-outline" size={16} color="#9CA3AF" className="mr-2" />
                            <Text className="text-sm text-gray-800 ml-2 font-medium" numberOfLines={1}>{sub.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* Brands */}
                    {searchResults.brands?.length > 0 && (
                      <View className="mb-2">
                        <Text className="text-xs font-bold text-gray-400 mb-1 px-2 uppercase tracking-wider">Brands</Text>
                        {searchResults.brands.map((brand: any, i: number) => (
                          <TouchableOpacity
                            key={i}
                            className="flex-row items-center p-2 rounded-lg active:bg-orange-50"
                            onPress={() => {
                              setShowDropdown(false);
                              router.push(`/brand/${brand.name}` as any);
                            }}
                          >
                            <Ionicons name="ribbon-outline" size={16} color="#9CA3AF" className="mr-2" />
                            <Text className="text-sm text-gray-800 ml-2 font-medium" numberOfLines={1}>{brand.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* Stores */}
                    {searchResults.stores?.length > 0 && (
                      <View className="mb-2">
                        <Text className="text-xs font-bold text-gray-400 mb-1 px-2 uppercase tracking-wider">Stores</Text>
                        {searchResults.stores.map((store: any, i: number) => (
                          <TouchableOpacity
                            key={i}
                            className="flex-row items-center p-2 rounded-lg active:bg-orange-50"
                            onPress={() => {
                              setShowDropdown(false);
                              router.push(`/store/${store.id}` as any);
                            }}
                          >
                            <Ionicons name="storefront-outline" size={16} color="#9CA3AF" className="mr-2" />
                            <Text className="text-sm text-gray-800 ml-2 font-medium" numberOfLines={1}>{store.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    <TouchableOpacity
                      className="py-3 items-center border-t border-gray-100 mt-1"
                      onPress={() => {
                        setShowDropdown(false);
                        router.push(`/search?q=${searchQuery}` as any);
                      }}
                    >
                      <Text className="text-orange-600 font-bold text-sm">See all {searchResults.total} results for "{searchQuery}"</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View className="py-6 items-center">
                    <Text className="text-gray-500 font-medium mb-1">No matches found</Text>
                    <Text className="text-xs text-gray-400 text-center px-4">Try searching for products, categories, or brands</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>
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
