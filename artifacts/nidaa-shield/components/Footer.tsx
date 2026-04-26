import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  onAboutPress: () => void;
}

const WHATSAPP_URL = "https://wa.me/963980362204";
const INSTAGRAM_URL = "https://www.instagram.com/15coder";

export function Footer({ onAboutPress }: Props) {
  const colors = useColors();

  const open = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View>
      <View style={styles.row}>
        <Pressable
          onPress={onAboutPress}
          accessibilityLabel="لماذا نداء شايلد"
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: colors.muted,
              opacity: pressed ? 0.6 : 1,
            },
          ]}
        >
          <Ionicons name="information-circle-outline" size={18} color={colors.foreground} />
        </Pressable>

        <Pressable
          onPress={() => open(WHATSAPP_URL)}
          style={({ pressed }) => [
            styles.socialBtn,
            { borderColor: colors.cardBorder, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Ionicons name="logo-whatsapp" size={15} color={colors.foreground} />
          <Text style={[styles.socialLabel, { color: colors.foreground }]}>
            +963 980 362 204
          </Text>
        </Pressable>

        <Pressable
          onPress={() => open(INSTAGRAM_URL)}
          style={({ pressed }) => [
            styles.socialBtn,
            { borderColor: colors.cardBorder, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Ionicons name="logo-instagram" size={15} color={colors.foreground} />
          <Text style={[styles.socialLabel, { color: colors.foreground }]}>
            15coder
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingTop: 4,
    paddingBottom: 6,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  socialBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  socialLabel: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
});
