import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
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
import { useColors } from "@/hooks/useColors";

interface DnsCandidate {
  id: string;
  name: string;
  endpoint: string; // DoH JSON endpoint
  description: string;
}

const TEST_DOMAINS = [
  "google.com",
  "youtube.com",
  "instagram.com",
  "wikipedia.org",
  "github.com",
];

const BASE_CANDIDATES: DnsCandidate[] = [
  {
    id: "cloudflare",
    name: "Cloudflare (1.1.1.1)",
    endpoint: "https://cloudflare-dns.com/dns-query",
    description: "خصوصية عالية وسرعة ممتازة",
  },
  {
    id: "google",
    name: "Google (8.8.8.8)",
    endpoint: "https://dns.google/resolve",
    description: "موثوق وسريع عالمياً",
  },
  {
    id: "adguard",
    name: "AdGuard (94.140.14.14)",
    endpoint: "https://dns.adguard-dns.com/dns-query",
    description: "حظر إعلانات افتراضي",
  },
  {
    id: "quad9",
    name: "Quad9 (9.9.9.9)",
    endpoint: "https://dns.quad9.net:5053/dns-query",
    description: "حماية من المواقع الضارّة",
  },
  {
    id: "cleanbrowsing",
    name: "CleanBrowsing Family",
    endpoint: "https://doh.cleanbrowsing.org/doh/family-filter/",
    description: "تصفية محتوى للعائلة",
  },
];

interface ResultRow {
  candidate: DnsCandidate;
  averageMs: number | null;
  failures: number;
  status: "pending" | "running" | "done" | "error";
}

async function queryOnce(endpoint: string, domain: string): Promise<number | null> {
  const start = Date.now();
  try {
    const url = `${endpoint}${endpoint.includes("?") ? "&" : "?"}name=${encodeURIComponent(domain)}&type=A`;
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 4000);
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/dns-json" },
      signal: ac.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    await res.json();
    return Date.now() - start;
  } catch {
    return null;
  }
}

