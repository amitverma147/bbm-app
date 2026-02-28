import { Stack, useRouter, useSegments } from "expo-router"; // Hot Reload Fix
import SmartBar from "../components/SmartBar";
import "../polyfills";

import SplashScreen from "@/components/splash-screen";
import {
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    useFonts,
} from "@expo-google-fonts/poppins";
import { useEffect, useState } from "react";
import { Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "../global.css";

import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { CartProvider } from "../contexts/CartContext";
import { DeliveryChargeProvider } from "../contexts/DeliveryChargeContext";
import { LocationProvider } from "../contexts/LocationContext";

import { WalletProvider } from "../contexts/WalletContext";

// Apply Poppins as default font globally
(Text as any).defaultProps = (Text as any).defaultProps || {};
(Text as any).defaultProps.style = [{ fontFamily: "Poppins_400Regular" }];

// Separate component for Auth Guard to use useAuth hook
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    setIsNavigationReady(true);
  }, []);

  useEffect(() => {
    if (!isNavigationReady || loading) return;

    const inLogin = segments[0] === "login";
    const inSignup = segments[0] === "signup";

    // Check if user is in a public route
    const inPublicRoute = inLogin || inSignup;

    if (!isAuthenticated && !inPublicRoute) {
      // Redirect to login if not authenticated and not in a public route
      router.replace("/login");
    } else if (isAuthenticated && inPublicRoute) {
      // Redirect to tabs if authenticated and trying to access login/signup
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, loading, segments, isNavigationReady]);

  return <>{children}</>;
}

export const unstable_settings = {
  // initialRouteName: "(tabs)", // potential conflict with auth redirect
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <LocationProvider>
          <CartProvider>
            <WalletProvider>
              <DeliveryChargeProvider>
                <AuthGuard>
                  <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="login" options={{ headerShown: false }} />
                    <Stack.Screen name="signup" options={{ headerShown: false }} />
                    <Stack.Screen name="profile" options={{ headerShown: false }} />
                    <Stack.Screen name="wallet" options={{ headerShown: false }} />
                    <Stack.Screen name="wishlist" options={{ headerShown: false }} />
                    <Stack.Screen name="addresses" options={{ headerShown: false }} />
                    <Stack.Screen name="eato" options={{ headerShown: false }} />
                    <Stack.Screen name="star" options={{ headerShown: false }} />
                    <Stack.Screen name="bazaar" options={{ headerShown: false }} />
                    <Stack.Screen name="+not-found" />
                  </Stack>
                  <SmartBar />
                </AuthGuard>
              </DeliveryChargeProvider>
            </WalletProvider>
          </CartProvider>
        </LocationProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
