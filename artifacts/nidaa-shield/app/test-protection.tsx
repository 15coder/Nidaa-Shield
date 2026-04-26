import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PageHeader } from "@/components/PageHeader";
import { useSettings } from "@/contexts/SettingsContext";
import { useVpn } from "@/contexts/VpnContext";
import { useColors } from "@/hooks/useColors";

interface ProbeTarget {
  id: string;
  label: string;
  domain: string;
  description: string;
  expectBlocked: boolean;
}

const PROBES: ProbeTarget[] = [
  {
    id: "doubleclick",
    label: "إعلانات Google",
    domain: "doubleclick.net",
    description: "أكبر شبكة إعلانات في العالم — يجب أن تُحجب.",
    expectBlocked: true,
  },
  {
    id: "youtube-ads",
    label: "إعلانات يوتيوب",
    domain: "googleads.g.doubleclick.net",
    description: "الخادم الذي يخدم إعلانات قبل الفيديو.",
    expectBlocked: true,
  },
  {
    id: "ga",
    label: "تتبّع Google Analytics",
    domain: "google-analytics.com",
    description: "متتبّع التحليلات الأشهر — يجب أن يُحجب.",
    expectBlocked: true,
  },
  {
    id: "facebook-tr",
    label: "تتبع فيسبوك",
    domain: "connect.facebook.net",
    description: "بكسل فيسبوك للإعلانات والتتبع.",
    expectBlocked: true,
  },
  {
    id: "control",
    label: "موقع نظيف (تحكّم)",
    domain: "wikipedia.org",
    description: "موقع بريء — يجب أن يعمل بشكل طبيعي.",
    expectBlocked: false,
  },
];

type ProbeResult = {
  status: "pending" | "blocked" | "passed" | "error";
  durationMs: number | null;
};

async function probeDomain(domain: string): Promise<ProbeResult> {
  const started = Date.now();
  // Use a strict 4s timeout. We resolve via a tiny image fetch through fetch();
  // a successful fetch (any status) means DNS resolved + reachable, while a
  // network error / timeout typically means the domain was sinkholed by our
  // VPN.
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const url = `https://${domain}/favicon.ico?nidaa=${Math.random().toString(36).slice(2, 8)}`;
    await fetch(url, {
      method: "HEAD",
      signal: ctrl.signal,
      // no-cache to ensure DNS is hit
      cache: "no-store",
    });
    clearTimeout(timer);
    return { status: "passed", durationMs: Date.now() - started };
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return { status: "blocked", durationMs: Date.now() - started };
    }
    // TypeError "Network request failed" usually = blocked / no DNS resolution
    if (err?.message?.toLowerCase?.().includes("network")) {
      return { status: "blocked", durationMs: Date.now() - started };
    }
    return { status: "error", durationMs: Date.now() - started };
  }
}

