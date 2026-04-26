import {
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
  Cairo_900Black,
  useFonts,
} from "@expo-google-fonts/cairo";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { I18nManager, Platform, StatusBar, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import { VpnProvider } from "@/contexts/VpnContext";
import { useColors } from "@/hooks/useColors";

SplashScreen.preventAutoHideAsync();

if (Platform.OS !== "web") {
  try {
    I18nManager.allowRTL(false);
    I18nManager.forceRTL(false);
  } catch {}
}

function RootLayoutNav() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_left",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="stats" />
      <Stack.Screen name="speed-test" />
      <Stack.Screen name="settings/index" />
      <Stack.Screen name="settings/custom-dns" />
      <Stack.Screen name="settings/blocklist" />
      <Stack.Screen name="settings/whitelist" />
      <Stack.Screen name="settings/excluded-apps" />
      <Stack.Screen name="settings/advanced" />
    </Stack>
  );
}

function ThemedStatusBar() {
  const colors = useColors();
  return (
    <StatusBar
      barStyle={colors.statusBarStyle}
      backgroundColor={colors.background}
    />
  );
}

function ThemedShell() {
  const colors = useColors();
  const { hydrated } = useSettings();
  if (!hydrated) return null;
  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <VpnProvider>
        <ThemedStatusBar />
        <RootLayoutNav />
      </VpnProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
    Cairo_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // useColorScheme is used here to keep the layout reactive to system theme changes
  useColorScheme();

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <SettingsProvider>
          <ThemedShell />
        </SettingsProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
