import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

export function PageHeader({ title, subtitle, onBack }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 28) : insets.top + 14;

  const handleBack = () => {
    if (onBack) onBack();
    else if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  return (
    <View style={[styles.wrap, { paddingTop: topPad, borderColor: colors.cardBorder }]}>
      <View style={styles.row}>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityLabel="رجوع"
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: colors.muted, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          {/* Visual chevron points "back" in RTL: chevron-forward = → which means back in RTL UI */}
          <Ionicons name="chevron-forward" size={20} color={colors.foreground} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleBlock: {
    flex: 1,
    paddingHorizontal: 12,
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
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: 2,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
