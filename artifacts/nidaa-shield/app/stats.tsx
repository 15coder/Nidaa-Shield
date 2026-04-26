import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PageHeader } from "@/components/PageHeader";
import { useVpn } from "@/contexts/VpnContext";
import { useColors } from "@/hooks/useColors";

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function formatUptime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}س ${m}د ${s}ث`;
  if (m > 0) return `${m}د ${s}ث`;
  return `${s}ث`;
}

export default function StatsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { stats, isConnected, refreshStats } = useVpn();

  const blockRate = stats.totalQueries
    ? Math.round((stats.blockedQueries / stats.totalQueries) * 100)
    : 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PageHeader
        title="إحصائيات الحماية"
        subtitle={isConnected ? "تتحدّث كل ثانيتين" : "الحماية متوقفة حالياً"}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 28 : 16) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          <StatCard
            label="إجمالي الطلبات"
            value={formatNumber(stats.totalQueries)}
            icon="globe-outline"
            tint={colors.primary}
            colors={colors}
          />
          <StatCard
            label="طلبات محجوبة"
            value={formatNumber(stats.blockedQueries)}
            icon="shield-checkmark"
            tint="#E03E52"
            colors={colors}
          />
          <StatCard
            label="نسبة الحجب"
            value={`${blockRate}%`}
            icon="pie-chart-outline"
            tint="#FF8E2C"
            colors={colors}
          />
          <StatCard
            label="طلبات مرّرت"
            value={formatNumber(stats.forwardedQueries)}
            icon="arrow-redo-outline"
            tint="#00B47A"
            colors={colors}
          />
          <StatCard
            label="طلبات DoH مشفّرة"
            value={formatNumber(stats.dohQueries)}
            icon="lock-closed"
            tint={colors.primary}
            colors={colors}
          />
          <StatCard
            label="متوسط زمن الاستجابة"
            value={`${stats.averageLatencyMs} مل/ث`}
            icon="time-outline"
            tint="#9B6CFF"
            colors={colors}
          />
          <StatCard
            label="مدّة التشغيل"
            value={formatUptime(stats.uptimeMs)}
            icon="hourglass-outline"
            tint={colors.foreground}
            colors={colors}
          />
        </View>

        <View
          style={[
            styles.lastDomainCard,
            { backgroundColor: colors.cardSolid, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>
            آخر نطاق تم استعلامه
          </Text>
          <Text style={[styles.cardValue, { color: colors.foreground }]} numberOfLines={1}>
            {stats.lastDomain || "—"}
          </Text>
          <Text style={[styles.cardTitle, { color: colors.mutedForeground, marginTop: 12 }]}>
            آخر نطاق محجوب
          </Text>
          <Text
            style={[styles.cardValue, { color: "#E03E52" }]}
            numberOfLines={1}
          >
            {stats.lastBlockedDomain || "لا يوجد بعد"}
          </Text>
        </View>

        <Pressable
          onPress={() => refreshStats()}
          style={({ pressed }) => [
            styles.refreshBtn,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons name="refresh" size={16} color={colors.primaryForeground} />
          <Text style={[styles.refreshLabel, { color: colors.primaryForeground }]}>
            تحديث الآن
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function StatCard({
  label,
  value,
  icon,
  tint,
  colors,
}: {
  label: string;
  value: string;
  icon: any;
  tint: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: colors.cardSolid, borderColor: colors.cardBorder },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: tint + "22" }]}>
        <Ionicons name={icon} size={16} color={tint} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, gap: 14 },
  grid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: "flex-end",
    gap: 6,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontFamily: "Cairo_700Bold",
    fontSize: 18,
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    fontFamily: "Cairo_500Medium",
    fontSize: 11,
    textAlign: "right",
    writingDirection: "rtl",
  },
  lastDomainCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  cardTitle: {
    fontFamily: "Cairo_500Medium",
    fontSize: 11,
    textAlign: "right",
    writingDirection: "rtl",
  },
  cardValue: {
    fontFamily: "Cairo_700Bold",
    fontSize: 16,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: 4,
  },
  refreshBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 6,
  },
  refreshLabel: {
    fontFamily: "Cairo_700Bold",
    fontSize: 13,
  },
});
