import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import type { ModeDefinition } from "@/contexts/VpnContext";

interface Props {
  mode: ModeDefinition;
  isActive: boolean;
  onPress: () => void;
}

export function ModeCard({ mode, isActive, onPress }: Props) {
  const colors = useColors();
  const pulse = useRef(new Animated.Value(1)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isActive) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.08,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulse.setValue(1);
    }
  }, [isActive, pulse]);

  const handlePressIn = () => {
    Animated.spring(press, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(press, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    onPress();
  };

  const tint = isActive ? "light" : "default";

  return (
    <Animated.View
      style={[
        styles.outer,
        {
          transform: [{ scale: press }],
          shadowColor: isActive ? colors.cardActiveGlow : "#000",
          shadowOpacity: isActive ? 0.55 : 0.06,
          shadowRadius: isActive ? 22 : 12,
          shadowOffset: { width: 0, height: isActive ? 8 : 4 },
          elevation: isActive ? 12 : 4,
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
        style={styles.pressable}
      >
        <BlurView
          intensity={isActive ? 65 : 35}
          tint={tint}
          style={[
            styles.card,
            {
              backgroundColor: isActive
                ? colors.cardActive
                : colors.card,
              borderColor: isActive
                ? colors.cardActiveBorder
                : colors.cardBorder,
            },
          ]}
        >
          {/* Subtle inner sheen on active */}
          {isActive && (
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFillObject,
                {
                  borderRadius: 32,
                  backgroundColor: "rgba(255,255,255,0.35)",
                },
              ]}
            />
          )}

          <View style={styles.row}>
            <View style={styles.textWrap}>
              <Text
                style={[
                  styles.title,
                  { color: colors.foreground, opacity: isActive ? 1 : 0.78 },
                ]}
                numberOfLines={1}
              >
                {mode.title}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  {
                    color: colors.mutedForeground,
                    opacity: isActive ? 0.95 : 0.7,
                  },
                ]}
                numberOfLines={2}
              >
                {mode.subtitle}
              </Text>
            </View>

            <Animated.View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isActive
                    ? colors.foreground
                    : "rgba(0,0,0,0.04)",
                  borderColor: isActive
                    ? "transparent"
                    : "rgba(0,0,0,0.06)",
                  transform: [{ scale: pulse }],
                  shadowColor: isActive ? colors.silverGlow : "transparent",
                  shadowOpacity: isActive ? 0.9 : 0,
                  shadowRadius: isActive ? 14 : 0,
                },
              ]}
            >
              <Ionicons
                name={
                  (isActive
                    ? mode.iconName
                    : (`${mode.iconName}-outline` as never)) as never
                }
                size={26}
                color={isActive ? "#FFFFFF" : colors.foreground}
              />
            </Animated.View>
          </View>

          <View style={styles.footerRow}>
            <View style={styles.protocolPill}>
              <Text style={[styles.protocolText, { color: colors.mutedForeground }]}>
                {mode.protocol}
              </Text>
            </View>
            <Text
              style={[
                styles.dnsText,
                {
                  color: isActive
                    ? colors.foreground
                    : colors.mutedForeground,
                  opacity: isActive ? 0.9 : 0.55,
                },
              ]}
            >
              {mode.primaryDns}
            </Text>
            {isActive && (
              <View style={styles.statusDot}>
                <View
                  style={[
                    styles.statusDotInner,
                    { backgroundColor: colors.success },
                  ]}
                />
              </View>
            )}
          </View>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 32,
    marginBottom: 14,
  },
  pressable: {
    borderRadius: 32,
    overflow: "hidden",
  },
  card: {
    borderRadius: 32,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 22,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textWrap: {
    flex: 1,
    marginStart: 16,
    alignItems: "flex-end",
  },
  title: {
    fontFamily: "Cairo_700Bold",
    fontSize: 20,
    textAlign: "right",
    writingDirection: "rtl",
  },
  subtitle: {
    fontFamily: "Cairo_500Medium",
    fontSize: 13,
    marginTop: 4,
    textAlign: "right",
    writingDirection: "rtl",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  footerRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: 16,
    gap: 10,
  },
  protocolPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  protocolText: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  dnsText: {
    fontFamily: "Cairo_500Medium",
    fontSize: 12,
  },
  statusDot: {
    marginStart: "auto",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(27,122,75,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  statusDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
