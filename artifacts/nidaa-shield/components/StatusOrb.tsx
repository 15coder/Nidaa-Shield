import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useVpn, MODES } from "@/contexts/VpnContext";

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
function formatTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

export function StatusOrb() {
  const colors = useColors();
  const { activeMode, isConnected, bytesBlocked, uptimeSeconds } = useVpn();
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isConnected) {
      const loop = Animated.loop(
        Animated.timing(ring, {
          toValue: 1,
          duration: 3500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isConnected, ring]);

  const rotate = ring.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const activeDef = activeMode ? MODES[activeMode] : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.orbWrap}>
        <Animated.View
          style={[
            styles.ringOuter,
            {
              borderColor: isConnected
                ? "rgba(10,10,10,0.12)"
                : "rgba(10,10,10,0.06)",
              transform: [{ rotate }],
            },
          ]}
        />
        <View
          style={[
            styles.orb,
            {
              shadowColor: isConnected
                ? colors.silverGlow
                : "rgba(0,0,0,0.1)",
              shadowOpacity: isConnected ? 1 : 0.3,
            },
          ]}
        >
          <LinearGradient
            colors={
              isConnected
                ? ["#FFFFFF", "#F2F2F4", "#E2E2E6"]
                : ["#F8F8FA", "#EDEDF0", "#E0E0E4"]
            }
            start={{ x: 0.2, y: 0.1 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.orbGradient}
          >
            <View style={styles.orbInner}>
              <Ionicons
                name={isConnected ? "shield-checkmark" : "shield-outline"}
                size={42}
                color={colors.foreground}
              />
              <Text
                style={[
                  styles.statusLabel,
                  { color: isConnected ? colors.success : colors.mutedForeground },
                ]}
              >
                {isConnected ? "محمي" : "غير مفعّل"}
              </Text>
            </View>
          </LinearGradient>
        </View>
      </View>

      <Text style={[styles.modeName, { color: colors.foreground }]}>
        {activeDef ? activeDef.title : "اختر وضع الحماية"}
      </Text>
      {activeDef && (
        <Text style={[styles.modeSub, { color: colors.mutedForeground }]}>
          {activeDef.subtitle}
        </Text>
      )}

      {isConnected && (
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {formatBytes(bytesBlocked)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              تم حظره
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {formatTime(uptimeSeconds)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              مدة الاتصال
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 18,
  },
  orbWrap: {
    width: 168,
    height: 168,
    alignItems: "center",
    justifyContent: "center",
  },
  ringOuter: {
    position: "absolute",
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  orb: {
    width: 138,
    height: 138,
    borderRadius: 69,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 24,
    elevation: 10,
  },
  orbGradient: {
    width: 138,
    height: 138,
    borderRadius: 69,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  orbInner: {
    alignItems: "center",
    gap: 6,
  },
  statusLabel: {
    fontFamily: "Cairo_700Bold",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  modeName: {
    fontFamily: "Cairo_700Bold",
    fontSize: 22,
    marginTop: 18,
    textAlign: "center",
    writingDirection: "rtl",
  },
  modeSub: {
    fontFamily: "Cairo_500Medium",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
    writingDirection: "rtl",
  },
  statsRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: 18,
    gap: 18,
  },
  statBox: {
    alignItems: "center",
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  statValue: {
    fontFamily: "Cairo_700Bold",
    fontSize: 16,
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    fontFamily: "Cairo_500Medium",
    fontSize: 11,
    marginTop: 2,
  },
});
