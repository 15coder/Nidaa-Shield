import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1200,
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
          shadowOpacity: isActive ? 0.45 : 0.05,
          shadowRadius: isActive ? 20 : 10,
          shadowOffset: { width: 0, height: isActive ? 8 : 3 },
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
        <View
          style={[
            styles.card,
            {
              borderColor: isActive
                ? colors.cardActiveBorder
                : colors.cardBorder,
              borderWidth: isActive ? 1.5 : 1,
            },
          ]}
        >
          {/* Background fill: inactive = soft gray; active = blue gradient */}
          {isActive ? (
            <LinearGradient
              colors={["#EAF7FF", "#F4FBFF", "#FFFFFF"]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: "#F6F8FB" },
              ]}
            />
          )}

          <View style={styles.row}>
            {/* Icon block */}
            <View style={styles.iconWrap}>
              <Animated.View
                style={[
                  styles.iconShadowWrap,
                  {
                    transform: [{ scale: pulse }],
                    shadowColor: isActive
                      ? colors.primaryGlow
                      : "transparent",
                    shadowOpacity: isActive ? 0.85 : 0,
                    shadowRadius: isActive ? 14 : 0,
                    shadowOffset: { width: 0, height: 0 },
                    elevation: isActive ? 8 : 0,
                  },
                ]}
              >
                {isActive ? (
                  <LinearGradient
                    colors={["#33C5FF", "#00B4FF", "#0090CC"]}
                    start={{ x: 0.2, y: 0 }}
                    end={{ x: 0.8, y: 1 }}
                    style={styles.iconCircle}
                  >
                    <Ionicons
                      name={mode.iconName as never}
                      size={22}
                      color="#FFFFFF"
                    />
                  </LinearGradient>
                ) : (
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: "#FFFFFF",
                        borderWidth: 1,
                        borderColor: "rgba(0,0,0,0.06)",
                      },
                    ]}
                  >
                    <Ionicons
                      name={`${mode.iconName}-outline` as never}
                      size={22}
                      color={colors.foreground}
                    />
                  </View>
                )}
              </Animated.View>
            </View>

            {/* Text block */}
            <View style={styles.textWrap}>
              <View style={styles.titleRow}>
                <Text
                  style={[
                    styles.title,
                    {
                      color: isActive
                        ? colors.primaryDark
                        : colors.foreground,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {mode.title}
                </Text>
                {isActive ? (
                  <View
                    style={[
                      styles.activePill,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <View style={styles.activePillDot} />
                    <Text style={styles.activePillText}>مفعّل</Text>
                  </View>
                ) : (
                  <Ionicons
                    name="chevron-back"
                    size={16}
                    color={colors.mutedForeground}
                    style={{ marginStart: 8, opacity: 0.5 }}
                  />
                )}
              </View>

              <Text
                style={[
                  styles.description,
                  {
                    color: isActive
                      ? "rgba(0, 80, 120, 0.75)"
                      : colors.mutedForeground,
                  },
                ]}
                numberOfLines={2}
              >
                {mode.shortDescription}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 22,
  },
  pressable: {
    borderRadius: 22,
    overflow: "hidden",
  },
  card: {
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 12,
    overflow: "hidden",
    minHeight: 78,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  iconWrap: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  iconShadowWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
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
  activePill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    marginStart: 8,
  },
  activePillDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  activePillText: {
    fontFamily: "Cairo_700Bold",
    fontSize: 10,
    color: "#FFFFFF",
    letterSpacing: 0.4,
  },
  description: {
    fontFamily: "Cairo_500Medium",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: 4,
  },
});
