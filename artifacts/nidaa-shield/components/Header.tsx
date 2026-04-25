import React from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export function Header() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const topPad =
    Platform.OS === "web" ? Math.max(insets.top, 28) : insets.top + 14;

  return (
    <View style={[styles.wrap, { paddingTop: topPad }]}>
      {/* Top row: Logo on the right, status pill on the left */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: colors.primarySoft },
          ]}
        >
          <View
            style={[styles.statusDot, { backgroundColor: colors.primary }]}
          />
          <Text style={[styles.statusBadgeText, { color: colors.primary }]}>
            محلي · بدون حساب
          </Text>
        </View>

        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logo}
        />
      </View>

      {/* Spacer between logo and title */}
      <View style={styles.spacer} />

      {/* Title block */}
      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          نداء شايلد
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          نظام الحماية المحلي
        </Text>
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
  logo: {
    width: 48,
    height: 48,
    borderRadius: 14,
  },
  spacer: {
    height: 18,
  },
  titleBlock: {
    alignItems: "flex-end",
  },
  title: {
    fontFamily: "Cairo_700Bold",
    fontSize: 22,
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 28,
  },
  subtitle: {
    fontFamily: "Cairo_500Medium",
    fontSize: 12,
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 16,
    marginTop: 2,
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
