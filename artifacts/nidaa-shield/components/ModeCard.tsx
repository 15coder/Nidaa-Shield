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
import { useSettings } from "@/contexts/SettingsContext";
import type { ModeDefinition } from "@/contexts/VpnContext";

interface Props {
  mode: ModeDefinition;
  isActive: boolean;
  onPress: () => void;
}

const ICON_SIZE = 52;
const CARD_RADIUS = 20;
const ACCENT_BAR_WIDTH = 3.5;

export function ModeCard({ mode, isActive, onPress }: Props) {
  const colors = useColors();
  const settings = useSettings();
  const isDark = colors.scheme === "dark";

  const breathe = useRef(new Animated.Value(1)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(glowOpacity, {
      toValue: isActive ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [isActive, glowOpacity]);

  useEffect(() => {
    if (isActive) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(breathe, {
            toValue: 1.12,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(breathe, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      Animated.timing(breathe, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isActive, breathe]);

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.965,
      speed: 60,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      speed: 35,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (Platform.OS !== "web" && settings.hapticsEnabled) {
      Haptics.impactAsync(
        isActive
          ? Haptics.ImpactFeedbackStyle.Light
          : Haptics.ImpactFeedbackStyle.Medium,
      ).catch(() => {});
    }
    onPress();
  };

  const accent = colors.primary;
  const accentDark = colors.primaryDark;
  const accentGlow = colors.primaryGlow;
  const accentSoft = colors.primarySoft;
  const activeBorder = colors.cardActiveBorder;

  const cardBg = isDark ? "#161C24" : "#F4F7FB";
  const activeBg = isDark
    ? "rgba(0, 180, 255, 0.07)"
    : "rgba(0, 180, 255, 0.05)";

  const inactiveIconBg = isDark
    ? "rgba(255,255,255,0.055)"
    : "rgba(0,0,0,0.045)";
  const inactiveIconBorder = isDark
    ? "rgba(255,255,255,0.09)"
    : "rgba(0,0,0,0.07)";

  return (
    <Animated.View
      style={[styles.wrapper, { transform: [{ scale: pressScale }] }]}
    >
      {/* Outer glow halo — fades in when active */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          {
            shadowColor: accentGlow,
            opacity: glowOpacity,
          },
        ]}
      />

      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
        style={[
          styles.card,
          {
            backgroundColor: isActive ? activeBg : cardBg,
            borderColor: isActive ? activeBorder : colors.cardBorder,
            borderWidth: isActive ? 1.5 : 1,
          },
        ]}
      >
        {/* Left accent bar — visible only when active */}
        {isActive && (
          <LinearGradient
            colors={[accent, accentDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.accentBar}
          />
        )}

        <View style={styles.row}>
          {/* ── Icon (RIGHT side in RTL) ── */}
          <Animated.View
            style={[
              styles.iconWrapper,
              { transform: [{ scale: breathe }] },
            ]}
          >
            {isActive ? (
              <LinearGradient
                colors={[accent, accentDark]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={[
                  styles.iconCircle,
                  {
                    shadowColor: accentGlow,
                    shadowOpacity: 1,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 10,
                  },
                ]}
              >
                <Ionicons
                  name={mode.iconName as never}
                  size={25}
                  color="#FFFFFF"
                />
              </LinearGradient>
            ) : (
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: inactiveIconBg,
                    borderWidth: 1,
                    borderColor: inactiveIconBorder,
                  },
                ]}
              >
                <Ionicons
                  name={(`${mode.iconName}-outline`) as never}
                  size={25}
                  color={colors.mutedForeground}
                />
              </View>
            )}
          </Animated.View>

          {/* ── Text ── */}
          <View style={styles.textCol}>
            <Text
              style={[
                styles.title,
                {
                  color: isActive ? accent : colors.foreground,
                },
              ]}
              numberOfLines={1}
            >
              {mode.title}
            </Text>
            <Text
              style={[
                styles.description,
                {
                  color: isActive
                    ? isDark
                      ? "rgba(200,220,240,0.75)"
                      : "rgba(20,40,70,0.65)"
                    : colors.mutedForeground,
                },
              ]}
              numberOfLines={2}
            >
              {mode.shortDescription}
            </Text>
          </View>

          {/* ── Left column: status badge ── */}
          <View style={styles.badgeCol}>
            {isActive ? (
              <View
                style={[
                  styles.activeBadge,
                  {
                    backgroundColor: accentSoft,
                    borderColor: activeBorder,
                  },
                ]}
              >
                <Ionicons name="checkmark" size={11} color={accent} />
                <Text style={[styles.activeBadgeLabel, { color: accent }]}>
                  مفعّل
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.protocolBadge,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.04)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.protocolLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {mode.protocol}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: CARD_RADIUS,
  },
  halo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CARD_RADIUS + 6,
    margin: -6,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 0,
  },
  card: {
    borderRadius: CARD_RADIUS,
    paddingHorizontal: 16,
    paddingVertical: 14,
    overflow: "hidden",
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 12,
    bottom: 12,
    width: ACCENT_BAR_WIDTH,
    borderTopRightRadius: ACCENT_BAR_WIDTH,
    borderBottomRightRadius: ACCENT_BAR_WIDTH,
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  iconWrapper: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontFamily: "Cairo_700Bold",
    fontSize: 15.5,
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 22,
  },
  description: {
    fontFamily: "Cairo_400Regular",
    fontSize: 11.5,
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 17,
    marginTop: 2,
  },
  badgeCol: {
    alignItems: "flex-start",
    justifyContent: "center",
    minWidth: 52,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeBadgeLabel: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 11,
    lineHeight: 16,
  },
  protocolBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  protocolLabel: {
    fontFamily: "Cairo_500Medium",
    fontSize: 10,
    letterSpacing: 0.6,
  },
});