export default function TestProtectionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isConnected } = useVpn();
  const settings = useSettings();
  const [results, setResults] = useState<Record<string, ProbeResult>>({});
  const [running, setRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<"idle" | "good" | "weak" | "bad">(
    "idle",
  );
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (running) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.08,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    pulse.setValue(1);
  }, [running, pulse]);

  const runAll = async () => {
    if (running) return;
    setRunning(true);
    setOverallStatus("idle");
    const fresh: Record<string, ProbeResult> = {};
    PROBES.forEach((p) => (fresh[p.id] = { status: "pending", durationMs: null }));
    setResults({ ...fresh });

    if (Platform.OS !== "web" && settings.hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    // Run probes sequentially so the user sees progressive results
    for (const probe of PROBES) {
      const r = await probeDomain(probe.domain);
      fresh[probe.id] = r;
      setResults({ ...fresh });
    }

    // Score: count of ad/tracker probes that were correctly blocked
    const adProbes = PROBES.filter((p) => p.expectBlocked);
    const blockedCount = adProbes.filter(
      (p) => fresh[p.id].status === "blocked",
    ).length;
    const ratio = blockedCount / adProbes.length;

    let final: "good" | "weak" | "bad";
    if (ratio >= 0.75) final = "good";
    else if (ratio >= 0.4) final = "weak";
    else final = "bad";

    setOverallStatus(final);
    setRunning(false);

    if (Platform.OS !== "web" && settings.hapticsEnabled) {
      Haptics.notificationAsync(
        final === "good"
          ? Haptics.NotificationFeedbackType.Success
          : final === "weak"
            ? Haptics.NotificationFeedbackType.Warning
            : Haptics.NotificationFeedbackType.Error,
      ).catch(() => {});
    }
  };

  const overallColor =
    overallStatus === "good"
      ? "#1B7A4B"
      : overallStatus === "weak"
        ? "#F39200"
        : overallStatus === "bad"
          ? "#E03E52"
          : colors.mutedForeground;

  const overallTitle =
    overallStatus === "good"
      ? "ممتاز — حمايتك تعمل بكفاءة"
      : overallStatus === "weak"
        ? "جزئية — بعض الإعلانات تمر"
        : overallStatus === "bad"
          ? "غير محمي — افحص الإعدادات"
          : "اضغط الزر لبدء الاختبار";

  const overallSub =
    overallStatus === "good"
      ? "النطاقات الإعلانية حُجبت بنجاح. واصل تصفّحك بأمان."
      : overallStatus === "weak"
        ? "بعض الإعلانات حُجبت لكن البقية مرّت. تأكد من تفعيل قائمة يوتيوب من الإعدادات."
        : overallStatus === "bad"
          ? "تأكد من تفعيل الحماية، ومن إيقاف \"Private DNS\" في إعدادات أندرويد > الشبكة."
          : "سنرسل طلبات لخوادم إعلانات معروفة ونرى أيها يصل وأيها يُحجب.";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PageHeader title="اختبار الحماية" subtitle="هل DNS الفلترة تعمل فعلاً؟" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!isConnected ? (
          <View
            style={[
              styles.warnBanner,
              {
                backgroundColor: "#FFE4D9",
                borderColor: "#F39200",
              },
            ]}
          >
            <Ionicons name="warning" size={18} color="#C77600" />
            <Text style={[styles.warnText, { color: "#7A4500" }]}>
              الحماية غير مفعّلة الآن — الاختبار سيُظهر أن الإعلانات تمر. فعّل وضعاً من الشاشة الرئيسية أوّلاً.
            </Text>
          </View>
        ) : null}

        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: colors.cardSolid,
              borderColor: overallColor + "55",
              borderWidth: 1.5,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.summaryIcon,
              {
                backgroundColor: overallColor + "22",
                transform: [{ scale: running ? pulse : 1 }],
              },
            ]}
          >
            <Ionicons
              name={
                running
                  ? "sync"
                  : overallStatus === "good"
                    ? "shield-checkmark"
                    : overallStatus === "weak"
                      ? "alert-circle"
                      : overallStatus === "bad"
                        ? "shield-outline"
                        : "shield-half"
              }
              size={32}
              color={overallColor}
            />
          </Animated.View>
          <Text style={[styles.summaryTitle, { color: colors.foreground }]}>
            {running ? "جاري الفحص…" : overallTitle}
          </Text>
          <Text style={[styles.summarySub, { color: colors.mutedForeground }]}>
            {running
              ? "نرسل طلبات لخوادم إعلانات معروفة الآن."
              : overallSub}
          </Text>
        </View>

        <View style={{ gap: 8 }}>
          {PROBES.map((p) => {
            const r = results[p.id];
            return (
              <ProbeRow key={p.id} probe={p} result={r} colors={colors} />
            );
          })}
        </View>

        <Pressable
          onPress={runAll}
          disabled={running}
          style={({ pressed }) => [
            styles.runBtn,
            {
              backgroundColor: colors.primary,
              opacity: pressed || running ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons name={running ? "sync" : "play"} size={18} color="#FFFFFF" />
          <Text style={styles.runText}>
            {running ? "جاري الاختبار…" : "ابدأ الاختبار الآن"}
          </Text>
        </Pressable>

        <Text style={[styles.fineprint, { color: colors.mutedForeground }]}>
          ملاحظة: هذا الاختبار تقريبي. بعض الشبكات والمتصفّحات تتجاوز DNS التطبيق
          عبر إعدادات «Private DNS» أو DoH خاص بالمتصفح. إذا ظهرت النتيجة
          «غير محمي» رغم تفعيل الوضع، تحقّق من إيقاف Private DNS في
          إعدادات نظام الأندرويد.
        </Text>
      </ScrollView>
    </View>
  );
}

function ProbeRow({
  probe,
  result,
  colors,
}: {
  probe: ProbeTarget;
  result: ProbeResult | undefined;
  colors: ReturnType<typeof useColors>;
}) {
  let stateColor = colors.mutedForeground;
  let stateIcon: any = "ellipse-outline";
  let stateLabel = "—";

  if (result) {
    if (result.status === "pending") {
      stateColor = colors.mutedForeground;
      stateIcon = "sync";
      stateLabel = "…";
    } else if (result.status === "blocked") {
      const ok = probe.expectBlocked;
      stateColor = ok ? "#1B7A4B" : "#E03E52";
      stateIcon = ok ? "checkmark-circle" : "close-circle";
      stateLabel = ok ? "محجوب" : "تعذّر الوصول";
    } else if (result.status === "passed") {
      const ok = !probe.expectBlocked;
      stateColor = ok ? "#1B7A4B" : "#E03E52";
      stateIcon = ok ? "checkmark-circle" : "close-circle";
      stateLabel = ok ? "وصل" : "وصل (لم يُحجب)";
    } else {
      stateColor = colors.mutedForeground;
      stateIcon = "help-circle-outline";
      stateLabel = "غير محدد";
    }
  }

  return (
    <View
      style={[
        rowStyles.row,
        {
          backgroundColor: colors.cardSolid,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={{ flex: 1, alignItems: "flex-end" }}>
        <Text style={[rowStyles.label, { color: colors.foreground }]}>
          {probe.label}
        </Text>
        <Text style={[rowStyles.domain, { color: colors.mutedForeground }]}>
          {probe.domain}
        </Text>
      </View>
      <View style={{ alignItems: "center", gap: 2, minWidth: 80 }}>
        <Ionicons name={stateIcon} size={20} color={stateColor} />
        <Text style={[rowStyles.state, { color: stateColor }]}>{stateLabel}</Text>
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  label: {
    fontFamily: "Cairo_700Bold",
    fontSize: 13,
    textAlign: "right",
    writingDirection: "rtl",
  },
  domain: {
    fontFamily: "Cairo_500Medium",
    fontSize: 11,
    marginTop: 2,
  },
  state: {
    fontFamily: "Cairo_700Bold",
    fontSize: 10,
    letterSpacing: 0.3,
  },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 14,
  },
  warnBanner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  warnText: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 12,
    flex: 1,
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 18,
  },
  summaryCard: {
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 18,
    borderRadius: 22,
  },
  summaryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  summaryTitle: {
    fontFamily: "Cairo_900Black",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 6,
  },
  summarySub: {
    fontFamily: "Cairo_500Medium",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  runBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
    marginTop: 6,
  },
  runText: {
    color: "#FFFFFF",
    fontFamily: "Cairo_700Bold",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  fineprint: {
    fontFamily: "Cairo_400Regular",
    fontSize: 11,
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 17,
    marginTop: 4,
  },
});