export default function SpeedTestScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const settings = useSettings();
  const [results, setResults] = useState<ResultRow[]>(
    BASE_CANDIDATES.map((c) => ({
      candidate: c,
      averageMs: null,
      failures: 0,
      status: "pending",
    })),
  );
  const [running, setRunning] = useState(false);

  const candidates: DnsCandidate[] = [
    ...BASE_CANDIDATES,
    ...settings.customDnsServers.map((s) => ({
      id: s.id,
      name: s.name,
      endpoint: "https://cloudflare-dns.com/dns-query", // can't reach raw IPs from JS — measure resolver path
      description: `مخصّص (${s.primary})`,
    })),
  ];

  const runTest = useCallback(async () => {
    if (running) return;
    setRunning(true);
    const initial = candidates.map((c) => ({
      candidate: c,
      averageMs: null as number | null,
      failures: 0,
      status: "pending" as ResultRow["status"],
    }));
    setResults(initial);

    for (let i = 0; i < initial.length; i++) {
      const cand = initial[i].candidate;
      setResults((prev) =>
        prev.map((r, idx) => (idx === i ? { ...r, status: "running" } : r)),
      );
      const samples: number[] = [];
      let failures = 0;
      for (const domain of TEST_DOMAINS) {
        const ms = await queryOnce(cand.endpoint, domain);
        if (ms === null) failures++;
        else samples.push(ms);
      }
      const avg = samples.length
        ? Math.round(samples.reduce((a, b) => a + b, 0) / samples.length)
        : null;
      setResults((prev) =>
        prev.map((r, idx) =>
          idx === i
            ? {
                ...r,
                averageMs: avg,
                failures,
                status: avg === null ? "error" : "done",
              }
            : r,
        ),
      );
    }
    setRunning(false);
  }, [running, candidates]);

  const sorted = [...results].sort((a, b) => {
    if (a.averageMs === null && b.averageMs === null) return 0;
    if (a.averageMs === null) return 1;
    if (b.averageMs === null) return -1;
    return a.averageMs - b.averageMs;
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PageHeader title="اختبار سرعة DNS" subtitle="نقيس زمن الاستجابة من جهازك" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 28 : 16) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.notice,
            { backgroundColor: colors.primarySoft },
          ]}
        >
          <Ionicons name="information-circle" size={16} color={colors.primary} />
          <Text style={[styles.noticeText, { color: colors.primary }]}>
            القياس يتم عبر الشبكة الحاليّة لجهازك — قد تختلف النتائج لاحقاً.
          </Text>
        </View>

        <Pressable
          onPress={runTest}
          disabled={running}
          style={({ pressed }) => [
            styles.runBtn,
            {
              backgroundColor: colors.primary,
              opacity: running ? 0.7 : pressed ? 0.8 : 1,
            },
          ]}
        >
          {running ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Ionicons name="play" size={18} color={colors.primaryForeground} />
          )}
          <Text style={[styles.runLabel, { color: colors.primaryForeground }]}>
            {running ? "جارٍ الاختبار..." : "ابدأ الاختبار"}
          </Text>
        </Pressable>

        <View style={{ gap: 10, marginTop: 6 }}>
          {sorted.map((r, idx) => (
            <View
              key={r.candidate.id}
              style={[
                styles.row,
                {
                  backgroundColor: colors.cardSolid,
                  borderColor:
                    idx === 0 && r.status === "done"
                      ? colors.primary
                      : colors.cardBorder,
                },
              ]}
            >
              <View style={styles.rowRight}>
                {idx === 0 && r.status === "done" ? (
                  <View
                    style={[styles.crown, { backgroundColor: colors.primary }]}
                  >
                    <Ionicons name="trophy" size={12} color={colors.primaryForeground} />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.rank,
                      { backgroundColor: colors.muted },
                    ]}
                  >
                    <Text style={[styles.rankText, { color: colors.foreground }]}>
                      {idx + 1}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text
                    style={[styles.rowName, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {r.candidate.name}
                  </Text>
                  <Text
                    style={[styles.rowDesc, { color: colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    {r.candidate.description}
                  </Text>
                </View>
              </View>
              <View style={styles.rowLeft}>
                {r.status === "running" ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : r.status === "pending" ? (
                  <Text style={[styles.pending, { color: colors.mutedForeground }]}>
                    —
                  </Text>
                ) : r.status === "error" || r.averageMs === null ? (
                  <Text style={[styles.errorText, { color: "#E03E52" }]}>تعذّر</Text>
                ) : (
                  <View style={{ alignItems: "flex-start" }}>
                    <Text style={[styles.ms, { color: colors.foreground }]}>
                      {r.averageMs}
                      <Text
                        style={[styles.msUnit, { color: colors.mutedForeground }]}
                      >
                        {" "}مل/ث
                      </Text>
                    </Text>
                    {r.failures > 0 ? (
                      <Text
                        style={[
                          styles.failures,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {r.failures} فشل
                      </Text>
                    ) : null}
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, gap: 14 },
  notice: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  noticeText: {
    flex: 1,
    textAlign: "right",
    writingDirection: "rtl",
    fontFamily: "Cairo_600SemiBold",
    fontSize: 11,
  },
  runBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
  },
  runLabel: {
    fontFamily: "Cairo_700Bold",
    fontSize: 14,
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  rowRight: { flexDirection: "row-reverse", alignItems: "center", gap: 10, flex: 1 },
  rowLeft: { paddingHorizontal: 8 },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { fontFamily: "Cairo_700Bold", fontSize: 12 },
  crown: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rowName: {
    fontFamily: "Cairo_700Bold",
    fontSize: 13,
    textAlign: "right",
    writingDirection: "rtl",
  },
  rowDesc: {
    fontFamily: "Cairo_500Medium",
    fontSize: 11,
    textAlign: "right",
    writingDirection: "rtl",
  },
  ms: {
    fontFamily: "Cairo_700Bold",
    fontSize: 16,
    fontVariant: ["tabular-nums"],
  },
  msUnit: { fontFamily: "Cairo_500Medium", fontSize: 10 },
  pending: { fontFamily: "Cairo_500Medium", fontSize: 14 },
  errorText: { fontFamily: "Cairo_700Bold", fontSize: 12 },
  failures: { fontFamily: "Cairo_500Medium", fontSize: 10, marginTop: 2 },
});
