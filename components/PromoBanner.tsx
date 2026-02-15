import { View, Text, Image, Dimensions } from 'react-native'
import React, { useEffect, useState } from 'react'
import Carousel from 'react-native-reanimated-carousel'
import { API_BASE_URL } from '../constants/Config'

const { width } = Dimensions.get('window')

const PromoBanner = () => {
    const [banners, setBanners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            // Replicating web logic: try 'promo' endpoint first, fallback to all admin
            let result = await fetch(`${API_BASE_URL}/banners/type/promo`).then(r => r.json()).catch(() => null);

            if (!result || !result.success || !result.banners || result.banners.length === 0) {
                result = await fetch(`${API_BASE_URL}/banners/admin/all`).then(r => r.json()).catch(() => null);
            }

            if (result && result.success && result.banners) {
                const promo = result.banners.filter((b: any) => {
                    const pos = (b.position || b.position_name || "").toString().toLowerCase();
                    const name = (b.name || b.title || "").toString().toLowerCase();
                    return pos.includes('promo') || name.includes('promo');
                });
                setBanners(promo.length ? promo : []);
            }
        } catch (error) {
            console.error("PromoBanner error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || banners.length === 0) return null;

    return (
        <View className="py-4 px-4 bg-white">
            <Carousel
                loop
                width={width - 32} // padding horizontal 16*2
                height={160}
                autoPlay={true}
                data={banners}
                scrollAnimationDuration={1000}
                renderItem={({ item }: { item: any }) => (
                    <View className="flex-1 rounded-2xl overflow-hidden shadow-sm bg-gray-100">
                        {item.image_url ? (
                            <Image source={{ uri: item.image_url }} className="w-full h-full" resizeMode="cover" />
                        ) : (
                            <View className="flex-1 justify-center items-center bg-indigo-500">
                                <Text className="text-white font-bold text-xl">{item.title || "PROMO"}</Text>
                            </View>
                        )}
                    </View>
                )}
            />
        </View>
    )
}

export default PromoBanner
