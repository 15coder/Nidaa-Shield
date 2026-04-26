import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
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

interface SlideFeature {
  icon: any;
  text: string;
}

interface Slide {
  iconName: any;
  title: string;
  body: string;
  features: SlideFeature[];
  accent: string;
}

const SLIDES: Slide[] = [
  {
    iconName: "shield-checkmark",
    title: "أهلاً بك في نداء شايلد",
    body: "حماية عربية أنيقة من الإعلانات والمتتبّعات والمحتوى الضار — مجّاناً، بدون حساب، وبدون تتبّع.",
    features: [
      { icon: "ban", text: "حجب الإعلانات" },
      { icon: "eye-off", text: "إخفاء المتتبعات" },
      { icon: "shield", text: "حماية كاملة" },
    ],
    accent: "primary",
  },
  {
    iconName: "phone-portrait",
    title: "كل شيء يتم داخل هاتفك",
    body: "لا نرسل بياناتك إلى أي خادم — الفلترة محلية 100٪. لا تسجيل، لا حسابات، حتى نحن لا نرى ماذا تتصفّح.",
    features: [
      { icon: "lock-closed", text: "خصوصية مطلقة" },
      { icon: "battery-charging", text: "استهلاك منخفض" },
      { icon: "code-slash", text: "مفتوح المصدر" },
    ],
    accent: "primary",
  },
  {
    iconName: "options",
    title: "أربعة أوضاع جاهزة لك",
    body: "اختر وضعاً بضغطة واحدة. ابدأ بالدرع الذكي للاستخدام اليومي وغيّره متى شئت.",
    features: [
      { icon: "shield-checkmark", text: "ذكي" },
      { icon: "game-controller", text: "ألعاب" },
      { icon: "people", text: "عائلة" },
      { icon: "lock-closed", text: "عسكري" },
    ],
    accent: "primary",
  },
];

