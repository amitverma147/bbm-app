import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useSegments } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_BASE_URL } from "../constants/Config";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useDelivery } from "../contexts/DeliveryChargeContext";

type ActiveOrder = {
  order_id?: string;
  id?: string;
  _id?: string;
  status: string;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; bg: string }
> = {
  pending: { label: "Order Received", icon: "clock-outline", bg: "#F59E0B" },
  confirmed: { label: "Order Confirmed", icon: "check-circle-outline", bg: "#10B981" },
  processing: { label: "Preparing Order", icon: "silverware-fork-knife", bg: "#3B82F6" },
  shipped: { label: "Out for Delivery", icon: "truck-delivery-outline", bg: "#8B5CF6" },
};

const ACTIVE_STATUSES = ["pending", "confirmed", "processing", "shipped"];
const HIDDEN_SEGMENTS = ["cart", "checkout", "tracking", "login", "signup", "product"];

const SmartBar = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const { getCartTotal, getTotalItems } = useCart();
  const { getDeliverySettings } = useDelivery();
  const router = useRouter();
  const segments = useSegments() as string[];
  const insets = useSafeAreaInsets();

  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const slideAnim = useRef(new Animated.Value(160)).current;

  const totalItems = getTotalItems();
  const cartTotal = getCartTotal();
  const deliverySettings = getDeliverySettings(cartTotal);
  const amountNeeded = Math.ceil(deliverySettings.amountToNextTier ?? 0);
  const isFreeDelivery = deliverySettings.isFree;

  // Progress toward free delivery threshold (0 → 1)
  const freeThreshold = deliverySettings.nextTier?.min_order_value ?? 0;
  const deliveryProgress = freeThreshold > 0
    ? Math.min(cartTotal / freeThreshold, 1)
    : 1;

  const segmentStr = segments.join("/");
  const isHiddenPage = HIDDEN_SEGMENTS.some((s) => segmentStr.includes(s));
  const isHomePage =
    (segments.length === 1 && segments[0] === "(tabs)") ||
    (segments.length === 2 && segments[0] === "(tabs)" && segments[1] === "index");

  const hasCart = totalItems > 0;
  const hasOrder = !!activeOrder;
  const shouldShow = !isHiddenPage && (hasCart || (hasOrder && isHomePage));

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: shouldShow ? 0 : 160,
      useNativeDriver: true,
      tension: 60,
      friction: 9,
    }).start();
  }, [shouldShow, slideAnim]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      setActiveOrder(null);
      return;
    }
    const doFetch = async () => {
      try {
        const token = await AsyncStorage.getItem("auth_token");
        if (!token) return;
        const res = await fetch(
          `${API_BASE_URL}/order/user/${currentUser.id}?limit=1`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const result = await res.json();
        if (result.success && result.orders?.length > 0) {
          const latest = result.orders[0];
          if (ACTIVE_STATUSES.includes(latest.status?.toLowerCase())) {
            setActiveOrder(latest);
          } else {
            setActiveOrder(null);
          }
        } else {
          setActiveOrder(null);
        }
      } catch {
        /* silent */
      }
    };
    doFetch();
    const interval = setInterval(doFetch, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, currentUser]);

  if (!shouldShow) return null;

  const statusKey = activeOrder?.status?.toLowerCase() ?? "pending";
  const statusCfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.pending;
  const orderId = String(
    activeOrder?.order_id || activeOrder?.id || activeOrder?._id || ""
  ).slice(-8).toUpperCase();

  return (
    <Animated.View
      style={[styles.wrapper, { bottom: 60 + insets.bottom + 8, transform: [{ translateY: slideAnim }] }]}
    >
      <View style={styles.container}>

        {/* Active Order Strip — visible on home only */}
        {hasOrder && isHomePage && (
          <TouchableOpacity
            style={[styles.orderStrip, { backgroundColor: statusCfg.bg }]}
            onPress={() => router.push(`/orders/${activeOrder.id || activeOrder._id}` as any)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name={statusCfg.icon} size={14} color="white" />
            <Text style={styles.orderStripText}>
              {statusCfg.label} · #{orderId}
            </Text>
            <Feather name="chevron-right" size={13} color="white" style={{ marginLeft: "auto" }} />
          </TouchableOpacity>
        )}

        {/* Main delivery + cart row */}
        {hasCart && (
          <View style={styles.mainRow}>

            {/* Left: delivery unlock pill */}
            <View style={styles.deliveryPill}>
              <View style={styles.scooterCircle}>
                <MaterialCommunityIcons name="moped-outline" size={22} color="#15803d" />
              </View>
              <View style={styles.deliveryText}>
                {isFreeDelivery ? (
                  <>
                    <Text style={styles.deliveryTitle}>FREE Delivery Unlocked!</Text>
                    <Text style={styles.deliverySubtitle}>Enjoy free delivery on this order</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.deliveryTitle}>Unlock FREE Delivery</Text>
                    <Text style={styles.deliverySubtitle}>
                      Shop for <Text style={styles.deliveryAmount}>₹{amountNeeded}</Text> more
                    </Text>
                  </>
                )}
                {/* Progress bar */}
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.round(deliveryProgress * 100)}%` },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Right: dark green cart pill */}
            <TouchableOpacity
              style={styles.cartPill}
              onPress={() => router.push("/(tabs)/cart")}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="shopping-outline" size={17} color="white" />
              <Text style={styles.cartCount}>{totalItems}</Text>
              <Feather name="arrow-right" size={15} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    // bottom is set inline using insets
    left: 12,
    right: 12,
    zIndex: 60,
  },
  container: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 14,
    elevation: 12,
  },
  // Order strip
  orderStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 7,
  },
  orderStripText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11.5,
    color: "white",
    letterSpacing: 0.1,
  },
  // Main row
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 10,
  },
  // Delivery pill (left)
  deliveryPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 10,
  },
  scooterCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#86efac",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  deliveryText: {
    flex: 1,
  },
  deliveryTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12.5,
    color: "#14532d",
    lineHeight: 17,
  },
  deliverySubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#166534",
    lineHeight: 15,
  },
  deliveryAmount: {
    fontFamily: "Poppins_700Bold",
    color: "#15803d",
  },
  progressTrack: {
    marginTop: 5,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#bbf7d0",
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#16a34a",
  },
  // Cart pill (right)
  cartPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#14532d",
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 12,
    gap: 7,
    flexShrink: 0,
  },
  cartCount: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#ffffff",
    lineHeight: 20,
  },
});

export default SmartBar;
