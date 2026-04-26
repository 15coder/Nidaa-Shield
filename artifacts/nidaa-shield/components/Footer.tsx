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
const TELEGRAM_URL = "https://t.me/nidaashield";

export function Footer({ onAboutPress }: Props) {
  const colors = useColors();

  const open = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        تواصل معنا
      </Text>
      <View style={styles.row}>
        <SocialIcon
          icon="logo-whatsapp"
          color="#25D366"
          onPress={() => open(WHATSAPP_URL)}
          accessibilityLabel="واتساب"
        />
        <SocialIcon
          icon="paper-plane"
          color="#229ED9"
          onPress={() => open(TELEGRAM_URL)}
          accessibilityLabel="تلجرام"
        />
        <SocialIcon
          icon="logo-instagram"
          color="#E4405F"
          onPress={() => open(INSTAGRAM_URL)}
          accessibilityLabel="إنستغرام"
        />
        <SocialIcon
          icon="information-circle-outline"
          color={colors.foreground}
          onPress={onAboutPress}
          accessibilityLabel="حول التطبيق"
        />
      </View>
    </View>
  );
}

function SocialIcon({
  icon,
  color,
  onPress,
  accessibilityLabel,
}: {
  icon: any;
  color: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.iconBtn,
        {
          backgroundColor: color + "1A",
          borderColor: color + "40",
          opacity: pressed ? 0.6 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={20} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: 10,
  },
  label: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
