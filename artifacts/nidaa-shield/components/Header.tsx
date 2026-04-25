import React from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export function Header() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const topPad =
    Platform.OS === "web" ? Math.max(insets.top, 24) : insets.top + 6;

  return (
    <View style={[styles.wrap, { paddingTop: topPad }]}>
      <View style={styles.row}>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logo}
        />
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            نداء شايلد
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            نظام الحماية المحلي
          </Text>
        </View>
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
            محلي
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 12,
  },
  titleWrap: {
    flex: 1,
    marginStart: 12,
    alignItems: "flex-end",
  },
  title: {
    fontFamily: "Cairo_700Bold",
    fontSize: 17,
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 22,
  },
  subtitle: {
    fontFamily: "Cairo_500Medium",
    fontSize: 11,
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 14,
  },
  statusBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontFamily: "Cairo_700Bold",
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
