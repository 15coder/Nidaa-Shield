import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSettings } from "@/contexts/SettingsContext";
import { useVpn } from "@/contexts/VpnContext";
import { useColors } from "@/hooks/useColors";

const { width: WINDOW_W } = Dimensions.get("window");

interface Slide {
  iconName: any;
  title: string;
  body: string;
  bullets: { icon: any; text: string }[];
}

const SLIDES: Slide[] = [
  {
    iconName: "globe-outline",
    title: "ما هو DNS؟",
    body: "كل مرة تفتح فيها تطبيقاً أو موقعاً، يسأل هاتفك خادم DNS عن العنوان الحقيقي. الإعلانات والمتتبعات تستخدم نطاقات معروفة — يكفي أن نمنع الإجابة عنها لتختفي.",
    bullets: [
      { icon: "search-outline", text: "هاتفك يسأل: «أين youtube.com؟»" },
      { icon: "swap-horizontal-outline", text: "خادم DNS يجيب بالعنوان" },
      { icon: "shield-checkmark-outline", text: "نداء شايلد يحجب نطاقات الإعلانات" },
    ],
  },
  {
    iconName: "phone-portrait-outline",
    title: "VPN محلي 100%",
    body: "نداء شايلد لا يرسل بياناتك إلى أي خادم خارجي. الفلترة تحدث داخل هاتفك فقط — لا تتبع، لا تسجيل، لا حسابات. حتى نحن لا نرى ماذا تتصفّح.",
    bullets: [
      { icon: "lock-closed-outline", text: "يعمل بدون إنترنت دائم" },
      { icon: "battery-charging-outline", text: "استهلاك طاقة منخفض جداً" },
      { icon: "code-slash-outline", text: "مفتوح المصدر وقابل للمراجعة" },
    ],
  },
  {
    iconName: "options-outline",
    title: "اختر وضعاً واحداً يكفيك",
    body: "أربعة أوضاع جاهزة تغطي معظم الاستخدامات. ابدأ بالدرع الذكي وغيّره متى شئت من الشاشة الرئيسية.",
    bullets: [
      { icon: "shield-checkmark", text: "الدرع الذكي — للاستخدام اليومي" },
      { icon: "game-controller", text: "توربو الألعاب — أقل تأخير ممكن" },
      { icon: "people", text: "حارس العائلة — حماية الأطفال" },
      { icon: "lock-closed", text: "الخصوصية العسكرية — تشفير DoH" },
    ],
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const settings = useSettings();
  const { setActiveMode, engineStatus } = useVpn();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const scroller = useRef<ScrollView | null>(null);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fade, { toValue: 0, duration: 0, useNativeDriver: true }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, fade]);

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, i));
    setIndex(clamped);
    scroller.current?.scrollTo({ x: clamped * WINDOW_W, animated: true });
    if (Platform.OS !== "web" && settings.hapticsEnabled) {
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const finish = async () => {
    if (busy) return;
    setBusy(true);
    if (Platform.OS !== "web" && settings.hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    await settings.setOnboardingCompleted(true);
    // Trigger the VPN permission prompt by activating the default mode
    if (engineStatus === "ready") {
      try {
        await setActiveMode("smart");
      } catch {}
    }
    router.replace("/");
  };

  const skip = async () => {
    await settings.setOnboardingCompleted(true);
    router.replace("/");
  };

  const onScrollEnd = (e: any) => {
    const x = e.nativeEvent.contentOffset.x as number;
    const newIndex = Math.round(x / WINDOW_W);
    if (newIndex !== index) setIndex(newIndex);
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={skip} hitSlop={10}>
          <Text style={[styles.skip, { color: colors.mutedForeground }]}>تخطّي</Text>
        </Pressable>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === index ? colors.primary : colors.mutedForeground + "55",
                  width: i === index ? 22 : 8,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        style={styles.slides}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { width: WINDOW_W }]}>
            <Animated.View style={{ opacity: fade, alignItems: "center" }}>
              <LinearGradient
                colors={[colors.primarySoft, colors.primarySoft, "transparent"]}
                style={styles.heroCircle}
              >
                <View
                  style={[
                    styles.heroInner,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Ionicons name={slide.iconName} size={56} color="#FFFFFF" />
                </View>
              </LinearGradient>

              <Text style={[styles.title, { color: colors.foreground }]}>
                {slide.title}
              </Text>
              <Text style={[styles.body, { color: colors.mutedForeground }]}>
                {slide.body}
              </Text>

              <View style={styles.bullets}>
                {slide.bullets.map((b, j) => (
                  <View
                    key={j}
                    style={[
                      styles.bulletRow,
                      {
                        backgroundColor: colors.cardSolid,
                        borderColor: colors.cardBorder,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.bulletIcon,
                        { backgroundColor: colors.primarySoft },
                      ]}
                    >
                      <Ionicons name={b.icon} size={16} color={colors.primary} />
                    </View>
                    <Text
                      style={[styles.bulletText, { color: colors.foreground }]}
                    >
                      {b.text}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 18 }]}>
        {index > 0 ? (
          <Pressable
            onPress={() => goTo(index - 1)}
            style={({ pressed }) => [
              styles.secondaryBtn,
              { borderColor: colors.cardBorder, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Ionicons name="chevron-forward" size={18} color={colors.foreground} />
            <Text style={[styles.secondaryText, { color: colors.foreground }]}>
              السابق
            </Text>
          </Pressable>
        ) : (
          <View style={{ width: 100 }} />
        )}

        <Pressable
          onPress={() => (isLast ? finish() : goTo(index + 1))}
          disabled={busy}
          style={({ pressed }) => [
            styles.primaryBtn,
            {
              backgroundColor: colors.primary,
              opacity: pressed || busy ? 0.85 : 1,
            },
          ]}
        >
          <Text style={[styles.primaryText, { color: "#FFFFFF" }]}>
            {isLast ? "ابدأ الحماية الآن" : "التالي"}
          </Text>
          <Ionicons
            name={isLast ? "shield-checkmark" : "chevron-back"}
            size={18}
            color="#FFFFFF"
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingBottom: 8,
  },
  skip: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 13,
  },
  dots: {
    flexDirection: "row-reverse",
    gap: 6,
    alignItems: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  slides: { flex: 1 },
  slide: {
    paddingHorizontal: 26,
    paddingTop: 18,
    alignItems: "center",
  },
  heroCircle: {
    width: 168,
    height: 168,
    borderRadius: 84,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  heroInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Cairo_900Black",
    fontSize: 24,
    textAlign: "center",
    marginBottom: 10,
  },
  body: {
    fontFamily: "Cairo_500Medium",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 22,
    paddingHorizontal: 8,
  },
  bullets: {
    width: "100%",
    gap: 10,
  },
  bulletRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  bulletIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  bulletText: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 13,
    textAlign: "right",
    writingDirection: "rtl",
    flex: 1,
  },
  bottomBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
    marginStart: 12,
  },
  primaryText: {
    fontFamily: "Cairo_700Bold",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  secondaryText: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 12,
  },
});
