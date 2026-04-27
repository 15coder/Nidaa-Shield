import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSettings } from "@/contexts/SettingsContext";

export interface AppToastConfig {
  title: string;
  subtitle?: string;
  icon?: string;
  accentLight?: string;
  accentDark?: string;
  duration?: number;
}

type ShowFn = (config: AppToastConfig) => void;

let _showRef: ShowFn | null = null;

export function showAppToast(config: AppToastConfig) {
  _showRef?.(config);
}

export function AppToastBridge() {
  const [config, setConfig] = useState<AppToastConfig | null>(null);
  const [visible, setVisible] = useState(false);

  const slideY = useRef(new Animated.Value(120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.4)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const settings = useSettings();
  const systemScheme = useColorScheme();
  const effectiveScheme =
    settings.themeMode === "system"
      ? (systemScheme ?? "light")
      : settings.themeMode;
  const isDark = effectiveScheme === "dark";

  const insets = useSafeAreaInsets();

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    Animated.parallel([
      Animated.timing(slideY, {
        toValue: 120,
        duration: 280,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  }, [slideY, opacity]);

  const show = useCallback(
    (cfg: AppToastConfig) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      setConfig(cfg);
      setVisible(true);

      slideY.setValue(120);
      opacity.setValue(0);
      iconScale.setValue(0.3);

      Animated.parallel([
        Animated.spring(slideY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 68,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(iconScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 7,
        }),
      ]).start();

      const dur = cfg.duration ?? 3000;
      timerRef.current = setTimeout(dismiss, dur);
    },
    [slideY, opacity, iconScale, dismiss],
  );

  useEffect(() => {
    _showRef = show;
    return () => {
      _showRef = null;
    };
  }, [show]);

  if (!visible || !config) return null;

  const accent = isDark
    ? (config.accentDark ?? "#2ECC71")
    : (config.accentLight ?? "#1B7A4B");
  const accentBg = accent + "20";
  const toastBg = isDark ? "#1B2436" : "#FFFFFF";
  const toastBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";
  const labelColor = isDark ? "#F0F4F8" : "#0D1117";
  const subColor = isDark ? "#7A8799" : "#64748B";

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrapper,
        {
          bottom: insets.bottom + 16,
          opacity,
          transform: [{ translateY: slideY }],
        },
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
        {/* Left accent bar */}
        <View style={[styles.accentBar, { backgroundColor: accent }]} />

        {/* Icon */}
        <Animated.View
          style={[
            styles.iconCircle,
            {
              backgroundColor: accentBg,
              transform: [{ scale: iconScale }],
            },
          ]}
        >
          <Ionicons
            name={(config.icon ?? "checkmark-circle") as never}
            size={22}
            color={accent}
          />
        </Animated.View>

        {/* Text */}
        <View style={styles.textCol}>
          <Text
            style={[styles.label, { color: labelColor }]}
            numberOfLines={1}
          >
            {config.title}
          </Text>
          {config.subtitle ? (
            <Text
              style={[styles.sub, { color: subColor }]}
              numberOfLines={2}
            >
              {config.subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9998,
    elevation: 49,
  },
  toast: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingEnd: 16,
    paddingStart: 20,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.20,
    shadowRadius: 20,
    elevation: 14,
  },
  accentBar: {
    position: "absolute",
    right: 0,
    top: 10,
    bottom: 10,
    width: 3.5,
    borderTopLeftRadius: 3.5,
    borderBottomLeftRadius: 3.5,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
    alignItems: "flex-end",
  },
  label: {
    fontFamily: "Cairo_700Bold",
    fontSize: 13.5,
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
    marginTop: 2,
  },
});
