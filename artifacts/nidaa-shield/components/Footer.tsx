import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  onAboutPress: () => void;
}

export function Footer({ onAboutPress }: Props) {
  const colors = useColors();

  const open = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onAboutPress}
        style={({ pressed }) => [styles.trustLink, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Ionicons name="information-circle-outline" size={16} color={colors.foreground} />
        <Text style={[styles.trustText, { color: colors.foreground }]}>
          لماذا نداء شايلد؟
        </Text>
      </Pressable>

      <View style={styles.socialRow}>
        <SocialButton
          icon="logo-whatsapp"
          label="واتساب"
          color={colors.foreground}
          onPress={() => open("https://wa.me/")}
        />
        <SocialButton
          icon="logo-instagram"
          label="إنستجرام"
          color={colors.foreground}
          onPress={() => open("https://instagram.com/")}
        />
      </View>

      <View style={styles.creditWrap}>
        <Text style={[styles.brandName, { color: colors.foreground }]}>
          نداء شايلد
        </Text>
        <View style={styles.creditDivider} />
        <Text style={[styles.creditText, { color: colors.mutedForeground }]}>
          تصميم وبرمجة
        </Text>
        <Text style={[styles.developerName, { color: colors.foreground }]}>
          نداء الرحمن عبود بن محمد
        </Text>
      </View>
    </View>
  );
}

function SocialButton({
  icon,
  label,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.socialBtn,
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.socialLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingTop: 18,
    paddingBottom: 8,
  },
  trustLink: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  trustText: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 13,
  },
  socialRow: {
    flexDirection: "row-reverse",
    gap: 10,
    marginTop: 14,
  },
  socialBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  socialLabel: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 12,
  },
  creditWrap: {
    alignItems: "center",
    marginTop: 22,
  },
  brandName: {
    fontFamily: "Cairo_900Black",
    fontSize: 14,
    letterSpacing: 1.5,
  },
  creditDivider: {
    width: 24,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.15)",
    marginVertical: 8,
  },
  creditText: {
    fontFamily: "Cairo_500Medium",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  developerName: {
    fontFamily: "Cairo_700Bold",
    fontSize: 13,
    marginTop: 3,
  },
});
