import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import React, { useEffect, useState } from "react";
import { Dimensions, Image, Text, TouchableOpacity, View } from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import { API_BASE_URL } from "../constants/Config";

const { width } = Dimensions.get("window");

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
        fetch(`${API_BASE_URL}/video-cards/active`).then(async (res) => {
          if (!res.ok) throw new Error(`Video fetch failed: ${res.status}`);
          return res.json();
        }),
        // Use correct endpoint and don't double parse
        fetch(`${API_BASE_URL}/banner/all`)
          .then(async (res) => {
            if (!res.ok) return { success: false };
            return res.json();
          })
          .catch(() => ({ success: false })),
      ]);

      const videoData = videoRes;
      if (videoData?.success && videoData?.videoCards?.length > 0) {
        setVideos(videoData.videoCards);
        setCurrentVideo(videoData.videoCards[0]);
      } else if (Array.isArray(videoData) && videoData.length > 0) {
        setVideos(videoData);
        setCurrentVideo(videoData[0]);
      }

      // Banner data is already parsed in the promise above
      const bannerData = bannerRes;
      if (bannerData.success && bannerData.banners) {
        const found = bannerData.banners.find((b: any) => {
          const pos = (b.position || b.position_name || "")
            .toString()
            .toLowerCase();
          return pos.includes("mega");
        });
        if (found) setMegaBanner(found);
      }
    } catch (error) {
      console.error("VideoCardSection error:", error);
    } finally {
      setLoading(false);
    }
  };

  const isYouTubeUrl = (url: string) =>
    url && (url.includes("youtube.com") || url.includes("youtu.be"));

  const getYoutubeId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  if (loading) return null;
  if (!currentVideo && !megaBanner) return null;

  return (
    <View className="w-full flex-col">
      {/* Left Section: Video */}
      {currentVideo && (
        <View className="w-full h-[300px] bg-transparent overflow-hidden relative">
          {currentVideo.video_url ? (
            isYouTubeUrl(currentVideo.video_url) ? (
              (() => {
                const videoId = getYoutubeId(currentVideo.video_url);
                if (!videoId) return null;

                return (
                  <YoutubePlayer
                    height={300}
                    play={true}
                    mute={true}
                    forceAndroidAutoplay={true}
                    videoId={videoId}
                    webViewProps={{
                      allowsInlineMediaPlayback: true,
                      mediaPlaybackRequiresUserAction: false,
                    }}
                  />
                );
              })()
            ) : (
              <Video
                source={{ uri: currentVideo.video_url }}
                style={{ width: "100%", height: "100%" }}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay={true}
                isMuted={true}
              />
            )
          ) : currentVideo.thumbnail_url ? (
            <Image
              source={{ uri: currentVideo.thumbnail_url }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="absolute inset-0 bg-gray-800 items-center justify-center">
              <Text className="text-gray-400 text-sm">No video available</Text>
            </View>
          )}

          {/* Toggle Mute (only for direct video) */}
          {currentVideo.video_url && !isYouTubeUrl(currentVideo.video_url) && (
            <TouchableOpacity
              onPress={() => setIsMuted(!isMuted)}
              className="absolute bottom-4 right-4 bg-white/95 p-3 rounded-full border-2 border-[#FD5B00] shadow-2xl items-center justify-center"
            >
              <Ionicons
                name={isMuted ? "volume-mute" : "volume-high"}
                size={24}
                color="#FD5B00"
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Right Section: Mega Banner */}
      {megaBanner && (
        <TouchableOpacity className="w-full h-[180px] rounded-xl overflow-hidden shadow-xl relative bg-[#FD5B00]">
          {megaBanner.image_url ? (
            <Image
              source={{ uri: megaBanner.image_url }}
              className="w-full h-full"
              resizeMode="stretch"
            />
          ) : (
            <View className="flex-1 justify-center items-center p-4">
              <Text className="text-white font-bold text-2xl">MEGA SALE</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

export default VideoCardSection;
