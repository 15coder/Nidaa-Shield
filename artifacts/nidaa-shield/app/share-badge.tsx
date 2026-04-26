import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import React, { useMemo } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PageHeader } from "@/components/PageHeader";
import { MODES, useVpn } from "@/contexts/VpnContext";
import { useColors } from "@/hooks/useColors";

const TELEGRAM_URL = "https://t.me/nidaashield";

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "م";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "ك";
  return String(n);
}

function formatUptime(ms: number): string {
  if (ms < 60_000) return "دقائق";
  const h = Math.floor(ms / 3_600_000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d} ${d === 1 ? "يوم" : "أيام"}`;
  if (h > 0) return `${h} ${h === 1 ? "ساعة" : "ساعات"}`;
  const m = Math.floor(ms / 60_000);
  return `${m} دقيقة`;
}

export default function ShareBadgeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { stats, activeMode } = useVpn();

  const modeTitle = activeMode ? MODES[activeMode].title : "نداء شايلد";

  const shareText = useMemo(
    () =>
      `حظرت ${formatNum(stats.blockedQueries)} إعلان ومتتبع باستخدام «نداء شايلد» — تطبيق مجاني عربي يحمي هاتفك من الإعلانات والتتبّع. حمّله من قناتنا: ${TELEGRAM_URL}`,
    [stats.blockedQueries],
  );

  const onShare = async () => {
    try {
      await Share.share({
        message: shareText,
      });
    } catch {}
  };

  const onWhatsApp = async () => {
    const url = `whatsapp://send?text=${encodeURIComponent(shareText)}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`);
    });
  };

  const onCopy = async () => {
    try {
      // Expo doesn't bundle Clipboard by default; fall back to Share which always exists
      await Share.share({ message: shareText });
    } catch {}
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PageHeader title="شارك إنجازك" subtitle="انشر شارة الحماية على ستوري واتساب" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* The badge "card" — designed to be screenshot-able */}
        <View
          style={[
            styles.badgeFrame,
            { borderColor: colors.cardBorder },
          ]}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark, "#0B0F14"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.badge}
          >
            <View style={styles.badgeTop}>
              <Image
                source={require("../assets/images/icon.png")}
                style={styles.badgeLogo}
              />
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Text style={styles.badgeBrand}>نداء شايلد</Text>
                <Text style={styles.badgeBrandSub}>الحماية مفعّلة</Text>
              </View>
            </View>

            <View style={styles.badgeBigRow}>
              <Text style={styles.badgeBigNumber}>
                {formatNum(stats.blockedQueries)}
              </Text>
              <Text style={styles.badgeBigLabel}>
                إعلان ومتتبع{"\n"}تم حجبه
              </Text>
            </View>

            <View style={styles.badgeMetricsRow}>
              <BadgeMetric
                value={formatNum(stats.totalQueries)}
                label="استعلام DNS"
              />
              <BadgeMetric
                value={formatUptime(stats.uptimeMs)}
                label="مدة الحماية"
              />
              <BadgeMetric value={modeTitle} label="الوضع" />
            </View>

            <View style={styles.badgeFooter}>
              <Text style={styles.badgeUrl}>t.me/nidaashield</Text>
              <Ionicons name="paper-plane" size={12} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </View>

        <Text style={[styles.tip, { color: colors.mutedForeground }]}>
          خذ لقطة شاشة (Screenshot) للبطاقة أعلاه ثم انشرها على ستوري واتساب أو
          إنستغرام. أو شارك الرسالة الجاهزة:
        </Text>

        <View
          style={[
            styles.msgBox,
            { backgroundColor: colors.cardSolid, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.msgText, { color: colors.foreground }]}>
            {shareText}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={onWhatsApp}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: "#25D366", opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
            <Text style={styles.actionText}>واتساب</Text>
          </Pressable>
          <Pressable
            onPress={onShare}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="share-social" size={18} color="#FFFFFF" />
            <Text style={styles.actionText}>مشاركة</Text>
          </Pressable>
        </View>

        {Platform.OS === "web" ? null : (
          <Pressable
            onPress={onCopy}
            style={({ pressed }) => [
              styles.copyBtn,
              { borderColor: colors.cardBorder, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Ionicons name="copy-outline" size={16} color={colors.foreground} />
            <Text style={[styles.copyText, { color: colors.foreground }]}>
              نسخ الرسالة
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

function BadgeMetric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metricCol}>
      <Text style={styles.metricVal} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.metricLab} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, gap: 14 },

  badgeFrame: {
    borderRadius: 26,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  badge: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    minHeight: 320,
    justifyContent: "space-between",
  },
  badgeTop: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  badgeLogo: {
    width: 46,
    height: 46,
    borderRadius: 12,
  },
  badgeBrand: {
    color: "#FFFFFF",
    fontFamily: "Cairo_900Black",
    fontSize: 16,
    textAlign: "right",
    writingDirection: "rtl",
  },
  badgeBrandSub: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Cairo_500Medium",
    fontSize: 11,
  },
  badgeBigRow: {
    alignItems: "center",
    marginVertical: 18,
  },
  badgeBigNumber: {
    color: "#FFFFFF",
    fontFamily: "Cairo_900Black",
    fontSize: 64,
    fontVariant: ["tabular-nums"],
    lineHeight: 74,
  },
  badgeBigLabel: {
    color: "rgba(255,255,255,0.92)",
    fontFamily: "Cairo_700Bold",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 4,
  },
  badgeMetricsRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.18)",
  },
  metricCol: {
    alignItems: "center",
    flex: 1,
  },
  metricVal: {
    color: "#FFFFFF",
    fontFamily: "Cairo_700Bold",
    fontSize: 13,
  },
  metricLab: {
    color: "rgba(255,255,255,0.72)",
    fontFamily: "Cairo_500Medium",
    fontSize: 10,
    marginTop: 2,
  },
  badgeFooter: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
  },
  badgeUrl: {
    color: "#FFFFFF",
    fontFamily: "Cairo_700Bold",
    fontSize: 11,
    letterSpacing: 0.5,
  },

  tip: {
    fontFamily: "Cairo_500Medium",
    fontSize: 12,
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 19,
  },
  msgBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  msgText: {
    fontFamily: "Cairo_500Medium",
    fontSize: 12,
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 19,
  },
  actions: {
    flexDirection: "row-reverse",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
  },
  actionText: {
    color: "#FFFFFF",
    fontFamily: "Cairo_700Bold",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  copyBtn: {
    alignSelf: "center",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  copyText: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 12,
  },
});
