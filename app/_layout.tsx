import { Stack } from "expo-router";

import "react-native-reanimated";
import "../global.css";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import SplashScreen from "@/components/splash-screen";

export const unstable_settings = {
  anchor: "(tabs)",
};

import { AuthProvider } from "../contexts/AuthContext";
import { CartProvider } from "../contexts/CartContext";
import { LocationProvider } from "../contexts/LocationContext";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "PlusJakartaSans-Regular": require("../assets/fonts/PlusJakartaSans-VariableFont_wght.ttf"),
    "PlusJakartaSans-Italic": require("../assets/fonts/PlusJakartaSans-Italic-VariableFont_wght.ttf"),
  });

  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (fontsLoaded) {
      // Show splash for 2 seconds after fonts load
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded || showSplash) {
    return <SplashScreen />;
  }

  return (
    <AuthProvider>
      <LocationProvider>
        <CartProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </CartProvider>
      </LocationProvider>
    </AuthProvider>
  );
}
