import { Feather, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../../contexts/CartContext";
import { useLocation } from "../../contexts/LocationContext";
import { useDelivery } from "../../contexts/DeliveryChargeContext";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../constants/Config";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import * as CouponOnApi from "../../services/couponService";

import LocationPickerModal from '../../components/LocationPickerModal';
import AddressDetailsFormModal from '../../components/AddressDetailsFormModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get("window");

const CartScreen = () => {
  const { cartItems, getCartTotal, updateQuantity, removeFromCart, deleteFromCart } = useCart();
  const { pincode, location, selectedAddress, addresses, fetchAddresses, setSelectedAddress, isLoadingAddresses } = useLocation();
  const { getDeliverySettings, getUpsellMessage, defaultDeliveryCharge } = useDelivery();
  const router = useRouter();
  const { currentUser } = useAuth();

  const [isBillDetailsOpen, setIsBillDetailsOpen] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityData, setAvailabilityData] = useState<any>({});
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // Charges State
  const [charges, setCharges] = useState({
    handling_charge: 0,
    surge_charge: 0,
    platform_charge: 0,
    delivery_charge: 0,
    discount_charge: 0,
  });
  const [loadingCharges, setLoadingCharges] = useState(false);

  // Coupon State
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLockToken, setCouponLockToken] = useState<string | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Address Modal State
  const [showAddressModal, setShowAddressModal] = useState(false);

  // New Address Flow State
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<any>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // --- Handlers for New Address Flow ---

  const handleAddNewAddress = () => {
    setShowAddressModal(false);
    setShowLocationPicker(true);
  };

  const handleLocationPicked = (location: any) => {
    setPickedLocation(location);
    setShowLocationPicker(false);
    setTimeout(() => setShowAddressForm(true), 500); // Small delay
  };

  const handleSaveAddress = async (addressData: any) => {
    setIsSavingAddress(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert("Error", "You must be logged in to save an address");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/user-addresses`, {
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
        setShowAddressModal(true);
        fetchAddresses(); // Refresh list via context
        Alert.alert("Success", "Address saved successfully");
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


  // --- Calculations ---

  // 1. Item Total (Selling Price)
  const itemTotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price as string) || 0;
      const quantity = parseInt(item.quantity as any) || 1;
      return total + price * quantity;
    }, 0);
  }, [cartItems]);

  // 2. Original Item Total (MRP)
  const originalItemTotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price as string) || 0;
      const oldPrice = parseFloat(
        item.oldPrice || item.old_price || item.variant?.old_price || item.variant?.oldPrice || 0
      );
      const effectivePrice = Math.max(oldPrice, price);
      const quantity = parseInt(item.quantity as any) || 1;
      return total + effectivePrice * quantity;
    }, 0);
  }, [cartItems]);

  // 3. Fee Total
  const feeTotal = charges.handling_charge + charges.surge_charge + charges.platform_charge;

  // 4. Delivery Charge & Milestone Discount
  const deliverySettings = getDeliverySettings(itemTotal);
  const deliveryCharge = parseFloat(deliverySettings.charge as any) || 0;
  const milestoneDiscount = parseFloat(deliverySettings.appliedMilestone?.discount as any) || 0;

  // 5. Grand Total to Pay
  // Logic: ItemTotal + Fees + Delivery - MilestoneDiscount - Coupon - GlobalDiscount
  const totalToPay = Math.max(0,
    itemTotal +
    feeTotal +
    deliveryCharge -
    (milestoneDiscount || 0) -
    couponDiscount -
    charges.discount_charge
  );

  // 6. Savings Calculation
  const deliverySavings = Math.max(0, defaultDeliveryCharge - deliveryCharge);

  const totalSavings = (originalItemTotal - itemTotal) +
    deliverySavings +
    couponDiscount +
    charges.discount_charge +
    (milestoneDiscount || 0);


  // --- Side Effects ---

  // Fetch Charges
  useEffect(() => {
    const fetchCharges = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/charge-settings`);
        const data = await response.json();

        if (data.success && data.data) {
          const milestoneSurcharge = parseFloat(deliverySettings.surcharge as any) || 0;
          setCharges({
            handling_charge: parseFloat(data.data.handling_charge) || 0,
            surge_charge: milestoneSurcharge,
            platform_charge: parseFloat(data.data.platform_charge) || 0,
            discount_charge: parseFloat(data.data.discount_charge) || 0,
            delivery_charge: deliveryCharge,
          });
        }
      } catch (error) {
        // console.warn("Error fetching charges", error);
      }
    };
    fetchCharges();
  }, [cartItems.length, itemTotal, deliverySettings]);

  // Check Availability
  useEffect(() => {
    const verifyAvailability = async () => {
      if (cartItems.length === 0 || !pincode) return;
      setCheckingAvailability(true);
      try {
        const response = await fetch(`${API_BASE_URL}/productsroute/availability/check-cart`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cartItems.map((item) => ({
              product_id: item.id,
              variant_id: item.variant_id,
              quantity: item.quantity,
            })),
            pincode: pincode,
          }),
        });
        const data = await response.json();
        if (data.success) {
          const newAvailability: any = {};
          data.items.forEach((item: any) => {
            const key = item.variant_id ? `${item.product_id}-${item.variant_id}` : String(item.product_id);
            newAvailability[key] = item;
          });
          setAvailabilityData(newAvailability);
        }
      } catch (error) {
        console.warn("Availability check failed", error);
      } finally {
        setCheckingAvailability(false);
      }
    };
    verifyAvailability();
  }, [cartItems.length, pincode]);

  // Fetch Related Products
  useEffect(() => {
    const fetchRelated = async () => {
      if (cartItems.length === 0) return;
      setLoadingRelated(true);
      try {
        const productIds = cartItems.map(i => i.id);
        const response = await fetch(`${API_BASE_URL}/productsroute/related`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_ids: productIds })
        });
        const data = await response.json();
        if (data.success) {
          setRelatedProducts(data.products || []);
        }
      } catch (error) {
        console.warn("Failed to fetch related products", error);
      } finally {
        setLoadingRelated(false);
      }
    };
    fetchRelated();
  }, [cartItems.length]);

  // Fetch Coupons when modal opens
  useEffect(() => {
    if (showCouponsModal) {
      const fetchCoupons = async () => {
        const token = null; // Replace with auth token logic if needed
        const result = await CouponOnApi.getAvailableCoupons(itemTotal + feeTotal, token);
        if (result.success) {
          setAvailableCoupons(result.data || []);
        }
      };
      fetchCoupons();
    }
  }, [showCouponsModal, itemTotal, feeTotal]);

  // Fetch Addresses when Address Modal Opens
  useEffect(() => {
    if (showAddressModal) {
      fetchAddresses();
    }
  }, [showAddressModal]);

  // --- Handlers ---

  const handleApplyCoupon = async (code: string) => {
    if (!code) return;
    setCouponLoading(true);
    setCouponError("");

    try {
      const token = null;
      const sessionId = `session_${Date.now()}`;
      const cartData = {
        user_id: currentUser?.id || null,
        items: cartItems.map(item => ({
          product_id: item.id,
          variant_id: item.variant_id || null,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal: itemTotal,
        total: itemTotal + feeTotal
      };

      const result = await CouponOnApi.applyCoupon(code, cartData, sessionId, token);

      if (result.success) {
        setCouponDiscount(result.data.discount);
        setAppliedCoupon(result.data.coupon);
        setCouponLockToken(result.data.lockToken);
        setCouponCode("");
        setShowCouponsModal(false);
        Alert.alert("Success", `Coupon ${code} applied! Saved ₹${result.data.discount}`);
      } else {
        setCouponError(result.error || "Failed to apply coupon");
      }
    } catch (e) {
      setCouponError("An unexpected error occurred");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    if (!couponLockToken) {
      setCouponDiscount(0);
      setAppliedCoupon(null);
      return;
    }
    await CouponOnApi.removeCoupon(couponLockToken, null);
    setCouponDiscount(0);
    setAppliedCoupon(null);
    setCouponLockToken(null);
  };

  const handleSelectAddress = (address: any) => {
    setSelectedAddress(address);
    setShowAddressModal(false);
  };

  // --- Render Items ---

  const renderItem = ({ item }: { item: any }) => {
    const key = item.variant_id ? `${item.id}-${item.variant_id}` : String(item.id);
    const availability = availabilityData[key];
    const isUnavailable = availability && !availability.available;

    return (
      <Animated.View
        entering={FadeInUp}
        className={`bg-white p-4 mb-3 rounded-2xl flex-row items-center shadow-sm mx-4 ${isUnavailable ? 'opacity-60 border border-red-200 bg-red-50' : ''}`}
      >
        <View className="relative">
          <Image
            source={{ uri: item.image || item.image_url || "https://example.com/placeholder.png" }}
            className="w-20 h-20 rounded-xl bg-gray-100"
            resizeMode="cover"
          />
          {isUnavailable && (
            <View className="absolute inset-0 bg-black/40 rounded-xl items-center justify-center">
              <Feather name="x-circle" size={24} color="white" />
            </View>
          )}
        </View>

        <View className="flex-1 ml-4 justify-between h-20">
          <View>
            <Text numberOfLines={1} className="font-bold text-gray-800 text-base">
              {item.name}
            </Text>
            <Text className="text-gray-500 text-xs mt-0.5">
              {item.variant_name || item.unit || "1 pack"}
            </Text>

            {isUnavailable ? (
              <Text className="text-[10px] text-red-600 font-bold mt-1">Not available at {pincode || 'location'}</Text>
            ) : availability?.delivery_message ? (
              <View className="flex-row items-center mt-1">
                <Feather name="truck" size={10} color="#16a34a" />
                <Text className="text-[10px] text-green-600 ml-1">{availability.delivery_message}</Text>
              </View>
            ) : null}
          </View>

          <View className="flex-row justify-between items-center">
            <View>
              <Text className="font-black text-[#FF6B00] text-lg">₹{item.price}</Text>
              {(() => {
                const price = parseFloat(item.price);
                const oldPrice = parseFloat(item.oldPrice || item.old_price || item.variant?.old_price || 0);
                if (oldPrice > price) {
                  return <Text className="text-xs text-gray-400 line-through">₹{oldPrice}</Text>;
                }
                return null;
              })()}
            </View>

            <View className="flex-row items-center bg-[#FF6B00] rounded-lg shadow-sm">
              <TouchableOpacity
                onPress={() => {
                  if (item.quantity > 1) {
                    updateQuantity(item.id, item.quantity - 1);
                  } else {
                    deleteFromCart(item);
                  }
                }}
                className="p-1 px-2"
              >
                <Feather name="minus" size={16} color="white" />
              </TouchableOpacity>

              <Text className="font-bold text-white px-2 text-sm">{item.quantity}</Text>

              <TouchableOpacity
                onPress={() => updateQuantity(item.id, item.quantity + 1)}
                className="p-1 px-2"
              >
                <Feather name="plus" size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  if (cartItems.length === 0) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50 items-center justify-center p-6">
        <Animated.View entering={FadeInDown} className="items-center">
          <View className="w-48 h-48 bg-orange-100 rounded-full items-center justify-center mb-6 shadow-sm">
            <Ionicons name="cart-outline" size={80} color="#FF6B00" />
          </View>
          <Text className="text-2xl font-black text-gray-800 mb-2"> Your cart is empty </Text>
          <Text className="text-gray-500 text-center mb-8 px-4 leading-5">
            Add items to it now to get them delivered to your doorstep at lightning speed!
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/")}
            className="bg-[#FF6B00] py-4 px-10 rounded-2xl shadow-lg active:scale-95 transition-transform"
          >
            <Text className="text-white font-bold text-lg">Start Shopping</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  const { amountToNextTier, nextTier, progress } = (() => {
    const { amountToNextTier, nextTier } = deliverySettings;
    let p = 100;
    if (nextTier) {
      p = Math.min((itemTotal / nextTier.min_order_value) * 100, 100);
    }
    return { amountToNextTier, nextTier, progress: p };
  })();

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
      {/* Header / Location Bar */}
      <View className="bg-white px-4 pb-3 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-4 mt-2">
          <Text className="text-2xl font-black text-gray-900">Cart</Text>
          <TouchableOpacity className="bg-gray-100 p-2 rounded-full">
            <Feather name="share-2" size={18} color="#4b5563" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => setShowAddressModal(true)}
          className="flex-row items-center bg-orange-50 p-3 rounded-xl border border-orange-100 active:bg-orange-100"
        >
          <View className="bg-white p-1.5 rounded-lg shadow-sm">
            <MaterialIcons name="location-on" size={18} color="#FF6B00" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Delivering to</Text>
            <Text numberOfLines={1} className="text-sm font-bold text-gray-800">
              {selectedAddress
                ? `${selectedAddress.address_line_1}, ${selectedAddress.city} - ${selectedAddress.postal_code || selectedAddress.pincode}`
                : (pincode ? `${pincode}, ${location || 'Home'}` : 'Select delivery location')}
            </Text>
          </View>
          <Feather name="chevron-down" size={18} color="#FF6B00" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => `${item.id}-${item.variant_id || "default"}`}
        renderItem={renderItem}
        ListHeaderComponent={() => (
          <View>
            {/* Milestone Progress Bar */}
            {(nextTier || progress >= 100) && (
              <View className="mx-4 mt-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-xs font-bold text-gray-700">
                    {progress >= 100 ? "🎉 Free Delivery Unlocked!" : `Add ₹${amountToNextTier.toFixed(0)} more for FREE delivery`}
                  </Text>
                  <View className="bg-orange-100 px-2 py-0.5 rounded-md">
                    <Text className="text-[10px] font-black text-[#FF6B00]">{Math.round(progress)}%</Text>
                  </View>
                </View>
                <View className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <Animated.View
                    className="bg-[#FF6B00] h-2 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </View>
              </View>
            )}
            <View className="mt-4 mb-2 mx-4">
              <Text className="text-xs font-black text-gray-400 uppercase tracking-widest">Items in your cart</Text>
            </View>
          </View>
        )}
        ListFooterComponent={() => (
          <View className="pb-32">
            {/* Missed Something Section */}
            <View className="mx-4 mb-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex-row items-center justify-between">
              <Text className="font-bold text-gray-900">Missed something?</Text>
              <TouchableOpacity
                onPress={() => router.push("/")}
                className="bg-[#FF6B00] px-4 py-2 rounded-lg flex-row items-center"
              >
                <Feather name="plus" size={14} color="white" />
                <Text className="text-white text-xs font-bold ml-1">Add More</Text>
              </TouchableOpacity>
            </View>

            {/* Coupon Section */}
            {appliedCoupon ? (
              <View className="mx-4 mt-4 bg-green-50 p-4 rounded-2xl border border-green-200 flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="bg-green-100 p-2 rounded-xl">
                    <Feather name="check" size={20} color="#16a34a" />
                  </View>
                  <View className="ml-3">
                    <Text className="font-bold text-gray-800">{appliedCoupon.code}</Text>
                    <Text className="text-xs text-green-600 font-bold">Saved ₹{couponDiscount.toFixed(2)}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleRemoveCoupon}>
                  <Text className="text-red-500 font-bold text-xs uppercase">remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setShowCouponsModal(true)}
                className="bg-white mx-4 mt-4 p-4 rounded-2xl flex-row items-center border border-dashed border-green-300 shadow-sm"
              >
                <View className="bg-green-100 p-2 rounded-xl">
                  <MaterialIcons name="local-offer" size={20} color="#16a34a" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="font-bold text-gray-800">Apply Coupon</Text>
                  <Text className="text-xs text-gray-500">Save more on your order</Text>
                </View>
                <Text className="text-[#FF6B00] font-black mr-1">VIEW ALL</Text>
                <Feather name="chevron-right" size={16} color="#FF6B00" />
              </TouchableOpacity>
            )}

            {/* Bill Summary */}
            <View className="bg-white mx-4 mt-4 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <TouchableOpacity
                onPress={() => setIsBillDetailsOpen(!isBillDetailsOpen)}
                className="p-4 flex-row justify-between items-center bg-gray-50/50"
              >
                <View className="flex-row items-center">
                  <Feather name="file-text" size={18} color="#4b5563" />
                  <Text className="text-base font-bold text-gray-900 ml-2">Bill Summary</Text>
                </View>
                <Feather name={isBillDetailsOpen ? "chevron-up" : "chevron-down"} size={20} color="#9ca3af" />
              </TouchableOpacity>

              {isBillDetailsOpen && (
                <View className="p-4 pt-0 space-y-3">
                  <View className="flex-row justify-between pt-3">
                    <Text className="text-gray-500 text-sm">Item Total</Text>
                    <View className="flex-row items-center">
                      {originalItemTotal > itemTotal && (
                        <Text className="text-xs text-gray-400 line-through mr-2">₹{originalItemTotal.toFixed(0)}</Text>
                      )}
                      <Text className="text-gray-900 font-bold text-sm">₹{itemTotal.toFixed(0)}</Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-500 text-sm">Delivery Charge</Text>
                    <Text className={deliveryCharge === 0 ? "text-green-600 font-bold text-sm" : "text-gray-900 font-bold text-sm"}>
                      {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge.toFixed(0)}`}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-500 text-sm">Handling Charge</Text>
                    <Text className="text-gray-900 font-bold text-sm">₹{charges.handling_charge.toFixed(0)}</Text>
                  </View>
                  {charges.surge_charge > 0 && (
                    <View className="flex-row justify-between">
                      <Text className="text-gray-500 text-sm">Surge Charge</Text>
                      <Text className="text-gray-900 font-bold text-sm">₹{charges.surge_charge.toFixed(0)}</Text>
                    </View>
                  )}
                  <View className="flex-row justify-between">
                    <Text className="text-gray-500 text-sm">Platform Fee</Text>
                    <Text className="text-gray-900 font-bold text-sm">₹{charges.platform_charge.toFixed(0)}</Text>
                  </View>

                  {couponDiscount > 0 && (
                    <View className="flex-row justify-between">
                      <Text className="text-green-600 text-sm font-medium">Coupon Discount</Text>
                      <Text className="text-green-600 font-bold text-sm">-₹{couponDiscount.toFixed(2)}</Text>
                    </View>
                  )}

                  {milestoneDiscount > 0 && (
                    <View className="flex-row justify-between">
                      <Text className="text-green-600 text-sm font-medium">Delivery Discount</Text>
                      <Text className="text-green-600 font-bold text-sm">-₹{milestoneDiscount.toFixed(2)}</Text>
                    </View>
                  )}
                </View>
              )}

              <View className="p-4 border-t border-gray-50 flex-row justify-between items-center">
                <Text className="text-lg font-black text-gray-900">Grand Total</Text>
                <Text className="text-xl font-black text-[#FF6B00]">₹{totalToPay.toFixed(0)}</Text>
              </View>
            </View>

            {/* Super Savings Highlight */}
            <View className="mx-4 mt-4 bg-green-50 rounded-2xl p-4 border border-green-100 flex-row items-center">
              <View className="bg-green-100 p-2 rounded-full">
                <Ionicons name="sparkles" size={18} color="#16a34a" />
              </View>
              <Text className="flex-1 ml-3 text-sm font-bold text-green-800">
                You are saving ₹{totalSavings.toFixed(0)} on this order!
              </Text>
            </View>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <View className="mt-8">
                <View className="flex-row justify-between items-center px-4 mb-4">
                  <Text className="text-lg font-black text-gray-900 italic">You might also like</Text>
                  <TouchableOpacity>
                    <Text className="text-[#FF6B00] font-bold text-xs">MORE</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                  {relatedProducts.map((product, idx) => (
                    <TouchableOpacity
                      key={product.id}
                      className="mr-3 w-32 bg-white rounded-2xl p-2 shadow-sm border border-gray-100"
                      onPress={() => router.push(`/product/${product.id}` as any)}
                    >
                      <Image
                        source={{ uri: product.image_url || product.media?.[0]?.url || "https://example.com/placeholder.png" }}
                        className="w-full h-24 rounded-xl mb-2 bg-gray-50"
                        resizeMode="contain"
                      />
                      <Text numberOfLines={1} className="text-xs font-bold text-gray-800">{product.name}</Text>
                      <View className="flex-row justify-between items-center mt-1">
                        <Text className="text-[#FF6B00] font-black text-sm">₹{product.price}</Text>
                        <View className="bg-[#FF6B00] p-1 rounded-md">
                          <Feather name="plus" size={12} color="white" />
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Sticky Footer */}
      <View className="absolute bottom-0 w-full bg-white border-t border-gray-100 px-4 pt-4 pb-8 shadow-2xl">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <View className="bg-blue-50 p-2 rounded-lg">
              <Feather name="user" size={16} color="#3B82F6" />
            </View>
            <Text className="ml-2 text-xs font-bold text-gray-600">Ordering for <Text className="text-[#FF6B00]">{currentUser?.user_metadata?.full_name || "Customer"}</Text></Text>
          </View>
          <TouchableOpacity>
            <Text className="text-[#FF6B00] font-black text-xs">CHANGE</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className={`h-16 rounded-2xl flex-row items-center justify-between px-6 shadow-xl active:scale-95 ${!selectedAddress && !pincode ? 'bg-gray-400' : 'bg-[#FF6B00]'}`}
          disabled={!selectedAddress && !pincode}
          onPress={() => {
            if (!selectedAddress && !pincode) {
              Alert.alert("Missing Location", "Please select a delivery location first.");
              setShowAddressModal(true);
            } else {
              Alert.alert("Checkout", "Proceeding to checkout...");
            }
          }}
        >
          <View>
            <Text className="text-white font-black text-lg">₹{totalToPay.toFixed(0)}</Text>
            <Text className="text-white/80 text-[10px] uppercase font-bold tracking-widest">Grand Total</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-white font-black text-base mr-2">PLACE ORDER</Text>
            <Feather name="arrow-right" size={20} color="white" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Coupons Modal */}
      <Modal
        visible={showCouponsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCouponsModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl h-[80%] pt-6">
            <View className="px-6 flex-row justify-between items-center mb-6">
              <Text className="text-xl font-black text-gray-900">Apply Coupon</Text>
              <TouchableOpacity onPress={() => setShowCouponsModal(false)} className="bg-gray-100 p-2 rounded-full">
                <Feather name="x" size={20} color="black" />
              </TouchableOpacity>
            </View>

            <View className="px-6 mb-6">
              <View className="flex-row items-center border border-gray-200 rounded-xl p-2 pr-2">
                <TextInput
                  className="flex-1 px-3 font-bold text-gray-800"
                  placeholder="Enter coupon code"
                  placeholderTextColor="#9ca3af"
                  value={couponCode}
                  onChangeText={setCouponCode}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  onPress={() => handleApplyCoupon(couponCode)}
                  disabled={!couponCode || couponLoading}
                  className="bg-gray-900 py-3 px-6 rounded-lg"
                >
                  {couponLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text className="text-white font-bold text-xs uppercase">Apply</Text>
                  )}
                </TouchableOpacity>
              </View>
              {couponError ? <Text className="text-red-500 text-xs mt-2 ml-1">{couponError}</Text> : null}
            </View>

            <View className="bg-gray-50 flex-1 px-6 pt-6">
              <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Available Coupons</Text>
              <FlatList
                data={availableCoupons}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleApplyCoupon(item.code)}
                    className="bg-white p-4 rounded-xl border border-gray-200 mb-3 flex-row items-center justify-between"
                  >
                    <View className="border-l-4 border-[#FF6B00] pl-3">
                      <Text className="font-black text-gray-900 text-lg">{item.code}</Text>
                      <Text className="text-xs text-gray-500 mt-1">{item.description || "Save on your order"}</Text>
                    </View>
                    <Text className="text-[#FF6B00] font-bold text-xs">APPLY</Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <Text className="text-center text-gray-400 mt-10">No coupons available for this order.</Text>
                }
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Address Selection Modal */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl h-[60%] pt-6">
            <View className="px-6 flex-row justify-between items-center mb-6">
              <Text className="text-xl font-black text-gray-900">Select Delivery Location</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)} className="bg-gray-100 p-2 rounded-full">
                <Feather name="x" size={20} color="black" />
              </TouchableOpacity>
            </View>

            <View className="px-6 flex-1 bg-gray-50 pt-4">
              {isLoadingAddresses ? (
                <ActivityIndicator size="large" color="#FF6B00" className="mt-10" />
              ) : (
                <FlatList
                  data={addresses}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => handleSelectAddress(item)}
                      className={`p-4 rounded-xl border mb-3 flex-row items-start ${selectedAddress?.id === item.id ? 'bg-orange-50 border-[#FF6B00]' : 'bg-white border-gray-200'}`}
                    >
                      <View className={`mt-1 p-1 rounded-full border ${selectedAddress?.id === item.id ? 'border-[#FF6B00] bg-[#FF6B00]' : 'border-gray-300 bg-white'}`}>
                        {selectedAddress?.id === item.id && <Feather name="check" size={10} color="white" />}
                      </View>
                      <View className="ml-4 flex-1">
                        <View className="flex-row items-center mb-1">
                          <Text className="font-bold text-gray-900 text-base">{item.type || "Home"}</Text>
                          {item.is_default && (
                            <View className="bg-gray-200 px-2 py-0.5 rounded ml-2">
                              <Text className="text-[10px] font-bold text-gray-600">DEFAULT</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-gray-600 text-sm leading-5">
                          {item.address_line_1}, {item.address_line_2 ? item.address_line_2 + ", " : ""}{item.city}, {item.state} - {item.postal_code || item.pincode}
                        </Text>
                        <Text className="text-gray-500 text-xs mt-1">Phone: {item.phone}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View className="items-center justify-center mt-10">
                      <Text className="text-gray-400 mb-4">No addresses found</Text>
                      <TouchableOpacity
                        onPress={handleAddNewAddress}
                        className="bg-[#FF6B00] px-6 py-2 rounded-full"
                      >
                        <Text className="text-white font-bold">Add New Address</Text>
                      </TouchableOpacity>
                    </View>
                  }
                  ListFooterComponent={
                    addresses.length > 0 ? (
                      <TouchableOpacity
                        onPress={handleAddNewAddress}
                        className="mt-4 flex-row items-center justify-center border border-dashed border-gray-300 p-4 rounded-xl"
                      >
                        <Feather name="plus" size={16} color="#4b5563" />
                        <Text className="text-gray-600 font-bold ml-2">Add Another Address</Text>
                      </TouchableOpacity>
                    ) : null
                  }
                />
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* New Address Flow Modals */}
      <LocationPickerModal
        visible={showLocationPicker}
        onClose={() => {
          setShowLocationPicker(false);
          setShowAddressModal(true);
        }}
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

export default CartScreen;
