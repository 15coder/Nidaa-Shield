import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { MODES, useVpn } from "@/contexts/VpnContext";

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(mm)}:${pad(sec)}`;
}

export function StatusOrb() {
  const colors = useColors();
  const { activeMode, isConnected, uptimeSeconds, disconnect } = useVpn();
  const ring = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const isDark = colors.scheme === "dark";

  useEffect(() => {
    if (isConnected) {
      const r = Animated.loop(
        Animated.timing(ring, {
          toValue: 1,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      const p = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.06,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      r.start();
      p.start();
      return () => {
        r.stop();
        p.stop();
      };
    } else {
      ring.setValue(0);
      pulse.setValue(1);
    }
  }, [isConnected, ring, pulse]);

  const rotate = ring.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const activeDef = activeMode ? MODES[activeMode] : null;

  const handleDisconnect = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }
    disconnect();
  };

  // ---------- Theme-aware tokens ----------
  const cardActiveBg = isDark
    ? "rgba(0, 180, 255, 0.06)"
    : "rgba(0, 180, 255, 0.04)";
  const cardInactiveBg = colors.cardSolid;
  const cardActiveBorder = isDark
    ? "rgba(0, 180, 255, 0.35)"
    : "rgba(0, 180, 255, 0.25)";
  const cardInactiveBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(0, 0, 0, 0.06)";

  const orbActiveGradient: [string, string, string] = isDark
    ? ["#1A2A38", "#162636", "#0F2030"]
    : ["#FFFFFF", "#E8F7FF", "#BCE5FF"];
  const orbInactiveGradient: [string, string, string] = isDark
    ? ["#1A222C", "#161C24", "#0F141A"]
    : ["#F8F8FA", "#EDEDF0", "#E0E0E4"];
  const orbBorderColor = isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(255,255,255,0.9)";
  const orbIconActiveColor = isDark ? colors.primary : colors.primaryDark;

  const inactivePillBg = isDark
    ? "rgba(255,255,255,0.06)"
    : "rgba(0,0,0,0.06)";

  // The disconnect button — DO NOT use colors.foreground directly,
  // because in dark mode that becomes pure white and produces an
  // ugly white "rectangle" stuck in the middle of the active card.
  const disconnectBg = isConnected
    ? isDark
      ? colors.primarySoft
      : colors.foreground
    : isDark
      ? "rgba(255,255,255,0.05)"
      : "rgba(0,0,0,0.04)";
  const disconnectBorderColor = isDark
    ? colors.cardActiveBorder
    : "transparent";
  const disconnectBorderWidth = isDark && isConnected ? 1 : 0;
  const disconnectTextColor = isConnected
    ? isDark
      ? colors.primary
      : "#FFFFFF"
    : colors.mutedForeground;

  const bottomBorderColor = isDark
    ? "rgba(255,255,255,0.06)"
    : "rgba(0,0,0,0.06)";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isConnected ? cardActiveBg : cardInactiveBg,
          borderColor: isConnected ? cardActiveBorder : cardInactiveBorder,
        },
      ]}
    >
      <View style={styles.row}>
        {/* Orb on the right (RTL) */}
        <View style={styles.orbContainer}>
          <Animated.View
            style={[
              styles.ring,
              {
                borderColor: isConnected
                  ? colors.primaryGlow
                  : isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(10,10,10,0.06)",
                transform: [{ rotate }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.orb,
              {
                shadowColor: isConnected
                  ? colors.primaryGlow
                  : "rgba(0,0,0,0.1)",
                shadowOpacity: isConnected ? 0.9 : 0.2,
                transform: [{ scale: pulse }],
              },
            ]}
          >
            <LinearGradient
              colors={isConnected ? orbActiveGradient : orbInactiveGradient}
              start={{ x: 0.2, y: 0.1 }}
              end={{ x: 0.8, y: 1 }}
              style={[styles.orbGradient, { borderColor: orbBorderColor }]}
            >
              <Ionicons
                name={
                  activeDef
                    ? activeDef.iconName
                    : ("shield-outline" as never)
                }
                size={28}
                color={
                  isConnected ? orbIconActiveColor : colors.mutedForeground
                }
              />
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Info on the left (RTL) */}
        <View style={styles.infoCol}>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: isConnected ? colors.primary : inactivePillBg,
              },
            ]}
          >
            <View
              style={[
                styles.pillDot,
                {
                  backgroundColor: isConnected
                    ? "#FFFFFF"
                    : colors.mutedForeground,
                },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color: isConnected ? "#FFFFFF" : colors.mutedForeground,
                },
              ]}
            >
              {isConnected ? "مفعّل" : "غير مفعّل"}
            </Text>
          </View>

          <Text
            style={[styles.modeName, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {activeDef ? activeDef.title : "اختر وضع الحماية"}
          </Text>
        </View>
      </View>

      {/* Bottom row: uptime + disconnect */}
      <View style={[styles.bottomRow, { borderTopColor: bottomBorderColor }]}>
        <View style={styles.metricBox}>
          <Text
            style={[styles.metricLabel, { color: colors.mutedForeground }]}
          >
            مدة الاتصال
          </Text>
          <Text style={[styles.metricValue, { color: colors.foreground }]}>
            {isConnected ? formatTime(uptimeSeconds) : "00:00:00"}
          </Text>
        </View>

        <Pressable
          disabled={!isConnected}
          onPress={handleDisconnect}
          style={({ pressed }) => [
            styles.disconnectBtn,
            {
              backgroundColor: disconnectBg,
              borderColor: disconnectBorderColor,
              borderWidth: disconnectBorderWidth,
              opacity: isConnected ? (pressed ? 0.85 : 1) : 0.5,
            },
          ]}
        >
          <Ionicons
            name={isConnected ? "power" : "power-outline"}
            size={13}
            color={disconnectTextColor}
          />
          <Text
            style={[
              styles.disconnectText,
              {
                color: disconnectTextColor,
              },
            ]}
          >
            {isConnected ? "إيقاف" : "غير متصل"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 14,
  },
  orbContainer: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  orb: {
    width: 62,
    height: 62,
    borderRadius: 31,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    elevation: 8,
  },
  orbGradient: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  infoCol: {
    flex: 1,
    alignItems: "flex-end",
    gap: 6,
  },
  statusPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: "Cairo_700Bold",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  modeName: {
    fontFamily: "Cairo_700Bold",
    fontSize: 18,
    textAlign: "right",
    writingDirection: "rtl",
  },
  bottomRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  metricBox: {
    alignItems: "flex-end",
  },
  metricValue: {
    fontFamily: "Cairo_700Bold",
    fontSize: 15,
    fontVariant: ["tabular-nums"],
    marginTop: 2,
  },
  metricLabel: {
    fontFamily: "Cairo_500Medium",
    fontSize: 10,
  },
  disconnectBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  disconnectText: {
    fontFamily: "Cairo_700Bold",
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
