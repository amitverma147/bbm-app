import { View, Text, Image, TouchableOpacity, Dimensions } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { Video, ResizeMode } from 'expo-av'
import { WebView } from 'react-native-webview'
import { API_BASE_URL } from '../constants/Config'
import { Ionicons } from '@expo/vector-icons'

const { width } = Dimensions.get('window')

const VideoCardSection = () => {
    const [videos, setVideos] = useState<any[]>([]);
    const [currentVideo, setCurrentVideo] = useState<any>(null);
    const [megaBanner, setMegaBanner] = useState<any>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [videoRes, bannerRes] = await Promise.all([
                fetch(`${API_BASE_URL}/video-cards/active`).then(async res => {
                    if (!res.ok) throw new Error(`Video fetch failed: ${res.status}`);
                    return res.json();
                }),
                // Use correct endpoint and don't double parse
                fetch(`${API_BASE_URL}/banner/all`).then(async res => {
                    if (!res.ok) return { success: false };
                    return res.json();
                }).catch(() => ({ success: false }))
            ]);

            const videoData = videoRes;
            // Banner data is already parsed in the promise above
            const bannerData = bannerRes;
            if (bannerData.success && bannerData.banners) {
                const found = bannerData.banners.find((b: any) => {
                    const pos = (b.position || b.position_name || "").toString().toLowerCase();
                    return pos.includes('mega');
                });
                if (found) setMegaBanner(found);
            }

        } catch (error) {
            console.error("VideoCardSection error:", error);
        } finally {
            setLoading(false);
        }
    };

    const isYouTubeUrl = (url: string) => url && (url.includes('youtube.com') || url.includes('youtu.be'));

    const getYouTubeEmbedUrl = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}?playsinline=1&controls=0` : null;
    };

    if (loading) return null;
    if (!currentVideo && !megaBanner) return null;

    return (
        <View className="py-6 px-4">
            {/* Left Section: Video */}
            {currentVideo && (
                <View className="w-full h-[220px] rounded-2xl overflow-hidden bg-black mb-4 relative shadow-lg">
                    {currentVideo.video_url ? (
                        isYouTubeUrl(currentVideo.video_url) ? (
                            <WebView
                                source={{ uri: getYouTubeEmbedUrl(currentVideo.video_url) || '' }}
                                style={{ flex: 1 }}
                                javaScriptEnabled={true}
                                scrollViewEnabled={false}
                            />
                        ) : (
                            <Video
                                source={{ uri: currentVideo.video_url }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode={ResizeMode.COVER}
                                isLooping
                                shouldPlay
                                isMuted={isMuted}
                            />
                        )
                    ) : (
                        <Image source={{ uri: currentVideo.thumbnail_url }} className="w-full h-full" resizeMode="cover" />
                    )}

                    {/* Toggle Mute (only for direct video) */}
                    {!isYouTubeUrl(currentVideo.video_url || '') && (
                        <TouchableOpacity
                            onPress={() => setIsMuted(!isMuted)}
                            className="absolute bottom-3 right-3 bg-white/20 backdrop-blur-md p-2 rounded-full"
                        >
                            <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={20} color="white" />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Right Section: Mega Banner (Stacked on mobile) */}
            {megaBanner && (
                <TouchableOpacity className="w-full h-[180px] rounded-2xl overflow-hidden shadow-lg relative bg-orange-500">
                    {megaBanner.image_url ? (
                        <Image source={{ uri: megaBanner.image_url }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                        <View className="flex-1 justify-center items-center p-4">
                            <Text className="text-white font-bold text-2xl">MEGA SALE</Text>
                        </View>
                    )}
                </TouchableOpacity>
            )}
        </View>
    )
}

export default VideoCardSection
