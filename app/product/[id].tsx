import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";

import { useCart } from "../../contexts/CartContext";
import { API_BASE_URL } from "../../constants/Config";
import ProductCard from "../../components/ProductCard";

const { width, height: SCREEN_HEIGHT } = Dimensions.get("window");

const getYouTubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

export default function SingleProductPage() {
  const router = useRouter();
  const { id: productId } = useLocalSearchParams();
  const { addToCart, cartItems, removeFromCart } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  // Delivery & Pincode
  const [checkPincode, setCheckPincode] = useState("");
  const [availabilityData, setAvailabilityData] = useState<any>(null);
  const [checkingDelivery, setCheckingDelivery] = useState(false);

  // Expanable Sections (FAQs)
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [showCoupons, setShowCoupons] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!productId) return;
      try {
        setLoading(true);

        const prodRes = await fetch(
          `${API_BASE_URL}/productsroute/${productId}`,
        );
        const prodData = await prodRes.json();

        if (prodData.success) {
          setProduct(prodData.product);

          // Custom variants fetch logic from next.js ref
          const varRes = await fetch(
            `${API_BASE_URL}/variants/product/${productId}`,
          );
          const varData = await varRes.json();
          if (varData.success && varData.data?.length > 0) {
            setVariants(varData.data);
            const defaultVar =
              varData.data.find((v: any) => v.is_default) || varData.data[0];
            setSelectedVariant(defaultVar);
          } else if (
            prodData.product.variants &&
            prodData.product.variants.length > 0
          ) {
            setVariants(prodData.product.variants);
            const defaultVar =
              prodData.product.variants.find((v: any) => v.is_default) ||
              prodData.product.variants[0];
            setSelectedVariant(defaultVar);
          }

          // Optionally fetch related
          if (prodData.product.subcategory_id) {
            fetch(
              `${API_BASE_URL}/productsroute/subcategory/${prodData.product.subcategory_id}`,
            )
              .then((res) => res.json())
              .then((relData) => {
                if (relData.success) {
                  setRelatedProducts(
                    relData.data.filter(
                      (p: any) => p.id !== prodData.product.id,
                    ),
                  );
                }
              })
              .catch((e) => console.log(e));
          }
        } else {
          setError(prodData.error || "Product not found");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  const currentPrice = selectedVariant
    ? selectedVariant.price || selectedVariant.variant_price
    : product?.price;
  const currentOldPrice = selectedVariant
    ? selectedVariant.old_price || selectedVariant.variant_old_price
    : product?.old_price || product?.oldPrice;
  const currentWeight = selectedVariant
    ? selectedVariant.title || selectedVariant.variant_weight
    : product?.portion || product?.uom || "1 Unit";
  const currentDiscountPercentage =
    currentOldPrice && currentOldPrice > currentPrice
      ? Math.round(((currentOldPrice - currentPrice) / currentOldPrice) * 100)
      : selectedVariant
        ? selectedVariant.discount_percentage
        : product?.discount || 0;

  // Helper function from Web (UnifiedProductCard.jsx & UniqueVariantCard.jsx)
  const checkIsVariantOutOfStock = (variant: any) => {
    if (!variant) return false;
    if (variant.inStock !== undefined && variant.inStock === false) return true;
    if (variant.availableStock !== undefined && variant.availableStock <= 0) return true;
    // Legacy fallback
    if (variant.stockInfo || variant.stock_info) {
      const isStockFalse = (variant.stockInfo?.in_stock ?? variant.stock_info?.in_stock) === false;
      const isAvailableZero = (variant.stockInfo?.available_stock ?? variant.stock_info?.available_stock ?? 1) <= 0;
      if (isStockFalse || isAvailableZero) return true;
    }
    if (variant.variant_stock !== undefined && variant.variant_stock <= 0) return true;
    if (variant.stock !== undefined && variant.stock <= 0) return true;
    return false;
  };

  const isOutOfStock = checkIsVariantOutOfStock(selectedVariant || product);

  const stockInfo = selectedVariant?.stock_info || product?.stock_info || { available_stock: 0 };
  const availableStock = stockInfo.available_stock !== undefined ? stockInfo.available_stock : (product?.stock || 0);

  const inStock = !isOutOfStock;

  const mediaItems = useMemo(() => {
    const items: any[] = [];
    if (selectedVariant?.image_url || selectedVariant?.variant_image_url) {
      items.push({
        type: "image",
        src: selectedVariant.image_url || selectedVariant.variant_image_url,
      });
    }
    if (product?.media?.length) {
      items.push(
        ...product.media.map((m: any) => ({
          type: m.media_type || "image",
          src: m.url,
        })),
      );
    }
    if (items.length === 0) {
      items.push({ type: "image", src: product?.image || "" });
    }
    return items;
  }, [product, selectedVariant]);

  const cartItemKey = selectedVariant
    ? `${product?.id}_variant_${selectedVariant.id}`
    : product?.id;

  // Custom cart helper using cartItems mapped directly
  const cartItemMatch = cartItems?.find(
    (item: any) => item.id === cartItemKey || item.id === product?.id,
  );
  const quantityInCart = cartItemMatch ? cartItemMatch.quantity : 0;

  const handleAddToCart = () => {
    if (!product) return;
    let variantToUse = selectedVariant;
    if (!variantToUse && variants.length > 0) {
      variantToUse = variants.find((v: any) => v.is_default) || variants[0];
    }

    if (quantityInCart >= availableStock) {
      Alert.alert("Max Stock", `You cannot add more than ${availableStock} of this item.`);
      return;
    }

    const targetItem = {
      id: cartItemKey || product.id,
      productId: product.id,
      variant_id: variantToUse?.id,
      name: variantToUse
        ? `${product.name} - ${variantToUse.title || variantToUse.variant_name || variantToUse.weight || "Standard"}`
        : product.name,
      price: Number(variantToUse?.price || currentPrice),
      old_price: Number(
        variantToUse?.old_price || currentOldPrice || currentPrice * 1.2,
      ),
      image: mediaItems[0]?.src || product.image,
      weight:
        variantToUse?.title || variantToUse?.variant_weight || currentWeight,
      stock: variantToUse?.stock || product.stock,
      quantity: 1,
      isVariant: !!variantToUse,
    };
    addToCart(targetItem);
  };

  const handleIncrement = () => {
    if (quantityInCart < availableStock) {
      handleAddToCart();
    } else {
      Alert.alert("Max Stock", `You cannot add more than ${availableStock} of this item.`);
    }
  };

  const handleRemoveFromCart = () => {
    if (cartItemMatch) {
      // Our remove logic requires an item
      const mockItem = { id: cartItemKey || product.id, ...cartItemMatch };
      removeFromCart(mockItem);
    }
  };

  const handleBuyNow = () => {
    if (quantityInCart === 0) handleAddToCart();
    router.push("/cart");
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#00C28A" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-4">
        <Text className="text-red-500 font-bold text-center">
          {error || "Product not found"}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-gray-100 px-6 py-2 rounded-lg"
        >
          <Text className="text-gray-900 font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderGallery = () => {
    const currentMedia = mediaItems[selectedImageIndex] || mediaItems[0];

    return (
      <View className="w-full bg-gray-50 aspect-square relative z-0">
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-12 left-4 z-20 w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm"
        >
          <Ionicons name="chevron-back" size={20} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity className="absolute top-12 right-4 z-20 w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm">
          <Ionicons name="share-social" size={20} color="#333" />
        </TouchableOpacity>

        <View className="flex-1 items-center justify-center p-8 mt-12">
          {currentMedia.type === "video" ? (
            <View className="w-full h-full rounded-xl overflow-hidden bg-black">
              {getYouTubeId(currentMedia.src) ? (
                <YoutubePlayer
                  height={width}
                  play={true}
                  videoId={getYouTubeId(currentMedia.src)!}
                  mute={true}
                  forceAndroidAutoplay={true}
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Text className="text-white">Invalid Video</Text>
                </View>
              )}
            </View>
          ) : (
            <Image
              source={{ uri: currentMedia.src }}
              className="w-full h-full"
              contentFit="contain"
              transition={300}
            />
          )}
        </View>

        {mediaItems.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="absolute bottom-4 w-full px-4"
            contentContainerStyle={{ gap: 8 }}
          >
            {mediaItems.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedImageIndex(idx)}
                className={`w-14 h-14 bg-white rounded-lg border-2 overflow-hidden items-center justify-center ${selectedImageIndex === idx ? "border-green-500" : "border-transparent"}`}
              >
                {item.type === "video" ? (
                  <View className="w-full h-full bg-gray-200 items-center justify-center text-red-600">
                    <Ionicons name="play-circle" size={24} color="#ef4444" />
                  </View>
                ) : (
                  <Image
                    source={{ uri: item.src }}
                    className="w-full h-full"
                    contentFit="contain"
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {renderGallery()}

        <View className="p-4 bg-white -mt-4 rounded-t-3xl shadow-sm z-10 border-b border-gray-50 pb-6">
          {/* Product Info */}
          {product.brands?.[0]?.brand && (
            <View className="bg-green-50 self-start px-2 py-1.5 rounded mb-3 flex-row items-center gap-1">
              <Text className="text-green-700 text-xs font-bold uppercase tracking-wider">
                {product.brands[0].brand.name}
              </Text>
              <Ionicons name="chevron-forward" size={10} color="#15803d" />
            </View>
          )}

          <View className="flex-row items-start justify-between mb-2 pr-2">
            <Text className="text-[22px] font-black text-gray-900 leading-tight flex-1">
              {product.name}
            </Text>
            <TouchableOpacity onPress={() => setIsWishlisted(!isWishlisted)}>
              <Ionicons
                name="heart"
                size={24}
                color={isWishlisted ? "#ef4444" : "#9ca3af"}
              />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center gap-2 mb-3 mt-1">
            <Text className="text-gray-500 text-sm">
              Net Qty:{" "}
              {selectedVariant?.net_quantity || `1 Pack (${currentWeight})`}
            </Text>
            <Text className="text-gray-300">•</Text>
            <View className="flex-row items-center bg-green-50 px-1.5 py-0.5 rounded">
              <Text className="text-green-700 text-[11px] font-bold mr-0.5">
                {product.rating || 4.8}
              </Text>
              <Ionicons name="star" size={10} color="#15803d" />
            </View>
            <Text className="text-sm text-gray-500">
              ({product.review_count || 0} reviews)
            </Text>
          </View>

          <View className="bg-gray-100 self-start px-3 py-1.5 rounded-lg flex-row items-center gap-1.5 mb-2 border border-gray-200">
            <Ionicons name="time-outline" size={14} color="#15803d" />
            <Text className="text-gray-900 font-bold text-xs">
              Quick Delivery
            </Text>
          </View>

          {/* Price Details */}
          <View className="border-t border-gray-100 pt-4 mb-4">
            <View className="flex-row items-end gap-3 mb-1">
              <Text className="text-3xl font-black text-gray-900 shadow-sm">
                ₹{parseFloat(currentPrice).toFixed(2)}
              </Text>
              {currentOldPrice > currentPrice && (
                <View className="flex-row items-center mb-1">
                  <Text className="text-gray-400 line-through mr-2 text-sm">
                    MRP ₹{currentOldPrice}
                  </Text>
                  <View className="bg-blue-100 px-1.5 rounded py-0.5">
                    <Text className="text-blue-700 text-[10px] font-bold">
                      {currentDiscountPercentage}% OFF
                    </Text>
                  </View>
                </View>
              )}
            </View>
            <Text className="text-xs text-gray-400">(Incl. of all taxes)</Text>
          </View>

          {/* Variants */}
          {variants.length > 0 && (
            <View className="mb-4 mt-6">
              <Text className="text-base font-bold text-gray-700 mb-3">
                Select Unit
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
              >
                {variants.map((v) => (
                  <TouchableOpacity
                    key={v.id}
                    onPress={() => setSelectedVariant(v)}
                    className={`min-w-[80px] h-[64px] rounded-xl items-center justify-center border-2 ${selectedVariant?.id === v.id
                      ? "border-[#22c55e] bg-green-50/50"
                      : "border-[#e5e7eb] bg-white"
                      }`}
                  >
                    <Text
                      className={`font-semibold text-[13px] ${selectedVariant?.id === v.id
                        ? "text-[#15803d]"
                        : "text-gray-700"
                        }`}
                    >
                      {v.title}
                    </Text>
                    <Text className="text-[#6b7280] text-[13px] mt-0.5 font-medium">
                      ₹{v.price}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Store Badge */}
          {(product.product_recommended_store?.[0]?.recommended_store ||
            product.store) && (
              <TouchableOpacity className="bg-[#eff6ff] self-start px-3 py-2 rounded-xl flex-row items-center gap-1.5 mb-6">
                <Text className="text-[11px] font-bold text-gray-500 tracking-wide uppercase">
                  STORE:
                </Text>
                <Text className="text-[13px] font-bold text-gray-900 ml-1">
                  {product.product_recommended_store?.[0]?.recommended_store
                    ?.name || product.store?.name}
                </Text>
                <Ionicons name="chevron-forward" size={12} color="#111827" />
              </TouchableOpacity>
            )}

          <View className="border-t border-b border-gray-100 py-4 mb-6">
            <Text className="text-[14px] text-gray-500 font-medium">
              Sold by:{" "}
              <Text className="font-bold text-gray-900">
                {product.seller_name || "BigandBestMart"}
              </Text>
            </Text>
          </View>

          {/* Check Availability */}
          <View className="mb-6">
            <Text className="font-bold text-gray-900 text-base mb-3">
              Check Availability
            </Text>

            <View className="flex-row items-center gap-3 mb-3">
              <View className="flex-1 border border-gray-300 rounded-lg h-12 justify-center px-4">
                <Text className="text-gray-400 text-sm">Enter Pincode</Text>
              </View>
              <Text className="text-[#15803d] font-bold text-base px-2">
                Check
              </Text>
            </View>

            <View className="bg-orange-50 border border-orange-100 rounded-lg py-2 px-3 flex-row items-center gap-2">
              <Text className="text-orange-300 text-sm">💡</Text>
              <Text className="text-orange-500 text-xs font-medium tracking-wide">
                Add items worth ₹258 to avoid delivery charge!
              </Text>
            </View>
          </View>

          {/* Coupons & Offers */}
          <View className="border border-gray-100 rounded-2xl p-4 mb-6 relative shadow-sm bg-white">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <View className="w-5 h-3 bg-[#fcd34d] rounded-sm" />
                <Text className="font-bold text-gray-900 text-[15px]">
                  Coupons & Offers
                </Text>
              </View>
              <Ionicons name="chevron-up" size={18} color="#6b7280" />
            </View>

            <View className="border-t border-dashed border-gray-100 pt-4 flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-green-50 items-center justify-center mr-3">
                <Text className="text-green-600 font-bold text-xs">%</Text>
              </View>
              <View className="flex-1">
                <View className="bg-gray-100 self-start px-2 py-0.5 rounded mb-1">
                  <Text className="text-[10px] font-bold text-gray-800 tracking-wider">
                    WEL10
                  </Text>
                </View>
                <Text className="text-[13px] text-gray-500 font-medium">
                  Discount applied
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
            </View>
          </View>

          {/* Service Cards */}
          <View className="flex-row gap-2 mb-8">
            <View className="flex-1 border border-gray-100 bg-white rounded-xl p-3 items-center justify-center h-[90px] shadow-sm">
              <Text className="text-2xl mb-1 text-red-500 font-bold">❌</Text>
              <Text className="text-[10px] font-bold text-gray-900 text-center leading-tight">
                No Return
              </Text>
              <Text className="text-[9px] text-gray-400 text-center mt-0.5">
                or Exchange
              </Text>
            </View>
            <View className="flex-1 border border-gray-100 bg-gray-50/50 rounded-xl p-3 items-center justify-center h-[90px]">
              <Text className="text-2xl mb-1 text-yellow-500">⚡</Text>
              <Text className="text-[10px] font-bold text-gray-900 text-center leading-tight">
                Superfast
              </Text>
              <Text className="text-[10px] font-bold text-gray-900 text-center leading-tight">
                Delivery
              </Text>
            </View>
            <View className="flex-1 border border-gray-100 bg-gray-50/50 rounded-xl p-3 items-center justify-center h-[90px]">
              <Text className="text-2xl mb-1 mt-1">
                <Ionicons name="shield-checkmark" size={20} color="#6b7280" />
              </Text>
              <Text className="text-[10px] font-bold text-gray-900 text-center leading-tight">
                Best Prices
              </Text>
            </View>
            <View className="flex-1 border border-gray-100 bg-gray-50/50 rounded-xl p-3 items-center justify-center h-[90px]">
              <View className="bg-green-500 rounded p-1 mb-1 mt-1">
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>
              <Text className="text-[10px] font-bold text-gray-900 text-center leading-tight">
                Wide Range
              </Text>
            </View>
          </View>

          {/* Similar Products */}
          {relatedProducts.length > 0 && (
            <View className="mb-6">
              <Text className="font-bold text-gray-900 text-lg mb-4">
                Similar Products
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16, gap: 12 }}
              >
                {relatedProducts.map((rel) => (
                  <ProductCard key={rel.id} item={rel} onAdd={addToCart} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Product Highlights */}
          <View className="mb-6">
            <Text className="font-bold text-gray-900 text-lg mb-3 mt-2">
              Product Highlights
            </Text>

            <View className="border border-gray-800 rounded-2xl overflow-hidden bg-white">
              <View className="p-4 border-b border-gray-100">
                <Text className="font-bold text-gray-900 text-base mb-3">
                  Description
                </Text>
                <Text className="text-[14px] text-gray-600 mb-2 font-medium">
                  {product.description
                    ? product.description.replace(/<[^>]+>/g, "")
                    : "No description available."}
                </Text>
              </View>

              {/* Stats Map */}
              <View className="flex-row flex-wrap p-4">
                {product.brands?.[0]?.brand && (
                  <View className="w-1/2 mb-4">
                    <Text className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                      Brand:{" "}
                      <Text className="text-gray-900">
                        {product.brands[0].brand.name}
                      </Text>
                    </Text>
                  </View>
                )}
                {product.hsn_or_sac_code && (
                  <View className="w-1/2 mb-4">
                    <Text className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                      HSN Code:{" "}
                      <Text className="text-gray-900">
                        {product.hsn_or_sac_code}
                      </Text>
                    </Text>
                  </View>
                )}
                <View className="w-1/2 mb-4">
                  <Text className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                    GST Rate:{" "}
                    <Text className="text-gray-900">
                      {product.gst_rate || 0}%
                    </Text>
                  </Text>
                </View>
                {product.store && (
                  <View className="w-1/2 mb-4">
                    <Text className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                      Store:{" "}
                      <Text className="text-gray-900">
                        {product.store.name}
                      </Text>
                    </Text>
                  </View>
                )}
                <View className="w-1/2 mb-2">
                  <Text className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                    Packaging:
                  </Text>
                  <Text className="text-[12px] font-bold text-gray-900 uppercase tracking-widest">
                    STANDARD BOX
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Customer Reviews */}
          <View className="mb-6">
            <Text className="font-bold text-gray-900 text-lg mb-3">
              Customer Reviews
            </Text>
            <View className="border border-gray-800 rounded-2xl items-center justify-center py-6 bg-white">
              <Text className="text-4xl font-black text-gray-900">
                {product.rating || "4.5"}{" "}
                <Text className="text-xl text-gray-400 font-medium">/ 5</Text>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating WhatsApp Button */}
      <TouchableOpacity className="absolute bottom-24 right-4 w-12 h-12 rounded-full bg-[#25D366] items-center justify-center shadow-2xl z-40 elevation-4">
        <Ionicons
          name="logo-whatsapp"
          size={28}
          color="white"
          style={{ marginLeft: 1 }}
        />
      </TouchableOpacity>

      {/* Sticky Bottom Actions */}
      <View className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-200 px-4 py-3 pb-8 flex-row items-center shadow-2xl z-50">
        <View className="flex-1 right-3">
          <Text className="text-xs text-gray-500 font-bold mb-0.5">
            Total Price
          </Text>
          <Text className="text-xl font-black text-gray-900">
            ₹{parseFloat(currentPrice).toFixed(2)}
          </Text>
          {currentOldPrice > currentPrice && (
            <Text className="text-[10px] text-green-600 font-bold">
              {currentDiscountPercentage}% OFF
            </Text>
          )}
        </View>

        <View
          className="flex-row gap-3 flex-1 ml-auto shrink-0 relative pr-0"
          style={{ width: "55%" }}
        >
          {!inStock ? (
            <TouchableOpacity
              disabled
              className="flex-1 h-12 bg-gray-200 rounded-xl items-center justify-center"
            >
              <Text className="font-bold text-gray-500 uppercase text-xs">
                Out of Stock
              </Text>
            </TouchableOpacity>
          ) : quantityInCart > 0 ? (
            <>
              <View className="h-12 border border-gray-300 bg-gray-50 rounded-xl flex-row items-center justify-between px-2 flex-1 relative">
                <TouchableOpacity
                  onPress={handleRemoveFromCart}
                  className="w-8 h-full items-center justify-center"
                >
                  <Text className="text-lg font-bold text-gray-600 shadow-sm">
                    -
                  </Text>
                </TouchableOpacity>
                <Text className="text-base font-bold text-gray-900">
                  {quantityInCart}
                </Text>
                <TouchableOpacity
                  onPress={handleAddToCart}
                  className="w-8 h-full items-center justify-center"
                >
                  <Text className="text-lg font-bold text-green-600 shadow-sm">
                    +
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={handleBuyNow}
                className="h-12 bg-[#FF6B00] rounded-xl items-center justify-center shadow-md flex-1 relative active:scale-95"
              >
                <Text className="text-white font-bold text-xs uppercase text-shadow-sm">
                  Buy Now
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={handleAddToCart}
                className="h-12 border border-[#FF6B00] bg-orange-50 rounded-xl items-center justify-center flex-1 active:scale-95"
              >
                <Text className="text-[#FF6B00] font-bold text-xs uppercase">
                  Add to Cart
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleBuyNow}
                className="h-12 bg-[#FF6B00] shadow-md rounded-xl items-center justify-center flex-1 active:scale-95"
              >
                <Text className="text-white font-bold text-xs uppercase">
                  Buy Now
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
