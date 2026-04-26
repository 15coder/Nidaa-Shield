import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSettings, type ThemeMode } from "@/contexts/SettingsContext";

interface ToastConfig {
  icon: string;
  label: string;
  subtitle: string;
  lightAccent: string;
  darkAccent: string;
  lightAccentBg: string;
  darkAccentBg: string;
}

const CONFIGS: Record<ThemeMode, ToastConfig> = {
  light: {
    icon: "sunny",
    label: "وضع النهار",
    subtitle: "واجهة ناصعة ومريحة للعين",
    lightAccent: "#E07B00",
    darkAccent: "#FBBF24",
    lightAccentBg: "rgba(224,123,0,0.13)",
    darkAccentBg: "rgba(251,191,36,0.15)",
  },
  dark: {
    icon: "moon",
    label: "وضع الليل",
    subtitle: "راحة كاملة للعينين في الظلام",
    lightAccent: "#6366F1",
    darkAccent: "#A5B4FC",
    lightAccentBg: "rgba(99,102,241,0.12)",
    darkAccentBg: "rgba(165,180,252,0.15)",
  },
  system: {
    icon: "contrast",
    label: "يتبع النظام",
    subtitle: "يتغيّر تلقائياً مع إعدادات جهازك",
    lightAccent: "#0EA5E9",
    darkAccent: "#38BDF8",
    lightAccentBg: "rgba(14,165,233,0.12)",
    darkAccentBg: "rgba(56,189,248,0.15)",
  },
};

export function ThemeToast() {
  const settings = useSettings();
  const systemScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const effectiveScheme =
    settings.themeMode === "system"
      ? (systemScheme ?? "light")
      : settings.themeMode;
  const isDark = effectiveScheme === "dark";

  const [visible, setVisible] = useState(false);
  const [displayMode, setDisplayMode] = useState<ThemeMode>(
    settings.themeMode,
  );

  const isFirstRender = useRef(true);
  const prevMode = useRef<ThemeMode>(settings.themeMode);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slideY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.3)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    Animated.parallel([
      Animated.timing(slideY, {
        toValue: -150,
        duration: 300,
        easing: Easing.in(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  }, [slideY, opacity]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (prevMode.current === settings.themeMode) return;
    prevMode.current = settings.themeMode;

    if (timerRef.current) clearTimeout(timerRef.current);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
    }

    setDisplayMode(settings.themeMode);
    setVisible(true);

    slideY.setValue(-150);
    opacity.setValue(0);
    iconScale.setValue(0.3);
    iconRotate.setValue(settings.themeMode === "light" ? -30 : 30);

    Animated.parallel([
      Animated.spring(slideY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 72,
        friction: 11,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 90,
        friction: 7,
      }),
      Animated.timing(iconRotate, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();

    timerRef.current = setTimeout(dismiss, 2600);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [settings.themeMode]);

  if (!visible) return null;

  const cfg = CONFIGS[displayMode];
  const accent = isDark ? cfg.darkAccent : cfg.lightAccent;
  const accentBg = isDark ? cfg.darkAccentBg : cfg.lightAccentBg;

  const toastBg = isDark ? "#1B2436" : "#FFFFFF";
  const toastBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.07)";
  const labelColor = isDark ? "#F0F4F8" : "#0D1117";
  const subColor = isDark ? "#7A8799" : "#64748B";

  const iconSpin = iconRotate.interpolate({
    inputRange: [-360, 360],
    outputRange: ["-360deg", "360deg"],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrapper,
        { top: insets.top + 10, opacity, transform: [{ translateY: slideY }] },
      ]}
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: toastBg,
            borderColor: toastBorder,
            shadowColor: accent,
          },
        ]}
      >
        {/* Icon */}
        <Animated.View
          style={[
            styles.iconCircle,
            {
              backgroundColor: accentBg,
              transform: [{ scale: iconScale }, { rotate: iconSpin }],
            },
          ]}
        >
          <Ionicons name={cfg.icon as never} size={22} color={accent} />
        </Animated.View>

        {/* Text — RTL */}
        <View style={styles.textCol}>
          <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
            {cfg.label}
          </Text>
          <Text style={[styles.sub, { color: subColor }]} numberOfLines={1}>
            {cfg.subtitle}
          </Text>
        </View>

        {/* Accent dot */}
        <View style={[styles.dot, { backgroundColor: accent }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 50,
  },
  toast: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 22,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
    alignItems: "flex-end",
  },
  label: {
    fontFamily: "Cairo_700Bold",
    fontSize: 14,
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 20,
  },
  sub: {
    fontFamily: "Cairo_400Regular",
    fontSize: 11,
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 16,
    marginTop: 1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});
