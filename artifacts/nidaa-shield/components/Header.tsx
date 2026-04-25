import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export function Header() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const topPad =
    Platform.OS === "web" ? Math.max(insets.top, 24) : insets.top + 8;

  return (
    <View style={[styles.wrap, { paddingTop: topPad }]}>
      <View style={styles.row}>
        <View
          style={[styles.brandMark, { borderColor: colors.cardBorder }]}
        >
          <Text style={[styles.brandLetter, { color: colors.foreground }]}>
            ن
          </Text>
        </View>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            نداء شايلد
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            نظام الحماية المحلي
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Ionicons name="cloud-offline" size={14} color={colors.success} />
          <Text style={[styles.statusBadgeText, { color: colors.success }]}>
            محلي
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 22,
    paddingBottom: 10,
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.02)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandLetter: {
    fontFamily: "Cairo_900Black",
    fontSize: 22,
    lineHeight: 28,
    marginTop: -2,
  },
  titleWrap: {
    flex: 1,
    marginStart: 12,
    alignItems: "flex-end",
  },
  title: {
    fontFamily: "Cairo_700Bold",
    fontSize: 18,
    textAlign: "right",
    writingDirection: "rtl",
  },
  subtitle: {
    fontFamily: "Cairo_500Medium",
    fontSize: 11,
    marginTop: 1,
    textAlign: "right",
    writingDirection: "rtl",
  },
  statusBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(27,122,75,0.10)",
  },
  statusBadgeText: {
    fontFamily: "Cairo_700Bold",
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
