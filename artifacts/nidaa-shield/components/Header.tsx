import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useEffect } from "react";
import { Animated, Easing, Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export function Header() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pulse = useRef(new Animated.Value(1)).current;

  const topPad =
    Platform.OS === "web" ? Math.max(insets.top, 28) : insets.top + 14;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

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

          {/* AI Assistant button */}
          <Pressable
            accessibilityLabel="مساعد نداء شايلد"
            onPress={() => router.push("/assistant")}
            style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
          >
            <Animated.View style={{ transform: [{ scale: pulse }] }}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.assistantBtn}
              >
                <Ionicons name="sparkles" size={15} color="#FFFFFF" />
                <Text style={styles.assistantLabel}>المساعد</Text>
              </LinearGradient>
            </Animated.View>
          </Pressable>
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
  assistantBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
  },
  assistantLabel: {
    fontFamily: "Cairo_700Bold",
    fontSize: 11.5,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});