function SalahModal({
  visible,
  onDismiss,
  colors,
}: {
  visible: boolean;
  onDismiss: () => void;
  colors: any;
}) {
  const isDark = colors.scheme === "dark";
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.85);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          speed: 16,
          bounciness: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, fadeAnim]);

  const handlePress = (answered: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    onDismiss();
  };

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Animated.View
        style={[styles.modalBackdrop, { opacity: fadeAnim }]}
      >
        <Animated.View
          style={[
            styles.modalCard,
            {
              backgroundColor: isDark ? "#1A1F2E" : "#FFFFFF",
              borderColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.06)",
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Moon icon */}
          <View
            style={[
              styles.modalIconWrap,
              { backgroundColor: colors.primary + "22" },
            ]}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalIconGradient}
            >
              <Ionicons name="moon" size={30} color="#FFFFFF" />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            هل صلّيت على محمد اليوم؟
          </Text>

          {/* Subtitle */}
          <Text
            style={[styles.modalSubtitle, { color: colors.mutedForeground }]}
          >
            صلوا عليه ﷺ وسلّموا تسليما
          </Text>

          {/* Yes button */}
          <Pressable
            onPress={() => handlePress(true)}
            style={({ pressed }) => [
              styles.modalBtnPrimary,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.85 : 1,
                shadowColor: colors.primary,
              },
            ]}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={[styles.modalBtnTextPrimary]}>نعم</Text>
          </Pressable>

          {/* No button */}
          <Pressable
            onPress={() => handlePress(false)}
            style={({ pressed }) => [
              styles.modalBtnSecondary,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.07)"
                  : "rgba(0,0,0,0.05)",
                borderColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.08)",
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Text
              style={[styles.modalBtnTextSecondary, { color: colors.foreground }]}
            >
              لا، سأصلي عليه
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const settings = useSettings();
  const { setActiveMode, engineStatus } = useVpn();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [salahModalVisible, setSalahModalVisible] = useState(false);
  const scroller = useRef<ScrollView | null>(null);

  const slideFade = useRef(new Animated.Value(0)).current;
  const slideRise = useRef(new Animated.Value(20)).current;
  const heroScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    slideFade.setValue(0);
    slideRise.setValue(18);
    heroScale.setValue(0.88);
    Animated.parallel([
      Animated.timing(slideFade, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideRise, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(heroScale, {
        toValue: 1,
        speed: 14,
        bounciness: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, slideFade, slideRise, heroScale]);

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
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
    }
    await settings.setOnboardingCompleted(true);
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

  const handleNextPress = () => {
    if (isLast) {
      // Show the prayer reminder after completing all slides
      setSalahModalVisible(true);
    } else {
      goTo(index + 1);
    }
  };

  const handleSalahDismiss = () => {
    setSalahModalVisible(false);
    finish();
  };

  const isLast = index === SLIDES.length - 1;
  const isDark = colors.scheme === "dark";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SalahModal
        visible={salahModalVisible}
        onDismiss={handleSalahDismiss}
        colors={colors}
      />

      {/* Soft accent halo behind hero */}
      <View
        pointerEvents="none"
        style={[
          styles.bgHalo,
          {
            backgroundColor: colors.primary,
            opacity: isDark ? 0.08 : 0.05,
            top: insets.top + 30,
          },
        ]}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + 14 }]}>
        <Pressable onPress={skip} hitSlop={12}>
          <Text style={[styles.skip, { color: colors.mutedForeground }]}>
            تخطّي
          </Text>
        </Pressable>

        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            const active = i === index;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: active
                      ? colors.primary
                      : colors.mutedForeground + "40",
                    width: active ? 26 : 8,
                  },
                ]}
              />
            );
          })}
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
            <Animated.View
              style={{
                alignItems: "center",
                opacity: slideFade,
                transform: [{ translateY: slideRise }],
                width: "100%",
              }}
            >
              {/* Hero illustration */}
              <Animated.View
                style={[
                  styles.heroWrap,
                  { transform: [{ scale: heroScale }] },
                ]}
              >
                <LinearGradient
                  colors={[
                    colors.primary + "22",
                    colors.primary + "10",
                    "transparent",
                  ]}
                  style={styles.heroGlow}
                />
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.heroInner,
                    {
                      shadowColor: colors.primary,
                    },
                  ]}
                >
                  <Ionicons
                    name={slide.iconName}
                    size={64}
                    color="#FFFFFF"
                  />
                </LinearGradient>
              </Animated.View>

              <Text style={[styles.title, { color: colors.foreground }]}>
                {slide.title}
              </Text>
              <Text
                style={[styles.body, { color: colors.mutedForeground }]}
              >
                {slide.body}
              </Text>

              <View style={styles.chipsRow}>
                {slide.features.map((f, j) => (
                  <View
                    key={j}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.04)"
                          : colors.cardSolid,
                        borderColor: isDark
                          ? "rgba(255,255,255,0.08)"
                          : colors.cardBorder,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.chipIcon,
                        { backgroundColor: colors.primarySoft },
                      ]}
                    >
                      <Ionicons
                        name={f.icon}
                        size={15}
                        color={colors.primary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.chipText,
                        { color: colors.foreground },
                      ]}
                      numberOfLines={1}
                    >
                      {f.text}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          </View>
        ))}
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom + 22 },
        ]}
      >
        <Pressable
          onPress={handleNextPress}
          disabled={busy}
          style={({ pressed }) => [
            styles.primaryBtn,
            {
              backgroundColor: colors.primary,
              opacity: pressed || busy ? 0.85 : 1,
              shadowColor: colors.primary,
            },
          ]}
        >
          <Text style={[styles.primaryText, { color: "#FFFFFF" }]}>
            {isLast ? "ابدأ الحماية الآن" : "التالي"}
          </Text>
          <Ionicons
            name={isLast ? "shield-checkmark" : "arrow-back"}
            size={20}
            color="#FFFFFF"
          />
        </Pressable>

        {!isLast ? (
          <Text
            style={[
              styles.swipeHint,
              { color: colors.mutedForeground },
            ]}
          >
            اسحب لرؤية المزيد
          </Text>
        ) : (
          <View style={{ height: 16 }} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bgHalo: {
    position: "absolute",
    width: 380,
    height: 380,
    borderRadius: 190,
    alignSelf: "center",
  },
  topBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 14,
  },
  skip: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 13,
    letterSpacing: 0.3,
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
    paddingHorizontal: 28,
    paddingTop: 14,
    alignItems: "center",
  },
  heroWrap: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    marginTop: 18,
  },
  heroGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  heroInner: {
    width: 132,
    height: 132,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
    transform: [{ rotate: "-6deg" }],
  },
  title: {
    fontFamily: "Cairo_900Black",
    fontSize: 26,
    textAlign: "center",
    writingDirection: "rtl",
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  body: {
    fontFamily: "Cairo_500Medium",
    fontSize: 14,
    textAlign: "center",
    writingDirection: "rtl",
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 6,
  },
  chipsRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  chip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    fontFamily: "Cairo_700Bold",
    fontSize: 12,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 14,
    alignItems: "center",
  },
  primaryBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 17,
    paddingHorizontal: 28,
    borderRadius: 999,
    width: "100%",
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  primaryText: {
    fontFamily: "Cairo_700Bold",
    fontSize: 15,
    letterSpacing: 0.4,
  },
  swipeHint: {
    fontFamily: "Cairo_500Medium",
    fontSize: 11,
    marginTop: 14,
    textAlign: "center",
  },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  modalIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  modalIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontFamily: "Cairo_900Black",
    fontSize: 22,
    textAlign: "center",
    writingDirection: "rtl",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontFamily: "Cairo_500Medium",
    fontSize: 14,
    textAlign: "center",
    writingDirection: "rtl",
    marginBottom: 28,
    lineHeight: 22,
  },
  modalBtnPrimary: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    paddingVertical: 16,
    borderRadius: 999,
    marginBottom: 12,
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  modalBtnTextPrimary: {
    fontFamily: "Cairo_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  modalBtnSecondary: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnTextSecondary: {
    fontFamily: "Cairo_700Bold",
    fontSize: 16,
  },
});
