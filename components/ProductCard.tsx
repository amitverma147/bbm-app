import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ProductCardProps {
  item: {
    id: string;
    name: string;
    price: string;
    oldPrice?: string;
    weight: string;
    image?: string;
    discount?: string;
    isAd?: boolean;
    brand?: string;
    store?: string;
    stockInfo?: {
      in_stock: boolean;
      available_stock: number;
      low_stock: boolean;
    };
    inStock?: boolean;
    stock?: number;
    variants?: any[];
    rating?: number;
    reviews?: number;
  };
  onAdd?: (variant?: any) => void;
  onPress?: () => void;
  gridStyle?: boolean;
}

const ProductCard = ({ item, onAdd, onPress, gridStyle }: ProductCardProps) => {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) onPress();
    else router.push(`/product/${item.id}` as any);
  };

  const [quantity, setQuantity] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [showVariants, setShowVariants] = useState(false);

  // Animation for bottom sheet
  const slideFloat = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (item.variants && item.variants.length > 0) {
      // Find default or first variant
      const defaultVar =
        item.variants.find((v: any) => v.is_default) || item.variants[0];
      setSelectedVariant(defaultVar);
    }
  }, [item.variants]);

  useEffect(() => {
    if (showVariants) {
      Animated.spring(slideFloat, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 5,
      }).start();
    } else {
      Animated.timing(slideFloat, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showVariants]);

  const handleAdd = (variant?: any) => {
    setQuantity(1);
    const target = variant || selectedVariant;

    // Construct CartItem
    const cartItem = {
      id: item.id,
      // If no variant is found/selected, we might use item directly,
      // but relying on target being defined if variants exist.
      // If no variants, target is null.
      variant_id: target?.id || undefined,
      name: item.name,
      variant_name: target?.title || target?.variant_weight || item.weight,
      price: target?.price || target?.variant_price || item.price,
      oldPrice: target?.old_price || target?.variant_old_price || item.oldPrice,
      image: item.image,
      store: item.store,
      quantity: 1,
      brand: item.brand,
    };

    if (onAdd) onAdd(cartItem);
  };

  const handleIncrement = () => setQuantity((q) => q + 1);
  const handleDecrement = () => setQuantity((q) => (q > 0 ? q - 1 : 0));

  const toggleVariants = () => {
    if (item.variants && item.variants.length > 0) {
      setShowVariants(!showVariants);
    }
  };

  const selectVariant = (variant: any) => {
    setSelectedVariant(variant);
    // animate close? or keep open? web keeps open on mobile usually or closes?
    // Web mobile logic: "Select variant but DO NOT close modal on mobile"
    // But we want to update the main card view.
  };

  const blurhash =
    "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQfQ";

  // Determine display data based on selection or fallback to item
  const displayPrice = selectedVariant
    ? selectedVariant.price || selectedVariant.variant_price
    : item.price;
  const displayOldPrice = selectedVariant
    ? selectedVariant.old_price || selectedVariant.variant_old_price
    : item.oldPrice;
  const displayWeight = selectedVariant
    ? selectedVariant.title || selectedVariant.variant_weight
    : item.weight;
  const displayImage = item.image; // Usually variants share image or have specific ones. Web uses item.image mostly.

  const hasVariants = item.variants && item.variants.length > 0;

  // Enhanced check using inventory-based stock from the backend
  const checkIsOutOfStock = (variant: any, productObj: any) => {
    // 1. Check variant-level inventory stock (new system: computed_stock from inventory table)
    if (variant) {
      // New inventory-based fields from transformProduct
      if (variant.in_stock !== undefined) return !variant.in_stock;
      if (variant.computed_stock !== undefined)
        return variant.computed_stock <= 0;

      // Check inventory array directly if present
      if (variant.inventory && Array.isArray(variant.inventory)) {
        const totalInvStock = variant.inventory.reduce(
          (sum: number, inv: any) => sum + (inv.stock_qty || 0),
          0,
        );
        return totalInvStock <= 0;
      }

      // Legacy fallbacks
      if (variant.inStock !== undefined && variant.inStock === false)
        return true;
      if (variant.availableStock !== undefined && variant.availableStock <= 0)
        return true;
      if (variant.variant_stock !== undefined && variant.variant_stock <= 0)
        return true;
      if (variant.stock !== undefined && variant.stock <= 0) return true;

      // If variant explicitly has positive stock
      if (
        variant.inStock === true ||
        variant.availableStock > 0 ||
        variant.stock > 0 ||
        variant.variant_stock > 0
      )
        return false;
    }

    // 2. Fallback to product-level stock
    if (productObj) {
      if (productObj.inStock !== undefined && productObj.inStock === false)
        return true;
      if (productObj.stock !== undefined && productObj.stock <= 0) return true;
      if (
        productObj.stockQuantity !== undefined &&
        productObj.stockQuantity <= 0
      )
        return true;
    }

    // Default: assume in stock if no stock info available
    return false;
  };

  const isOutOfStock = checkIsOutOfStock(selectedVariant, item);

  const discountPercent =
    displayOldPrice && displayOldPrice > displayPrice
      ? Math.round(((displayOldPrice - displayPrice) / displayOldPrice) * 100)
      : !!item.discount
        ? parseInt(
            String(item.discount).replace("%", "").replace("OFF", "").trim(),
          ) || 0
        : 0;

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        className={`${gridStyle ? "w-full" : "w-36 mr-4"} bg-white rounded-2xl border border-gray-100 overflow-hidden relative shadow-sm flex-col`}
        style={{ minHeight: 260 }}
      >
        {/* Image Container */}
        <View className="h-[120px] bg-gray-50 items-center justify-center relative w-full mb-1">
          {!!discountPercent && discountPercent > 0 && (
            <View className="absolute top-0 left-0 z-10 bg-[#E3182D] rounded-tl-2xl rounded-br-[16px] px-2 py-1.5 min-w-[36px] items-center">
              <Text className="text-white text-[11px] font-black leading-3">
                {discountPercent}%
              </Text>
              <Text className="text-white text-[7px] font-bold mt-[1px]">
                OFF
              </Text>
            </View>
          )}
          {!!item.isAd && (
            <View className="absolute bottom-2 left-2 bg-white/80 border border-gray-200 px-1 rounded z-10">
              <Text className="text-[8px] text-gray-400">Ad</Text>
            </View>
          )}
          {displayImage ? (
            <Image
              source={{ uri: displayImage }}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 16,
              }}
              resizeMode="cover"
            />
          ) : (
            <FontAwesome5 name="image" size={40} color="#ddd" />
          )}
        </View>

        {/* Content Section */}
        <View
          className="p-2.5 pt-1 flex-col justify-between"
          style={{ flex: 1 }}
        >
          <View>
            <View className="h-5 justify-center mb-2">
              {!!(item.brand || item.store) && (
                <View className="flex-row items-center">
                  {!!item.brand && (
                    <View className="bg-[#EAF2FF] border border-[#B2D1FF] px-1.5 py-0.5 rounded-md">
                      <Text className="text-[9px]  font-bold text-[#0D47A1]">
                        {item.brand}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            <Text
              className="text-[13px] font-extrabold text-[#111827] leading-4 mb-1 h-8"
              numberOfLines={2}
            >
              {item.name || "Product"}
            </Text>
          </View>

          {/* Weight & Variant Selector Trigger */}
          <View className="h-5 justify-center mb-1">
            <TouchableOpacity
              activeOpacity={hasVariants ? 0.6 : 1}
              onPress={toggleVariants}
              className="flex-row items-center justify-between"
            >
              <Text
                className={`text-[10px] font-medium ${showVariants ? "text-[#FD5B00]" : "text-gray-500"}`}
              >
                {displayWeight || "1 pc"}
              </Text>
              {hasVariants && (
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={14}
                  color={showVariants ? "#FD5B00" : "gray"}
                  style={{
                    transform: [{ rotate: showVariants ? "180deg" : "0deg" }],
                  }}
                />
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-1 items-end justify-between mt-0.5">
            <View className="min-h-[32px] justify-end pb-0.5">
              <Text className="text-[16px] font-black text-[#111827] leading-5">
                ₹{String(displayPrice || 0).replace("₹", "")}
              </Text>
              {!!displayOldPrice ? (
                <Text className="text-[11px] text-gray-400 line-through font-medium leading-[12px]">
                  ₹{String(displayOldPrice).replace("₹", "")}
                </Text>
              ) : (
                <Text className="text-[11px] text-transparent leading-[12px]">
                  ₹0
                </Text>
              )}
            </View>

            {quantity > 0 ? (
              <View className="flex-row items-center bg-[#FF6B00] rounded-[10px] h-[32px] px-1 shadow-sm w-[60px]">
                <TouchableOpacity
                  onPress={handleDecrement}
                  className="w-5 items-center justify-center p-1"
                >
                  <Text className="text-white font-bold text-lg">-</Text>
                </TouchableOpacity>
                <Text className="text-white font-bold text-[12px] flex-1 text-center">
                  {quantity}
                </Text>
                <TouchableOpacity
                  onPress={handleIncrement}
                  className="w-5 items-center justify-center p-1"
                >
                  <Text className="text-white font-bold text-lg">+</Text>
                </TouchableOpacity>
              </View>
            ) : isOutOfStock ? (
              <View className="bg-white border-2 border-[#FF6B00] w-[60px] h-[32px] items-center justify-center rounded-[10px]">
                <Text className="text-[#FF6B00] text-[12px] font-extrabold uppercase">
                  OUT
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => handleAdd()}
                className="bg-white border-2 border-[#FF6B00] w-[60px] h-[32px] items-center justify-center rounded-[10px]"
                activeOpacity={0.8}
              >
                <Text className="text-[#FF6B00] text-[12px] font-extrabold uppercase">
                  ADD
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {!!item.stockInfo?.low_stock && (
            <View className="flex-row items-center mt-1">
              <View className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1" />
              <Text className="text-[8px] text-orange-600 font-medium">
                Only {item.stockInfo.available_stock} left
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      {/* Variant Selection Modal */}
      <Modal
        transparent
        visible={showVariants}
        animationType="none"
        onRequestClose={() => setShowVariants(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setShowVariants(false)}
          />
          <Animated.View
            style={{ transform: [{ translateY: slideFloat }] }}
            className="bg-white rounded-t-3xl max-h-[70%] overflow-hidden"
          >
            <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
              <View>
                <Text className="text-base font-bold text-gray-900">
                  Choose a Pack Size
                </Text>
                <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowVariants(false)}
                className="p-2"
              >
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {item.variants?.map((variant: any, idx: number) => {
                const isSelected = selectedVariant?.id === variant.id;
                const vPrice = variant.price || variant.variant_price;
                const vOldPrice =
                  variant.old_price || variant.variant_old_price;
                const vWeight = variant.title || variant.variant_weight;
                const saved = vOldPrice && vPrice ? vOldPrice - vPrice : 0;

                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => selectVariant(variant)}
                    className={`flex-row items-center border rounded-xl p-3 mb-3 ${isSelected ? "border-[#FD5B00] bg-orange-50" : "border-gray-200"}`}
                  >
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-900 mb-1">
                        {vWeight}
                      </Text>
                      <View className="flex-row items-center gap-2">
                        <Text className="text-base font-bold text-gray-900">
                          ₹{vPrice}
                        </Text>
                        {!!vOldPrice && (
                          <Text className="text-xs text-gray-400 line-through">
                            ₹{vOldPrice}
                          </Text>
                        )}
                        {!!(saved > 0) && (
                          <View className="bg-orange-100 px-1.5 py-0.5 rounded">
                            <Text className="text-[10px] text-orange-700 font-bold">
                              ₹{saved} OFF
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Add Button for specific variant */}
                    {checkIsOutOfStock(variant, item) ? (
                      <View className="bg-gray-100 border border-gray-300 px-2 py-2 rounded-lg">
                        <Text className="text-gray-400 font-bold text-xs uppercase">
                          No Stock
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleAdd(variant)}
                        className="bg-white border border-[#FD5B00] px-4 py-2 rounded-lg"
                      >
                        <Text className="text-[#FD5B00] font-bold text-xs uppercase">
                          Add
                        </Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

export default React.memo(ProductCard);
