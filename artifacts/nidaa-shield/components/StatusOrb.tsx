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

function formatBytes(n: number) {
  if (n < 1024) return `${n} ب`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} ك.ب`;
  return `${(n / (1024 * 1024)).toFixed(2)} م.ب`;
}
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
  const { activeMode, isConnected, bytesBlocked, uptimeSeconds, disconnect } =
    useVpn();
  const ring = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

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

  return (
    <View style={styles.wrap}>
      <View style={styles.orbCol}>
        <View style={styles.orbContainer}>
          <Animated.View
            style={[
              styles.ring,
              {
                borderColor: isConnected
                  ? colors.primaryGlow
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
              colors={
                isConnected
                  ? ["#FFFFFF", "#E8F7FF", "#BCE5FF"]
                  : ["#F8F8FA", "#EDEDF0", "#E0E0E4"]
              }
              start={{ x: 0.2, y: 0.1 }}
              end={{ x: 0.8, y: 1 }}
              style={styles.orbGradient}
            >
              <Ionicons
                name={
                  activeDef
                    ? activeDef.iconName
                    : ("shield-outline" as never)
                }
                size={36}
                color={
                  isConnected ? colors.primaryDark : colors.mutedForeground
                }
              />
            </LinearGradient>
          </Animated.View>
        </View>
      </View>

      <View style={styles.infoCol}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: isConnected
                  ? colors.primarySoft
                  : "rgba(0,0,0,0.05)",
              },
            ]}
          >
            <View
              style={[
                styles.pillDot,
                {
                  backgroundColor: isConnected
                    ? colors.primary
                    : colors.mutedForeground,
                },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color: isConnected ? colors.primary : colors.mutedForeground,
                },
              ]}
            >
              {isConnected ? "مفعّل" : "غير مفعّل"}
            </Text>
          </View>
        </View>

        <Text
          style={[styles.modeName, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {activeDef ? activeDef.title : "اختر وضع الحماية"}
        </Text>

        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={[styles.metricValue, { color: colors.foreground }]}>
              {isConnected ? formatTime(uptimeSeconds) : "00:00:00"}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
              مدة الاتصال
            </Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricBox}>
            <Text style={[styles.metricValue, { color: colors.foreground }]}>
              {isConnected ? formatBytes(bytesBlocked) : "0 ب"}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
              تم حظره
            </Text>
          </View>
        </View>

        {/* Always-rendered control area to prevent layout shifts */}
        <View style={styles.controlArea}>
          <Pressable
            disabled={!isConnected}
            onPress={handleDisconnect}
            style={({ pressed }) => [
              styles.disconnectBtn,
              {
                backgroundColor: isConnected
                  ? colors.foreground
                  : "rgba(0,0,0,0.04)",
                opacity: isConnected ? (pressed ? 0.85 : 1) : 0.5,
              },
            ]}
          >
            <Ionicons
              name={isConnected ? "power" : "power-outline"}
              size={14}
              color={isConnected ? "#FFFFFF" : colors.mutedForeground}
            />
            <Text
              style={[
                styles.disconnectText,
                {
                  color: isConnected ? "#FFFFFF" : colors.mutedForeground,
                },
              ]}
            >
              {isConnected ? "إيقاف الحماية" : "غير متصل"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 16,
  },
  orbCol: {
    width: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  orbContainer: {
    width: 110,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  orb: {
    width: 90,
    height: 90,
    borderRadius: 45,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 18,
    elevation: 8,
  },
  orbGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  infoCol: {
    flex: 1,
    alignItems: "flex-end",
    minHeight: 110,
    justifyContent: "space-between",
  },
  statusRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    width: "100%",
    justifyContent: "flex-start",
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
    marginTop: 4,
    width: "100%",
  },
  metricsRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: 4,
  },
  metricBox: {
    alignItems: "flex-end",
  },
  metricDivider: {
    width: 1,
    height: 22,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginHorizontal: 12,
  },
  metricValue: {
    fontFamily: "Cairo_700Bold",
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
  metricLabel: {
    fontFamily: "Cairo_500Medium",
    fontSize: 10,
    marginTop: 1,
  },
  controlArea: {
    width: "100%",
    alignItems: "flex-end",
  },
  disconnectBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
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
