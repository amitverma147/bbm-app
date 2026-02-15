import { View, Text, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { API_BASE_URL } from '../constants/Config'

const { width } = Dimensions.get('window')

const SmallPromoCards = () => {
    const [cards, setCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchCards();
    }, []);

    const fetchCards = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/promo-banner/all`);
            const data = await response.json();
            if (data.success && data.data) {
                // Backend returns "data" array. Filter by active.
                // Adapting to component expectation of 'image_url' and 'link'
                const formatted = data.data
                    .filter((c: any) => c.status === 'active' || c.is_active || c.active)
                    .map((c: any) => ({
                        id: c.id,
                        image_url: c.image_url || c.image,
                        link: c.link || "/",
                        is_active: true
                    }));
                setCards(formatted);
            }
        } catch (error) {
            console.error("SmallPromoCards error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null; // Skeleton could be added
    if (cards.length === 0) return null;

    // Web uses infinite scroll animation. On mobile, a horizontal scroll is standard and user-friendly.
    return (
        <View className="py-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                {cards.map((card, index) => (
                    <TouchableOpacity
                        key={`${card.id}-${index}`}
                        className="mr-4 rounded-xl overflow-hidden shadow-sm bg-gray-100"
                        style={{ width: width * 0.4, height: 100 }}
                        onPress={() => router.push(card.link || "/")}
                    >
                        <Image
                            source={{ uri: card.image_url }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    )
}

export default SmallPromoCards
