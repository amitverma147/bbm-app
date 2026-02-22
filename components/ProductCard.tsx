import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
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

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        className={`${gridStyle ? "w-full" : "w-40 mr-4"} bg-white rounded-xl border border-gray-100 overflow-hidden relative shadow-sm`}
      >
        {/* Image Container */}
        <View className="h-32 bg-gray-50 items-center justify-center p-2 relative">
          {!!item.discount && (
            <View className="absolute top-0 left-0 z-10 bg-red-600 rounded-br-lg px-2 py-1">
              <Text className="text-white text-[10px] font-bold">
                {item.discount} OFF
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
              style={{ width: "100%", height: "100%" }}
              contentFit="contain"
              placeholder={blurhash}
              transition={500}
              cachePolicy="memory-disk"
            />
          ) : (
            <FontAwesome5 name="image" size={40} color="#ddd" />
          )}
        </View>

        {/* Content Section */}
        <View className="p-3">
          {!!(item.brand || item.store) && (
            <View className="flex-row items-center gap-1 mb-1 flex-wrap">
              {!!item.brand && (
                <View className="bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                  <Text className="text-[8px] font-medium text-blue-700">
                    {item.brand}
                  </Text>
                </View>
              )}
            </View>
          )}

          <Text
            className="text-xs font-bold text-gray-800 leading-4 mb-1 h-8"
            numberOfLines={2}
          >
            {item.name}
          </Text>

          {/* Weight & Variant Selector Trigger */}
          <TouchableOpacity
            activeOpacity={hasVariants ? 0.6 : 1}
            onPress={toggleVariants}
            className="flex-row items-center justify-between mb-2"
          >
            <Text
              className={`text-[10px] font-medium ${showVariants ? "text-[#FD5B00]" : "text-gray-500"}`}
            >
              {displayWeight}
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

          <View className="flex-row items-end justify-between mt-auto">
            <View>
              {!!displayOldPrice && (
                <Text className="text-[10px] text-gray-400 line-through">
                  ₹{String(displayOldPrice).replace("₹", "")}
                </Text>
              )}
              <Text className="text-sm font-bold text-gray-900">
                ₹{String(displayPrice).replace("₹", "")}
              </Text>
            </View>

            {quantity > 0 ? (
              <View className="flex-row items-center bg-[#FF6B00] rounded-lg h-7 px-1 shadow-sm">
                <TouchableOpacity
                  onPress={handleDecrement}
                  className="w-6 items-center justify-center"
                >
                  <Text className="text-white font-bold text-lg">-</Text>
                </TouchableOpacity>
                <Text className="text-white font-bold text-xs w-4 text-center">
                  {quantity}
                </Text>
                <TouchableOpacity
                  onPress={handleIncrement}
                  className="w-6 items-center justify-center"
                >
                  <Text className="text-white font-bold text-lg">+</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => handleAdd()}
                className="bg-orange-50 border border-[#FF6B00] px-4 py-1.5 rounded-lg shadow-sm"
              >
                <Text className="text-[#FF6B00] text-[10px] font-bold uppercase">
                  Add
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
                    <TouchableOpacity
                      onPress={() => handleAdd(variant)}
                      className="bg-white border border-[#FD5B00] px-4 py-2 rounded-lg"
                    >
                      <Text className="text-[#FD5B00] font-bold text-xs uppercase">
                        Add
                      </Text>
                    </TouchableOpacity>
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
