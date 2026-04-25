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
    <View style={styles.wrap}>
      <Pressable
        onPress={onAboutPress}
        style={({ pressed }) => [
          styles.trustLink,
          {
            backgroundColor: "rgba(0,0,0,0.04)",
            opacity: pressed ? 0.6 : 1,
          },
        ]}
      >
        <Ionicons
          name="information-circle-outline"
          size={14}
          color={colors.foreground}
        />
        <Text style={[styles.trustText, { color: colors.foreground }]}>
          لماذا نداء شايلد؟
        </Text>
      </Pressable>

      <View style={styles.socialRow}>
        <Pressable
          onPress={() => open(WHATSAPP_URL)}
          style={({ pressed }) => [
            styles.socialBtn,
            {
              borderColor: "rgba(0,0,0,0.08)",
              opacity: pressed ? 0.6 : 1,
            },
          ]}
        >
          <Ionicons name="logo-whatsapp" size={16} color={colors.foreground} />
          <Text style={[styles.socialLabel, { color: colors.foreground }]}>
            +963 980 362 204
          </Text>
        </Pressable>
        <Pressable
          onPress={() => open(INSTAGRAM_URL)}
          style={({ pressed }) => [
            styles.socialBtn,
            {
              borderColor: "rgba(0,0,0,0.08)",
              opacity: pressed ? 0.6 : 1,
            },
          ]}
        >
          <Ionicons
            name="logo-instagram"
            size={16}
            color={colors.foreground}
          />
          <Text style={[styles.socialLabel, { color: colors.foreground }]}>
            15coder
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 6,
    gap: 10,
  },
  trustLink: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  trustText: {
    fontFamily: "Cairo_700Bold",
    fontSize: 12,
  },
  socialRow: {
    flexDirection: "row-reverse",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  socialBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  socialLabel: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
});
