import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { AuthProvider, useAuth } from "@/src/auth";

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync();

function Gate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === "(auth)";
    const atRoot = segments.length === 0;
    if (!user && !inAuthGroup) router.replace("/(auth)/login");
    else if (user && (inAuthGroup || atRoot)) router.replace("/(tabs)/home");
  }, [user, loading, segments, router]);

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F5F6FA" } }} />;
}

export default function RootLayout() {
  const [loaded, error] = useIconFonts();
  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);
  if (!loaded && !error) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#F5F6FA" }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
