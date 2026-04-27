import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
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

const STORAGE_KEY = "@nidaa-shield/salat-card-v1";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function SalatCard() {
  const colors = useColors();
  const isDark = colors.scheme === "dark";
  const [visible, setVisible] = useState(false);
  const [answered, setAnswered] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-16)).current;
  const scaleAnim = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    (async () => {
      try {
        const last = await AsyncStorage.getItem(STORAGE_KEY);
        if (last !== todayKey()) {
          setVisible(true);
        }
      } catch {
        setVisible(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!visible) return;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        speed: 14,
        bounciness: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, fadeAnim, slideAnim, scaleAnim]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 260,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -12,
        duration: 260,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  };

  const handleYes = async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    setAnswered(true);
    try { await AsyncStorage.setItem(STORAGE_KEY, todayKey()); } catch {}
    setTimeout(dismiss, 1200);
  };

  const handleNo = async () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    dismiss();
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)",
            borderColor: isDark
              ? "rgba(255,255,255,0.09)"
              : "rgba(0,0,0,0.07)",
          },
        ]}
      >
        {answered ? (
          <View style={styles.doneRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            <Text style={[styles.doneText, { color: colors.primary }]}>
              اللهم صلِّ وسلِّم على نبينا محمد ﷺ
            </Text>
          </View>
        ) : (
          <View style={styles.contentRow}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconCircle}
            >
              <Ionicons name="moon" size={16} color="#FFFFFF" />
            </LinearGradient>

            <View style={styles.textBlock}>
              <Text style={[styles.question, { color: colors.foreground }]}>
                هل صلّيت على النبي اليوم؟
              </Text>
              <Text style={[styles.sub, { color: colors.mutedForeground }]}>
                ﷺ صلوا عليه وسلّموا تسليما
              </Text>
            </View>

            <View style={styles.btns}>
              <Pressable
                onPress={handleYes}
                style={({ pressed }) => [
                  styles.btnYes,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                <Text style={styles.btnYesText}>نعم</Text>
              </Pressable>

              <Pressable
                onPress={handleNo}
                style={({ pressed }) => [
                  styles.btnNo,
                  {
                    borderColor: isDark
                      ? "rgba(255,255,255,0.12)"
                      : "rgba(0,0,0,0.1)",
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={[styles.btnNoText, { color: colors.mutedForeground }]}>
                  لاحقاً
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 18,
    marginBottom: 12,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  contentRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    alignItems: "flex-end",
  },
  question: {
    fontFamily: "Cairo_700Bold",
    fontSize: 13,
    textAlign: "right",
    writingDirection: "rtl",
  },
  sub: {
    fontFamily: "Cairo_500Medium",
    fontSize: 11,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: 1,
  },
  btns: {
    flexDirection: "row-reverse",
    gap: 6,
    flexShrink: 0,
  },
  btnYes: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  btnYesText: {
    fontFamily: "Cairo_700Bold",
    fontSize: 12,
    color: "#FFFFFF",
  },
  btnNo: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btnNoText: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 12,
  },
  doneRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 4,
  },
  doneText: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 13,
    textAlign: "right",
    writingDirection: "rtl",
  },
});
