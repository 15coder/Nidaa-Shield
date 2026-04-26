import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useVpn } from "@/contexts/VpnContext";

export function EngineBanner() {
  const { engineStatus } = useVpn();
  const appVersion = Constants.expoConfig?.version ?? "?";
  const buildNumber =
    (Constants.expoConfig?.android?.versionCode ?? "?") as number | string;

  if (engineStatus === "ready") {
    return (
      <View
        style={[
          styles.banner,
          { backgroundColor: "rgba(0, 180, 100, 0.08)", borderColor: "rgba(0, 180, 100, 0.3)" },
        ]}
      >
        <Ionicons name="checkmark-circle" size={14} color="#00964F" />
        <Text style={[styles.text, { color: "#00964F" }]}>
          محرك الحماية الأصلي جاهز · v{appVersion} ({buildNumber})
        </Text>
      </View>
    );
  }

  if (engineStatus === "ios-unsupported") {
    return (
      <View
        style={[
          styles.banner,
          { backgroundColor: "rgba(255, 149, 0, 0.08)", borderColor: "rgba(255, 149, 0, 0.3)" },
        ]}
      >
        <Ionicons name="warning" size={14} color="#B86E00" />
        <Text style={[styles.text, { color: "#B86E00" }]}>
          غير مدعوم على iOS — استخدم Android
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: "rgba(220, 53, 69, 0.08)", borderColor: "rgba(220, 53, 69, 0.3)" },
      ]}
    >
      <Ionicons name="alert-circle" size={14} color="#B0202F" />
      <Text style={[styles.text, { color: "#B0202F" }]}>
        نسخة معاينة — يجب تثبيت APK من EAS Build لتفعيل الحماية · v{appVersion} ({buildNumber})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 18,
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  text: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 11,
    flex: 1,
    textAlign: "right",
  },
});
