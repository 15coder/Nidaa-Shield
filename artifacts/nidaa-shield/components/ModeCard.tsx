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
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(glow, {
      toValue: isActive ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();

    if (isActive) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.1,
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
  }, [isActive, pulse, glow]);

  const handlePressIn = () => {
    Animated.spring(press, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(press, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 6,
    }).start();
  };

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    onPress();
  };

  return (
    <Animated.View
      style={[
        styles.outer,
        {
          transform: [{ scale: press }],
          shadowColor: isActive ? colors.primaryGlow : "#000",
          shadowOpacity: isActive ? 0.5 : 0.05,
          shadowRadius: isActive ? 18 : 10,
          shadowOffset: { width: 0, height: isActive ? 6 : 3 },
          elevation: isActive ? 10 : 3,
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
          intensity={isActive ? 70 : 30}
          tint="light"
          style={[
            styles.card,
            {
              backgroundColor: isActive
                ? colors.cardActive
                : colors.card,
              borderColor: isActive
                ? colors.cardActiveBorder
                : colors.cardBorder,
              borderWidth: isActive ? 1.5 : 1,
            },
          ]}
        >
          <View style={styles.row}>
            {/* Icon block */}
            <View style={styles.iconWrap}>
              <Animated.View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: isActive
                      ? colors.primary
                      : "rgba(0,0,0,0.04)",
                    borderColor: isActive
                      ? "transparent"
                      : "rgba(0,0,0,0.06)",
                    transform: [{ scale: pulse }],
                    shadowColor: isActive ? colors.primaryGlow : "transparent",
                    shadowOpacity: isActive ? 0.8 : 0,
                    shadowRadius: isActive ? 12 : 0,
                    shadowOffset: { width: 0, height: 0 },
                  },
                ]}
              >
                <Ionicons
                  name={
                    (isActive
                      ? mode.iconName
                      : (`${mode.iconName}-outline` as never)) as never
                  }
                  size={22}
                  color={isActive ? "#FFFFFF" : colors.foreground}
                />
              </Animated.View>
            </View>

            {/* Text block */}
            <View style={styles.textWrap}>
              <View style={styles.titleRow}>
                <Text
                  style={[
                    styles.title,
                    {
                      color: isActive ? colors.primaryDark : colors.foreground,
                      opacity: isActive ? 1 : 0.85,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {mode.title}
                </Text>
                <View
                  style={[
                    styles.protocolPill,
                    {
                      backgroundColor: isActive
                        ? colors.primarySoft
                        : "rgba(0,0,0,0.04)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.protocolText,
                      {
                        color: isActive
                          ? colors.primary
                          : colors.mutedForeground,
                      },
                    ]}
                  >
                    {mode.protocol}
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  styles.description,
                  { color: colors.mutedForeground },
                ]}
                numberOfLines={2}
              >
                {mode.shortDescription}
              </Text>

              <View style={styles.metaRow}>
                <Text
                  style={[styles.dnsText, { color: colors.mutedForeground }]}
                >
                  {mode.primaryDns}
                </Text>
                {isActive && (
                  <View style={styles.activeIndicator}>
                    <View
                      style={[
                        styles.activeDot,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                    <Text
                      style={[styles.activeLabel, { color: colors.primary }]}
                    >
                      مفعّل
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 28,
  },
  pressable: {
    borderRadius: 28,
    overflow: "hidden",
  },
  card: {
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    overflow: "hidden",
    minHeight: 78,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  iconWrap: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    elevation: 4,
  },
  textWrap: {
    flex: 1,
    marginStart: 12,
  },
  titleRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: "Cairo_700Bold",
    fontSize: 15,
    textAlign: "right",
    writingDirection: "rtl",
    flex: 1,
  },
  protocolPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginStart: 8,
  },
  protocolText: {
    fontFamily: "Cairo_700Bold",
    fontSize: 9,
    letterSpacing: 0.5,
  },
  description: {
    fontFamily: "Cairo_500Medium",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  dnsText: {
    fontFamily: "Cairo_500Medium",
    fontSize: 10,
    fontVariant: ["tabular-nums"],
    opacity: 0.7,
  },
  activeIndicator: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  activeLabel: {
    fontFamily: "Cairo_700Bold",
    fontSize: 10,
    letterSpacing: 0.3,
  },
});
