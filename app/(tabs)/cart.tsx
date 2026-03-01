import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { API_BASE_URL } from "../../constants/Config";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { useDelivery } from "../../contexts/DeliveryChargeContext";
import { useLocation } from "../../contexts/LocationContext";
import * as CouponOnApi from "../../services/couponService";
import * as OrderService from "../../services/orderService";
import RazorpayCheckout from 'react-native-razorpay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WalletService from "../../services/walletService";

import AddressDetailsFormModal from '../../components/AddressDetailsFormModal';
import LocationPickerModal from '../../components/LocationPickerModal';
import PaymentModal from '../../components/PaymentModal';

const { width } = Dimensions.get("window");

const CartScreen = () => {
  const { cartItems, getCartTotal, updateQuantity, removeFromCart, deleteFromCart, addToCart, clearCart } = useCart();
  const { pincode, location, selectedAddress, addresses, fetchAddresses, setSelectedAddress, isLoadingAddresses } = useLocation();
  const { getDeliverySettings, getUpsellMessage, defaultDeliveryCharge } = useDelivery();
  const router = useRouter();
  const { currentUser, getAccessToken } = useAuth();
  const insets = useSafeAreaInsets();

  const [isBillDetailsOpen, setIsBillDetailsOpen] = useState(true);
  const [isCouponsOpen, setIsCouponsOpen] = useState(false);

  // Availability State
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityData, setAvailabilityData] = useState<any>({});
  const [allAvailable, setAllAvailable] = useState(true);
  const [maxDeliveryDays, setMaxDeliveryDays] = useState(0);
  const [isScheduled, setIsScheduled] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // Info Modal State
  const [infoModal, setInfoModal] = useState({
    isOpen: false,
    title: "",
    content: null as React.ReactNode,
  });

  const handleOpenInfoModal = (type: string) => {
    let title = "";
    let content = null;

    switch (type) {
      case "delivery":
        title = "Delivery charge";
        content = (
          <View className="space-y-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-700 text-sm">Orders above ₹299</Text>
              <Text className="font-bold text-gray-900 text-sm">₹0</Text>
            </View>
            <View className="flex-row justify-between items-center mt-2">
              <Text className="text-gray-700 text-sm">Orders below ₹299</Text>
              <Text className="font-bold text-gray-900 text-sm">₹40</Text>
            </View>
            <View className="bg-gray-50 p-2 rounded mt-3">
              <Text className="text-xs text-gray-500">Free delivery on orders above ₹299</Text>
            </View>
          </View>
        );
        break;
      case "handling":
        title = "Handling charge";
        content = (
          <Text className="text-sm text-gray-600 leading-relaxed">
            Handling charge for proper handling and ensuring high quality quick-deliveries.
          </Text>
        );
        break;
      case "surge":
        title = "Surge charge";
        content = (
          <View className="space-y-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-700 text-sm">Orders above ₹499</Text>
              <Text className="font-bold text-gray-900 text-sm">₹0</Text>
            </View>
            <View className="flex-row justify-between items-center mt-2">
              <Text className="text-gray-700 text-sm">Orders below ₹499</Text>
              <Text className="font-bold text-gray-900 text-sm">₹35</Text>
            </View>
          </View>
        );
        break;
      case "platform":
        title = "Platform Fee";
        content = (
          <Text className="text-sm text-gray-600 leading-relaxed">
            Platform fee helps us improve our services and ensure a seamless shopping experience for you.
          </Text>
        );
        break;
      default:
        return;
    }

    setInfoModal({ isOpen: true, title, content });
  };

  // Payment State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'COD' | 'WALLET' | 'ONLINE'>('COD');
  const [walletBalance, setWalletBalance] = useState(0);
  const [isWalletFrozen, setIsWalletFrozen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Charges State
  const [charges, setCharges] = useState({
    handling_charge: 0,
    surge_charge: 0,
    platform_charge: 0,
    delivery_charge: 0,
    discount_charge: 0,
  });

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
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // New Address Flow State
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<any>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);

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
      const token = await getAccessToken(); // Use helper or AsyncStorage.getItem('auth_token')
      if (!token) {
        Alert.alert("Error", "You must be logged in to save an address");
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

  // 1. Availability Calculation
  const unavailableItems = useMemo(() => {
    return cartItems.filter(item => {
      const key = item.variant_id ? `${item.id}-${item.variant_id}` : String(item.id);
      return availabilityData[key] && !availabilityData[key].available;
    });
  }, [cartItems, availabilityData]);

  const availableCartItems = useMemo(() => {
    return cartItems.filter(item => {
      const key = item.variant_id ? `${item.id}-${item.variant_id}` : String(item.id);
      return !availabilityData[key] || availabilityData[key].available !== false;
    });
  }, [cartItems, availabilityData]);

  const allItemsUnavailable = cartItems.length > 0 && unavailableItems.length === cartItems.length;
  const hasUnavailableItems = unavailableItems.length > 0;

  // 1. Item Total (Selling Price)
  const itemTotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price as string) || 0;
      const quantity = parseInt(item.quantity as any) || 1;
      return total + price * quantity;
    }, 0);
  }, [cartItems]);

  const availableItemTotal = useMemo(() => {
    return availableCartItems.reduce((total, item) => {
      const price = parseFloat(item.price as string) || 0;
      const quantity = parseInt(item.quantity as any) || 1;
      return total + price * quantity;
    }, 0);
  }, [availableCartItems]);

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
      if (cartItems.length === 0) {
        setCharges({
          handling_charge: 0,
          surge_charge: 0,
          platform_charge: 0,
          delivery_charge: 0,
          discount_charge: 0,
        });
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/charge-settings`);
        const data = await response.json();

        if (data.success && data.data) {
          const deliverySettingsInfo = getDeliverySettings(itemTotal);
          const milestoneSurcharge = parseFloat(deliverySettingsInfo.surcharge as any) || 0;
          setCharges({
            handling_charge: parseFloat(data.data.handling_charge) || 0,
            surge_charge: milestoneSurcharge,
            platform_charge: parseFloat(data.data.platform_charge) || 0,
            discount_charge: parseFloat(data.data.discount_charge) || 0,
            delivery_charge: parseFloat(deliverySettingsInfo.charge as any) || 0,
          });
        }
      } catch (error) {
        // console.warn("Error fetching charges", error);
      }
    };
    fetchCharges();
  }, [cartItems.length, itemTotal, getDeliverySettings]);

  // Check Availability
  const verifyCartAvailability = async () => {
    if (cartItems.length === 0 || !pincode) {
      setAvailabilityData({});
      setAllAvailable(true);
      return false;
    }
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
        setAllAvailable(data.all_available);
        setMaxDeliveryDays(data.max_delivery_days || 0);
        return data.all_available;
      }
      return false;
    } catch (error) {
      console.warn("Availability check failed", error);
      return false;
    } finally {
      setCheckingAvailability(false);
    }
  };

  useEffect(() => {
    verifyCartAvailability();
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
          console.log("Related Products Data:", JSON.stringify(data.products, null, 2));
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

  // Fetch Wallet Balance
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const token = await getAccessToken();
        if (token) {
          const data = await WalletService.getWalletDetails(token);
          if (data.success && data.wallet) {
            setWalletBalance(parseFloat(data.wallet.balance));
            setIsWalletFrozen(data.wallet.is_frozen);
          }
        }
      } catch (error) {
        console.warn("Failed to fetch wallet", error);
      }
    };
    fetchWallet();
  }, [currentUser]);

  // Fetch Coupons when modal opens
  useEffect(() => {
    if (showCouponsModal) {
      const fetchCoupons = async () => {
        const token = await getAccessToken();
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
      const token = await getAccessToken();
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

  const handlePlaceOrder = async () => {
    if (!selectedAddress && !pincode) {
      Alert.alert("Missing Location", "Please select a delivery location first.");
      setShowAddressModal(true);
      return;
    }

    if (allItemsUnavailable) {
      Alert.alert("Unavailable", "All items in your cart are currently unavailable at this location.");
      return;
    }

    if (hasUnavailableItems) {
      setShowDisclaimerModal(true);
      return;
    }

    setShowPaymentModal(true);
  };

  const handleDisclaimerProceed = () => {
    setShowDisclaimerModal(false);
    setShowPaymentModal(true);
  };

  const handleDisclaimerChangeAddress = () => {
    setShowDisclaimerModal(false);
    setShowAddressModal(true);
  };

  const handlePaymentMethodSelect = (method: 'COD' | 'WALLET' | 'ONLINE') => {
    setSelectedPaymentMethod(method);
    setShowPaymentModal(false);
    // Small delay to allow modal to close before processing (optional but good for UX/Animations)
    setTimeout(() => {
      processOrder(method);
    }, 300);
  };

  const processOrder = async (method: 'COD' | 'WALLET' | 'ONLINE') => {
    setIsPlacingOrder(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        Alert.alert("Login Required", "Please login to place an order");
        router.push("/login"); // Fixed route
        return;
      }

      // Construct Address String if object
      let addressToUse = "";
      let receiverName = currentUser?.user_metadata?.full_name || "Customer";
      let mobile = currentUser?.phone || "";

      if (selectedAddress) {
        addressToUse = `${selectedAddress.address_line_1 || selectedAddress.street_address}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.postal_code}`;
        receiverName = selectedAddress.name || receiverName;
        mobile = selectedAddress.mobile || mobile;
      } else {
        addressToUse = `${location || 'Home'}, ${pincode}`;
      }

      const finalCartItems = hasUnavailableItems ? availableCartItems : cartItems;
      const finalItemTotal = hasUnavailableItems ? availableItemTotal : itemTotal;
      const finalTotalToPay = Math.max(0,
        finalItemTotal +
        feeTotal +
        deliveryCharge -
        (milestoneDiscount || 0) -
        couponDiscount -
        charges.discount_charge
      );

      const commonPayload = {
        user_id: currentUser.id,
        items: finalCartItems.map(item => ({
          product_id: item.id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          price: item.price
        })),
        subtotal: finalItemTotal,
        shipping: deliveryCharge,
        total: finalTotalToPay,
        address: addressToUse,
        receiver_name: receiverName,
        mobile: mobile,
        coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
        coupon_discount: couponDiscount,
        // Charges
        handling_charge: charges.handling_charge,
        surge_charge: charges.surge_charge,
        platform_charge: charges.platform_charge,
        discount_charge: charges.discount_charge,
        payment_method: method === 'ONLINE' ? 'Razorpay' : method
      };

      if (method === 'WALLET') {
        if (walletBalance < finalTotalToPay) {
          Alert.alert("Insufficient Balance", "Your wallet balance is insufficient for this order.");
          setIsPlacingOrder(false);
          return;
        }

        // Wallet Order Payload
        const walletPayload = {
          ...commonPayload,
          payment_method: "WALLET" as "WALLET",
          user_name: receiverName,
          product_name: cartItems.map(i => i.name).join(", "),
          product_total_price: itemTotal,
          user_address: addressToUse,
          order_status: "pending" as "pending",
          payment_status: "completed" as "completed",
          total_price: totalToPay,
          delivery_address: selectedAddress || { address: addressToUse, mobile, name: receiverName },
          product_id: cartItems[0].id // Fallback
        };

        const response = await WalletService.createWalletOrder(walletPayload, token);
        if (response.success) {
          Alert.alert("Success", "Order placed successfully with Wallet!");
          clearCart();
          router.push("/orders");
        } else {
          Alert.alert("Error", response.error || "Failed to place order");
        }

      } else if (method === 'COD') {
        const response = await OrderService.placeOrder({
          ...commonPayload,
          payment_method: 'COD'
        }, token);

        if (response.success) {
          Alert.alert("Success", "Order placed successfully!");
          clearCart();
          router.push("/orders");
        } else {
          Alert.alert("Error", response.error || "Failed to place order");
        }
      } else {
        // ONLINE
        const token = await AsyncStorage.getItem('auth_token');
        if (!token) {
          Alert.alert("Error", "Authentication token missing.");
          setIsPlacingOrder(false);
          return;
        }

        // 1. Create Razorpay order
        const rzpResponse = await OrderService.createRazorpayOrder(Number(commonPayload.total) * 100, token);
        if (!rzpResponse.success) {
          Alert.alert("Error", rzpResponse.error || "Failed to initiate online payment");
          setIsPlacingOrder(false);
          return;
        }

        const options = {
          description: 'Order Payment',
          image: 'https://i.imgur.com/3g7nmJC.png',
          currency: rzpResponse.currency || 'INR',
          key: 'rzp_test_RhxzggkElloJam',
          amount: rzpResponse.amount,
          name: 'BigBest Mart',
          order_id: rzpResponse.order_id,
          prefill: {
            email: currentUser?.email || '',
            contact: currentUser?.phone || '',
            name: currentUser?.name || 'User'
          },
          theme: { color: '#f97316' }
        };

        if (!RazorpayCheckout) {
          Alert.alert("Error", "Razorpay requires a custom development build.");
          setIsPlacingOrder(false);
          return;
        }

        RazorpayCheckout.open(options).then(async (data: any) => {
          try {
            // 2. Place order on backend with Razorpay details
            const response = await OrderService.placeOrder({
              ...commonPayload,
              payment_method: 'Razorpay',
              razorpay_order_id: data.razorpay_order_id,
              razorpay_payment_id: data.razorpay_payment_id,
              razorpay_signature: data.razorpay_signature,
            } as any, token);

            if (response.success) {
              Alert.alert("Success", "Order placed successfully!");
              clearCart();
              router.push("/orders");
            } else {
              Alert.alert("Error", response.error || "Failed to place order after payment");
            }
          } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to process order");
          } finally {
            setIsPlacingOrder(false);
          }
        }).catch((error: any) => {
          console.error("Razorpay Error:", error);
          let errorDesc = "Payment cancelled or failed";
          if (error.error && error.error.description) {
            errorDesc = error.error.description;
          } else if (typeof error.description === 'string' && error.description.startsWith('{')) {
            try {
              const parsed = JSON.parse(error.description);
              if (parsed.error && parsed.error.description) {
                errorDesc = parsed.error.description;
              }
            } catch (e) { }
          }
          Alert.alert("Payment Info", errorDesc);
          setIsPlacingOrder(false);
        });

        return; // handlePlaceOrder will resolve and eventually setIsPlacingOrder(false) in the Razorpay callbacks
      }

    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleAddRelatedProduct = (product: any) => {
    const price = parseFloat(product.price || product.variants?.[0]?.price || 0);
    const image = product.media?.[0]?.url || product.image || "https://example.com/placeholder.png";

    addToCart({
      id: product.id,
      variant_id: product.variants?.[0]?.id, // Default to first variant if exists
      name: product.name,
      price: price,
      image: image,
      quantity: 1,
      isBulkOrder: false
    });
    // Optional: Show toast or feedback
  }

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

            {/* Availability Message */}
            {checkingAvailability ? (
              <Text className="text-[10px] text-gray-400 mt-1">Checking...</Text>
            ) : isUnavailable ? (
              <Text className="text-[10px] text-red-600 font-bold mt-1">Not available at {pincode || 'location'}</Text>
            ) : availability?.delivery_message ? (
              <View className="flex-row items-center mt-1">
                <Feather name="truck" size={10} color="#16a34a" />
                <Text className="text-[10px] text-green-600 ml-1">{availability.delivery_message}</Text>
              </View>
            ) : null}

            {item.stock_info?.low_stock && !isUnavailable && (
              <Text className="text-xs text-orange-600 font-medium mt-0.5">
                Only {item.stock_info.available_stock} left!
              </Text>
            )}
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

            {/* Quantity Controls - Premium Orange Style */}
            <View className="flex-row items-center bg-[#FF6B00] rounded-lg shadow-md h-8 min-w-[70px]">
              <TouchableOpacity
                onPress={() => {
                  if (item.quantity > 1) {
                    updateQuantity(item.id, item.quantity - 1);
                  } else {
                    deleteFromCart(item);
                  }
                }}
                className="flex-1 items-center justify-center h-full px-1"
              >
                <Text className="text-white text-lg font-light">−</Text>
              </TouchableOpacity>

              <Text className="font-bold text-white text-sm w-5 text-center">{item.quantity}</Text>

              <TouchableOpacity
                onPress={() => {
                  const maxStock = item.stock_info?.available_stock ?? availability?.available_stock ?? 999;
                  if (item.quantity < maxStock) {
                    updateQuantity(item.id, item.quantity + 1);
                  } else {
                    Alert.alert("Max Stock", `You cannot add more than ${maxStock} of this item.`);
                  }
                }}
                className={`flex-1 items-center justify-center h-full px-1 ${item.quantity >= (item.stock_info?.available_stock ?? availability?.available_stock ?? 999) ? "opacity-50" : ""}`}
                disabled={item.quantity >= (item.stock_info?.available_stock ?? availability?.available_stock ?? 999)}
              >
                <Text className="text-white text-lg font-light">+</Text>
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
            Add items to get started
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
                ? `${selectedAddress.address_line_1 || selectedAddress.street_address || ''}, ${selectedAddress.city} - ${selectedAddress.postal_code || selectedAddress.pincode}`
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
        contentContainerStyle={{ paddingBottom: cartItems.length > 0 ? 200 + insets.bottom : 24 }}
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
          <View className="pb-4">
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
              <View className="mx-4 mt-4 bg-white border border-green-200 rounded-xl p-4 shadow-sm relative overflow-hidden group">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-row gap-3">
                    <View className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center border border-green-100">
                      <Text className="text-lg font-bold text-green-600">%</Text>
                    </View>
                    <View>
                      <View className="bg-green-50 px-2 py-0.5 rounded border border-green-100 mb-1 self-start">
                        <Text className="text-green-700 text-xs font-bold tracking-wider">{appliedCoupon.code}</Text>
                      </View>
                      <Text className="text-sm font-bold text-gray-900 leading-tight">
                        Saved ₹{couponDiscount.toFixed(2)} on this order
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={handleRemoveCoupon} className="px-2 py-1">
                    <Text className="text-red-500 font-bold text-xs">REMOVE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setShowCouponsModal(true)}
                className="bg-white mx-4 mt-4 p-4 rounded-xl flex-row items-center justify-between border border-dashed border-[#FD5B00] shadow-sm"
              >
                <View className="flex-row items-center">
                  <View className="bg-orange-50 p-2 rounded-xl border border-orange-100">
                    <MaterialIcons name="local-offer" size={20} color="#FD5B00" />
                  </View>
                  <View className="ml-4">
                    <Text className="font-bold text-gray-800 text-base">Apply Coupon</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color="#FD5B00" />
              </TouchableOpacity>
            )}

            {/* Bill Summary */}
            <View className="bg-white mx-4 mt-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-2">
              <Text className="text-base font-bold text-gray-900 p-4 pb-2 border-b border-gray-100">Bill Details</Text>

              <View className="p-4 space-y-3">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Feather name="file-text" size={14} color="#6b7280" />
                    <Text className="text-gray-600 text-xs ml-2">Item Total</Text>
                  </View>
                  <View className="flex-row items-center">
                    {originalItemTotal > itemTotal && (
                      <Text className="text-xs text-gray-400 line-through mr-2">₹{originalItemTotal.toFixed(0)}</Text>
                    )}
                    <Text className="text-gray-900 font-medium text-sm">₹{itemTotal.toFixed(0)}</Text>
                  </View>
                </View>

                {/* Delivery Charge */}
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Feather name="truck" size={14} color="#6b7280" />
                    <Text className="text-gray-600 text-xs ml-2">Delivery Charge</Text>
                    <TouchableOpacity onPress={() => handleOpenInfoModal('delivery')} className="ml-1">
                      <Feather name="info" size={12} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                  <Text className={deliveryCharge === 0 ? "text-green-600 font-medium text-sm" : "text-gray-900 font-medium text-sm"}>
                    {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge.toFixed(0)}`}
                  </Text>
                </View>

                {/* Handling Charge */}
                {charges.handling_charge > 0 && (
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <Feather name="package" size={14} color="#6b7280" />
                      <Text className="text-gray-600 text-xs ml-2">Handling Charge</Text>
                      <TouchableOpacity onPress={() => handleOpenInfoModal('handling')} className="ml-1">
                        <Feather name="info" size={12} color="#9ca3af" />
                      </TouchableOpacity>
                    </View>
                    <Text className="text-gray-900 font-medium text-sm">₹{charges.handling_charge.toFixed(0)}</Text>
                  </View>
                )}

                {/* Surge Charge */}
                {charges.surge_charge > 0 && (
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <Feather name="cloud-lightning" size={14} color="#6b7280" />
                      <Text className="text-gray-600 text-xs ml-2">Surge / Late Night Fee</Text>
                      <TouchableOpacity onPress={() => handleOpenInfoModal('surge')} className="ml-1">
                        <Feather name="info" size={12} color="#9ca3af" />
                      </TouchableOpacity>
                    </View>
                    <Text className="text-gray-900 font-medium text-sm">₹{charges.surge_charge.toFixed(0)}</Text>
                  </View>
                )}

                {/* Platform Fee */}
                {charges.platform_charge > 0 && (
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <Feather name="smartphone" size={14} color="#6b7280" />
                      <Text className="text-gray-600 text-xs ml-2">Platform Fee</Text>
                      <TouchableOpacity onPress={() => handleOpenInfoModal('platform')} className="ml-1">
                        <Feather name="info" size={12} color="#9ca3af" />
                      </TouchableOpacity>
                    </View>
                    <Text className="text-gray-900 font-medium text-sm">₹{charges.platform_charge.toFixed(0)}</Text>
                  </View>
                )}

                {couponDiscount > 0 && (
                  <View className="flex-row justify-between items-center mt-1">
                    <Text className="text-green-600 text-xs font-medium">Coupon Discount</Text>
                    <Text className="text-green-600 font-medium text-sm">-₹{couponDiscount.toFixed(0)}</Text>
                  </View>
                )}
                {charges.discount_charge > 0 && (
                  <View className="flex-row justify-between items-center mt-1">
                    <Text className="text-green-600 text-xs font-medium">Extra Discount</Text>
                    <Text className="text-green-600 font-medium text-sm">-₹{charges.discount_charge.toFixed(0)}</Text>
                  </View>
                )}
                {milestoneDiscount > 0 && (
                  <View className="flex-row justify-between items-center mt-1">
                    <Text className="text-green-600 text-xs font-medium">Delivery Discount</Text>
                    <Text className="text-green-600 font-medium text-sm">-₹{milestoneDiscount.toFixed(0)}</Text>
                  </View>
                )}
              </View>

              <View className="bg-gray-50 px-4 py-3 flex-row justify-between items-center border-t border-gray-100">
                <Text className="text-gray-900 font-bold text-base">To Pay</Text>
                <Text className="text-gray-900 font-black text-lg">₹{totalToPay.toFixed(0)}</Text>
              </View>
            </View>

            {/* Savings Banner */}
            {totalSavings > 0 && (
              <View className="mx-4 mt-2 bg-green-50 rounded-xl p-4 border border-green-100">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-sm font-bold text-gray-900">Super Savings on this order</Text>
                  <Text className="bg-green-600 px-3 py-1 rounded text-white font-bold text-xs">
                    ₹{totalSavings.toFixed(0)}
                  </Text>
                </View>

                <View className="bg-white rounded-lg p-3 space-y-2">
                  {originalItemTotal > itemTotal && (
                    <View className="flex-row justify-between items-center pb-2 border-b border-dashed border-gray-200">
                      <View className="flex-row items-center">
                        <Feather name="tag" size={14} color="#16a34a" />
                        <Text className="text-xs font-medium text-gray-700 ml-2">Discount on MRP</Text>
                      </View>
                      <Text className="text-xs font-bold text-gray-900">₹{(originalItemTotal - itemTotal).toFixed(0)}</Text>
                    </View>
                  )}
                  {deliveryCharge === 0 && (
                    <View className="flex-row justify-between items-center pb-2 border-b border-dashed border-gray-200">
                      <View className="flex-row items-center">
                        <Feather name="shopping-bag" size={14} color="#16a34a" />
                        <Text className="text-xs font-medium text-gray-700 ml-2">Delivery savings</Text>
                      </View>
                      <Text className="text-xs font-bold text-gray-900">₹{defaultDeliveryCharge.toFixed(0)}</Text>
                    </View>
                  )}
                  {couponDiscount > 0 && (
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center">
                        <Feather name="star" size={14} color="#16a34a" />
                        <Text className="text-xs font-medium text-gray-700 ml-2">Coupon Savings</Text>
                      </View>
                      <Text className="text-xs font-bold text-gray-900">₹{couponDiscount.toFixed(0)}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <View className="mt-8">
                <View className="flex-row justify-between items-center px-4 mb-4">
                  <Text className="text-lg font-black text-gray-900 italic">You might also like</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                  {relatedProducts.map((product, idx) => {
                    const imageUrl = product.image || product.media?.[0]?.url || null;
                    const price = product.price || product.variants?.[0]?.price || "0";
                    const oldPrice = product.oldPrice || product.variants?.[0]?.old_price;
                    const isOutOfStock = product.inStock === false;

                    return (
                      <TouchableOpacity
                        key={product.id}
                        className="mr-3 bg-white rounded-2xl p-2 shadow-sm border border-gray-100"
                        style={{ width: 140 }}
                        onPress={() => router.push(`/product/${product.id}` as any)}
                      >
                        <View className="relative">
                          {imageUrl ? (
                            <Image
                              source={{ uri: imageUrl }}
                              className="w-full h-24 rounded-xl mb-2 bg-gray-50"
                              resizeMode="contain"
                            />
                          ) : (
                            <View className="w-full h-24 rounded-xl mb-2 bg-gray-100 items-center justify-center">
                              <Ionicons name="image-outline" size={28} color="#d1d5db" />
                            </View>
                          )}
                          {isOutOfStock && (
                            <View className="absolute inset-0 bg-black/40 rounded-xl items-center justify-center mb-2">
                              <Text className="text-white text-[10px] font-bold">OUT OF STOCK</Text>
                            </View>
                          )}
                        </View>
                        <Text numberOfLines={2} className="text-xs font-bold text-gray-800 mb-1" style={{ minHeight: 32 }}>{product.name}</Text>
                        <View className="flex-row justify-between items-center mt-1">
                          <View>
                            <Text className="text-[#FF6B00] font-black text-sm">₹{price}</Text>
                            {oldPrice && parseFloat(oldPrice) > parseFloat(price) && (
                              <Text className="text-[10px] text-gray-400 line-through">₹{oldPrice}</Text>
                            )}
                          </View>
                          {!isOutOfStock ? (
                            <TouchableOpacity
                              onPress={() => handleAddRelatedProduct(product)}
                              className="bg-[#FF6B00] p-1.5 rounded-lg active:opacity-80"
                            >
                              <Feather name="plus" size={14} color="white" />
                            </TouchableOpacity>
                          ) : (
                            <View className="bg-gray-200 p-1.5 rounded-lg">
                              <Feather name="plus" size={14} color="#9ca3af" />
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        )}
      />

      {/* Coupons Modal */}
      <Modal
        visible={showCouponsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCouponsModal(false)}
      >
        <View className="flex-1 bg-gray-50">
          <View className="p-4 bg-white border-b border-gray-100 flex-row justify-between items-center">
            <Text className="text-lg font-black text-gray-900">Apply Coupon</Text>
            <TouchableOpacity onPress={() => setShowCouponsModal(false)}>
              <Feather name="x" size={24} color="black" />
            </TouchableOpacity>
          </View>

          <View className="p-4">
            <View className="flex-row items-center border border-gray-200 rounded-xl p-2 bg-white mb-6">
              <TextInput
                className="flex-1 px-2 font-bold text-gray-800"
                placeholder="Enter Coupon Code"
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                onPress={() => handleApplyCoupon(couponCode)}
                disabled={!couponCode || couponLoading}
                className={`px-4 py-2 rounded-lg ${!couponCode ? 'bg-gray-200' : 'bg-[#FF6B00]'}`}
              >
                {couponLoading ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white font-bold">APPLY</Text>}
              </TouchableOpacity>
            </View>

            <Text className="text-gray-500 font-bold mb-3 uppercase text-xs tracking-wider">Available Coupons</Text>

            <FlatList
              data={availableCoupons}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View className="bg-white p-4 rounded-xl border border-gray-100 mb-3 shadow-sm relative overflow-hidden">
                  <View className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FF6B00]" />
                  <View className="flex-row justify-between items-start">
                    <View>
                      <Text className="font-black text-lg text-gray-800">{item.code}</Text>
                      <Text className="text-gray-500 text-xs mt-1">{item.description || "Get discount on your order"}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleApplyCoupon(item.code)}
                      className="bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100"
                    >
                      <Text className="text-[#FF6B00] font-bold text-xs uppercase">Apply</Text>
                    </TouchableOpacity>
                  </View>
                  <View className="mt-3 pt-3 border-t border-dashed border-gray-200 flex-row">
                    <Text className="text-xs text-gray-400">Min Order: ₹{item.min_order_value}</Text>
                    {item.max_discount && <Text className="text-xs text-gray-400 ml-4">Max Discount: ₹{item.max_discount}</Text>}
                  </View>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      <PaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSelectMethod={handlePaymentMethodSelect}
        walletBalance={walletBalance}
        isWalletFrozen={isWalletFrozen}
        totalAmount={totalToPay}
      />

      {/* Address Modal */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View className="flex-1 bg-gray-50">
          <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-100">
            <Text className="text-lg font-black text-gray-800">Select Delivery Location</Text>
            <TouchableOpacity onPress={() => setShowAddressModal(false)}>
              <Feather name="x" size={24} color="#4b5563" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={addresses}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 16 }}
            ListHeaderComponent={
              <TouchableOpacity
                onPress={handleAddNewAddress}
                className="bg-white p-4 rounded-xl border border-dashed border-orange-300 flex-row items-center justify-center mb-4 active:bg-orange-50"
              >
                <Feather name="plus" size={20} color="#FF6B00" />
                <Text className="text-[#FF6B00] font-bold ml-2">Add New Address</Text>
              </TouchableOpacity>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelectAddress(item)}
                className={`p-4 bg-white rounded-xl mb-3 border ${selectedAddress?.id === item.id ? 'border-orange-500 bg-orange-50' : 'border-gray-100'}`}
              >
                <View className="flex-row justify-between mb-1">
                  <Text className="font-bold text-gray-900">{item.name}</Text>
                  <View className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                    <Text className="text-[10px] text-gray-500 uppercase">{item.address_type || 'HOME'}</Text>
                  </View>
                </View>
                <Text className="text-gray-600 leading-5">
                  {item.address_line_1}, {item.street_address}, {item.city}, {item.state} - {item.postal_code}
                </Text>
                <Text className="text-gray-500 text-xs mt-1">Mobile: {item.mobile}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Location Picker Modal */}
      <LocationPickerModal
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onConfirm={handleLocationPicked}
      />

      {/* Address Details Form Modal */}
      <AddressDetailsFormModal
        visible={showAddressForm}
        onClose={() => setShowAddressForm(false)}
        onBack={() => {
          setShowAddressForm(false);
          setShowLocationPicker(true);
        }}
        initialLocation={pickedLocation}
        onSave={handleSaveAddress}
        loading={isSavingAddress}
      />

      {/* Unavailable Items Disclaimer Modal */}
      <Modal
        visible={showDisclaimerModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDisclaimerModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-center items-center p-4">
          <View className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <View className="p-5">
              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center">
                  <Feather name="alert-circle" size={20} color="#f59e0b" />
                  <Text className="text-lg font-bold text-gray-900 ml-2">Some Items Unavailable</Text>
                </View>
                <TouchableOpacity onPress={() => setShowDisclaimerModal(false)} className="p-1">
                  <Feather name="x" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <Text className="text-sm text-gray-600 mb-4">
                The following item(s) are <Text className="font-bold text-red-600">not available</Text> for delivery at your selected address:
              </Text>

              <ScrollView className="max-h-40 mb-4" showsVerticalScrollIndicator={false}>
                {unavailableItems.map((item) => {
                  const key = item.variant_id ? `${item.id}-${item.variant_id}` : String(item.id);
                  const availability = availabilityData[key];
                  return (
                    <View key={key} className="flex-row items-center p-2 mb-2 bg-red-50 border border-red-100 rounded-lg">
                      <Image
                        source={{ uri: item.image || "https://example.com/placeholder.png" }}
                        className="w-10 h-10 rounded-lg bg-white"
                      />
                      <View className="flex-1 ml-3 justify-center">
                        <Text className="text-sm font-bold text-gray-800" numberOfLines={1}>{item.name}</Text>
                        <Text className="text-xs text-red-500">{availability?.delivery_message || "Out of stock"}</Text>
                      </View>
                      <Text className="text-xs font-bold text-gray-500 ml-2">x{item.quantity}</Text>
                    </View>
                  );
                })}
              </ScrollView>

              <View className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
                <Text className="text-xs text-amber-800 leading-tight">
                  You can <Text className="font-bold">change your delivery address</Text> to check availability elsewhere, or <Text className="font-bold">proceed with only the available items</Text>. The unavailable items will remain in your cart.
                </Text>
              </View>

              <View className="gap-2">
                <TouchableOpacity
                  onPress={handleDisclaimerProceed}
                  className="w-full bg-[#FD5B00] py-3 rounded-xl items-center"
                >
                  <Text className="text-white font-bold">
                    Proceed with {availableCartItems.length} available item(s)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDisclaimerChangeAddress}
                  className="w-full bg-white border border-gray-300 py-3 rounded-xl items-center"
                >
                  <Text className="text-gray-700 font-bold">Change Delivery Address</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Checkout Section Footer */}
      {cartItems.length > 0 && (
        <View
          className="absolute bottom-0 w-full bg-white border-t border-gray-100 shadow-2xl"
          style={{ paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }}
        >

          {/* Ordering For Strip */}
          <View className="mx-4 mt-3 bg-white rounded-xl p-3 flex-row items-center justify-between shadow-sm border border-gray-100">
            <Text className="text-gray-900 font-semibold text-xs flex-1 mr-2" numberOfLines={1}>
              Ordering for <Text className="text-[#FD5B00]">{currentUser?.user_metadata?.full_name || "Customer"}</Text>, {currentUser?.phone || ""}
            </Text>
            <TouchableOpacity onPress={() => {/* Handle Edit Receiver Info */ }}>
              <Text className="text-[#FD5B00] font-bold text-xs">Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Delivery Address & Pay Button */}
          <View className="px-4 pt-4 pb-2">
            {selectedAddress && (
              <TouchableOpacity
                className="mb-3 flex-row items-center cursor-pointer"
                onPress={() => setShowAddressModal(true)}
              >
                <View className="p-2 bg-gray-100 rounded-lg">
                  <Feather name="map-pin" size={18} color="#4b5563" />
                </View>
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center">
                    <Text className="font-bold text-gray-900 text-sm">Delivering to home</Text>
                    <Feather name="chevron-down" size={14} color="#6b7280" className="ml-1" />
                  </View>
                  <Text className="text-xs text-gray-500" numberOfLines={1}>
                    {selectedAddress.address_line_1 || selectedAddress.street_address}, {selectedAddress.city}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {!selectedAddress && !pincode ? (
              <TouchableOpacity
                className="w-full bg-[#FD5B00] py-4 rounded-xl flex-row items-center justify-center shadow-lg"
                onPress={() => setShowAddressModal(true)}
              >
                <Text className="text-white font-bold text-base">Add Address to proceed</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className={`w-full py-4 rounded-xl flex-row items-center justify-center shadow-lg ${checkingAvailability || allItemsUnavailable || isPlacingOrder ? 'bg-orange-300 opacity-80' : 'bg-[#FD5B00] shadow-orange-200'
                  }`}
                disabled={checkingAvailability || allItemsUnavailable || isPlacingOrder}
                onPress={handlePlaceOrder}
              >
                {checkingAvailability || isPlacingOrder ? (
                  <ActivityIndicator color="white" size="small" className="mr-2" />
                ) : null}
                <Text className="text-white font-bold text-lg">
                  {checkingAvailability
                    ? "Checking Stock..."
                    : allItemsUnavailable
                      ? "UNAVAILABLE"
                      : isPlacingOrder
                        ? "Placing Order..."
                        : `Click to Pay ₹${totalToPay.toFixed(0)}`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

    </SafeAreaView>
  );
};

export default CartScreen;
