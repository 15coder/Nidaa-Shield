import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export function Header() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topPad =
    Platform.OS === "web" ? Math.max(insets.top, 28) : insets.top + 14;

  return (
    <View style={[styles.wrap, { paddingTop: topPad }]}>
      <View style={styles.topRow}>
        <View style={styles.rightCluster}>
          <Pressable
            accessibilityLabel="الإعدادات"
            onPress={() => router.push("/settings")}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: colors.muted,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Ionicons name="settings-outline" size={18} color={colors.foreground} />
          </Pressable>
          <View
            style={[styles.statusBadge, { backgroundColor: colors.primarySoft }]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: colors.primary }]}
            />
            <Text style={[styles.statusBadgeText, { color: colors.primary }]}>
              نداء-شايلد
            </Text>
          </View>
        </View>

        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logo}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 22,
    paddingBottom: 14,
  },
  topRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rightCluster: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 14,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontFamily: "Cairo_700Bold",
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
