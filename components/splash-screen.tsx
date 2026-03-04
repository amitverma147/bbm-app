import { View, Text, Dimensions, StatusBar, Image } from "react-native";
import React, { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");
import logoSource from "../assets/BigBestMart.gif";

export default function SplashScreen() {
  // Animation values
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(20);
  const shimmerPosition = useSharedValue(-1);
  const dotScale1 = useSharedValue(0);
  const dotScale2 = useSharedValue(0);
  const dotScale3 = useSharedValue(0);

  useEffect(() => {
    // Logo entrance: scale up + fade in
    logoScale.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.back(1.5)),
    });
    logoOpacity.value = withTiming(1, { duration: 600 });

    // Tagline slide up + fade in
    taglineOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    taglineTranslateY.value = withDelay(
      600,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );

    // Loading dots: sequential pulse
    const dotConfig = { duration: 400, easing: Easing.inOut(Easing.ease) };
    dotScale1.value = withDelay(
      1000,
      withSequence(
        withTiming(1, dotConfig),
        withTiming(0.5, dotConfig),
        withTiming(1, dotConfig),
        withTiming(0.5, dotConfig),
      ),
    );
    dotScale2.value = withDelay(
      1150,
      withSequence(
        withTiming(1, dotConfig),
        withTiming(0.5, dotConfig),
        withTiming(1, dotConfig),
        withTiming(0.5, dotConfig),
      ),
    );
    dotScale3.value = withDelay(
      1300,
      withSequence(
        withTiming(1, dotConfig),
        withTiming(0.5, dotConfig),
        withTiming(1, dotConfig),
        withTiming(0.5, dotConfig),
      ),
    );
  }, []);

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale1.value }],
    opacity: interpolate(dotScale1.value, [0, 0.5, 1], [0, 0.5, 1]),
  }));

  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale2.value }],
    opacity: interpolate(dotScale2.value, [0, 0.5, 1], [0, 0.5, 1]),
  }));

  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale3.value }],
    opacity: interpolate(dotScale3.value, [0, 0.5, 1], [0, 0.5, 1]),
  }));

  return (
    <LinearGradient
      colors={["#FF6B35", "#FF8C42", "#FF6B35"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#FF6B35" />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        {/* Logo */}
        <Animated.View style={[{ alignItems: "center" }, logoAnimatedStyle]}>
          <View
            style={{
              width: 160,
              height: 160,
              borderRadius: 40,
              backgroundColor: "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              elevation: 10,
            }}
          >
            <View
              style={{
                width: 130,
                height: 130,
                borderRadius: 30,
                backgroundColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <Image
                source={logoSource}
                style={{ width: 110, height: 110 }}
                resizeMode="contain"
              />
            </View>
          </View>
        </Animated.View>

        {/* Brand Name */}
        <Animated.View
          style={[
            { alignItems: "center", marginTop: 28 },
            taglineAnimatedStyle,
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontSize: 34,
                fontWeight: "900",
                color: "#FFFFFF",
                letterSpacing: 1,
                textShadowColor: "rgba(0,0,0,0.15)",
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
              }}
            >
              BIG
            </Text>
            <Text
              style={{
                fontSize: 34,
                fontWeight: "900",
                color: "#1A1A2E",
                letterSpacing: 1,
                textShadowColor: "rgba(255,255,255,0.3)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}
            >
              BEST
            </Text>
            <Text
              style={{
                fontSize: 34,
                fontWeight: "900",
                color: "#FFFFFF",
                letterSpacing: 1,
                textShadowColor: "rgba(0,0,0,0.15)",
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
              }}
            >
              MART
            </Text>
          </View>

          {/* Accent Line */}
          <View
            style={{
              height: 3,
              width: 120,
              borderRadius: 2,
              backgroundColor: "#FFD700",
              marginBottom: 14,
              shadowColor: "#FFD700",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 8,
            }}
          />

          {/* Tagline */}
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "rgba(255,255,255,0.9)",
              letterSpacing: 6,
              textTransform: "uppercase",
            }}
          >
            Shop · Sell · Earn
          </Text>
        </Animated.View>

        {/* Loading Dots */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            position: "absolute",
            bottom: 80,
            gap: 10,
          }}
        >
          <Animated.View
            style={[
              {
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: "rgba(255,255,255,0.8)",
              },
              dot1Style,
            ]}
          />
          <Animated.View
            style={[
              {
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: "rgba(255,255,255,0.8)",
              },
              dot2Style,
            ]}
          />
          <Animated.View
            style={[
              {
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: "rgba(255,255,255,0.8)",
              },
              dot3Style,
            ]}
          />
        </View>
      </View>
    </LinearGradient>
  );
}
