import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
}

const PACKETS = [
  { domain: "doubleclick.net", blocked: true },
  { domain: "youtube.com", blocked: false },
  { domain: "googleads.g…", blocked: true },
  { domain: "wikipedia.org", blocked: false },
  { domain: "facebook-tr…", blocked: true },
  { domain: "open-meteo.com", blocked: false },
];

export function FirstConnectionAnimation({ visible, onClose }: Props) {
  const colors = useColors();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const trail = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const checkPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      setStep(0);
      setDone(false);
      trail.setValue(0);
      fade.setValue(0);
      checkPulse.setValue(0);
      return;
    }

    Animated.timing(fade, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    let i = 0;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      if (i >= PACKETS.length) {
        setDone(true);
        Animated.spring(checkPulse, {
          toValue: 1,
          useNativeDriver: true,
          friction: 4,
        }).start();
        return;
      }
      setStep(i);
      trail.setValue(0);
      Animated.timing(trail, {
        toValue: 1,
        duration: 850,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        i += 1;
        setTimeout(tick, 250);
      });
    };

    const start = setTimeout(tick, 400);
    return () => {
      cancelled = true;
      clearTimeout(start);
    };
  }, [visible, trail, fade, checkPulse]);

  const trailX = trail.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  const checkScale = checkPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const blockedSoFar = PACKETS.slice(0, step + (done ? 1 : 1)).filter(
    (p) => p.blocked,
  ).length;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <Animated.View
        style={[
          styles.overlay,
          { backgroundColor: colors.overlay, opacity: fade },
        ]}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.background,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>
            الحماية تعمل الآن
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            هكذا يفحص نداء شايلد كل طلب DNS قبل السماح بمروره:
          </Text>

          {/* Diagram: Phone — Shield — Internet */}
          <View style={styles.diagram}>
            <Node
              icon="phone-portrait-outline"
              label="هاتفك"
              colors={colors}
            />

            <View style={styles.lane}>
              <View
                style={[styles.laneLine, { backgroundColor: colors.cardBorder }]}
              />
              <Animated.View
                style={[
                  styles.packet,
                  {
                    transform: [{ translateX: trailX }],
                    backgroundColor: PACKETS[step]?.blocked
                      ? "#E03E52"
                      : colors.primary,
                  },
                ]}
              >
                <Ionicons
                  name={PACKETS[step]?.blocked ? "close" : "checkmark"}
                  size={10}
                  color="#FFFFFF"
                />
              </Animated.View>
            </View>

            <Node
              icon="shield-checkmark"
              label="الفلتر"
              accent
              colors={colors}
            />

            <View style={styles.lane}>
              <View
                style={[
                  styles.laneLine,
                  {
                    backgroundColor: PACKETS[step]?.blocked
                      ? "#E03E52" + "33"
                      : colors.primary + "55",
                  },
                ]}
              />
            </View>

            <Node icon="globe-outline" label="الإنترنت" colors={colors} />
          </View>

          <View
            style={[
              styles.domainPill,
              {
                backgroundColor: PACKETS[step]?.blocked
                  ? "#E03E52" + "1A"
                  : colors.primary + "1A",
                borderColor: PACKETS[step]?.blocked
                  ? "#E03E52" + "44"
                  : colors.primary + "44",
              },
            ]}
          >
            <Ionicons
              name={PACKETS[step]?.blocked ? "ban" : "checkmark-circle"}
              size={14}
              color={PACKETS[step]?.blocked ? "#E03E52" : colors.primary}
            />
            <Text
              style={[
                styles.domainText,
                {
                  color: PACKETS[step]?.blocked ? "#E03E52" : colors.primary,
                },
              ]}
              numberOfLines={1}
            >
              {PACKETS[step]?.domain}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {step + 1}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                طلب فُحص
              </Text>
            </View>
            <View
              style={[
                styles.statDivider,
                { backgroundColor: colors.cardBorder },
              ]}
            />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: "#E03E52" }]}>
                {blockedSoFar}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                إعلان حُجب
              </Text>
            </View>
          </View>

          {done ? (
            <Animated.View
              style={[
                styles.doneBlock,
                { transform: [{ scale: checkScale }] },
              ]}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.doneCircle}
              >
                <Ionicons name="checkmark" size={28} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.doneText, { color: colors.foreground }]}>
                هاتفك محمي الآن من الإعلانات والتتبّع.
              </Text>
            </Animated.View>
          ) : null}

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeBtn,
              {
                backgroundColor: done ? colors.primary : "transparent",
                borderColor: done ? "transparent" : colors.cardBorder,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.closeText,
                { color: done ? "#FFFFFF" : colors.foreground },
              ]}
            >
              {done ? "تمام، فهمت" : "تخطّي العرض"}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

function Node({
  icon,
  label,
  accent,
  colors,
}: {
  icon: any;
  label: string;
  accent?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.nodeWrap}>
      <View
        style={[
          styles.nodeCircle,
          {
            backgroundColor: accent ? colors.primary : colors.cardSolid,
            borderColor: accent ? colors.primary : colors.cardBorder,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={accent ? "#FFFFFF" : colors.foreground}
        />
      </View>
      <Text style={[styles.nodeLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 18,
  },
  title: {
    fontFamily: "Cairo_900Black",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 6,
  },
  sub: {
    fontFamily: "Cairo_500Medium",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  diagram: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  nodeWrap: {
    alignItems: "center",
    width: 60,
  },
  nodeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeLabel: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 10,
    marginTop: 6,
  },
  lane: {
    flex: 1,
    height: 30,
    justifyContent: "center",
    overflow: "hidden",
  },
  laneLine: {
    height: 2,
    width: "100%",
    borderRadius: 1,
  },
  packet: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  domainPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 8,
    maxWidth: "85%",
  },
  domainText: {
    fontFamily: "Cairo_700Bold",
    fontSize: 12,
  },
  statsRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  statBox: {
    alignItems: "center",
    paddingHorizontal: 18,
  },
  statValue: {
    fontFamily: "Cairo_900Black",
    fontSize: 22,
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    fontFamily: "Cairo_500Medium",
    fontSize: 10,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  doneBlock: {
    alignItems: "center",
    marginTop: 18,
  },
  doneCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  doneText: {
    fontFamily: "Cairo_700Bold",
    fontSize: 13,
    textAlign: "center",
  },
  closeBtn: {
    marginTop: 18,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
  },
  closeText: {
    fontFamily: "Cairo_700Bold",
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
