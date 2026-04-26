import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PageHeader } from "@/components/PageHeader";
import { useSettings } from "@/contexts/SettingsContext";
import { useColors } from "@/hooks/useColors";
import { getAppIcon, isNativeAvailable, listInstalledApps, type InstalledApp } from "nidaa-vpn";

export default function ExcludedAppsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const settings = useSettings();
  const [apps, setApps] = useState<InstalledApp[] | null>(null);
  const [icons, setIcons] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("");
  const [showSystem, setShowSystem] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!isNativeAvailable) {
      setApps([]);
      return;
    }
    (async () => {
      const list = await listInstalledApps();
      if (cancelled) return;
      setApps(list);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!apps) return [];
    const q = filter.trim().toLowerCase();
    return apps.filter((a) => {
      if (!showSystem && a.isSystem) return false;
      if (!q) return true;
      return (
        a.label.toLowerCase().includes(q) ||
        a.packageName.toLowerCase().includes(q)
      );
    });
  }, [apps, filter, showSystem]);

  const toggle = async (pkg: string) => {
    const next = settings.excludedApps.includes(pkg)
      ? settings.excludedApps.filter((p) => p !== pkg)
      : [...settings.excludedApps, pkg];
    await settings.setExcludedApps(next);
  };

  const ensureIcon = async (pkg: string) => {
    if (icons[pkg] !== undefined) return;
    setIcons((prev) => ({ ...prev, [pkg]: "" }));
    const ic = await getAppIcon(pkg);
    setIcons((prev) => ({ ...prev, [pkg]: ic ?? "" }));
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PageHeader
        title="استثناء تطبيقات"
        subtitle="التطبيقات المختارة لن تمرّ عبر الحماية"
      />

      {!isNativeAvailable ? (
        <View style={styles.notice}>
          <Ionicons name="alert-circle" size={32} color={colors.mutedForeground} />
          <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
            هذه الميزة تتطلّب تثبيت نسخة APK المبنيّة. لا تعمل في المعاينة على الويب أو Expo Go.
          </Text>
        </View>
      ) : apps === null ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            جارٍ قراءة التطبيقات...
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.searchRow}>
            <TextInput
              value={filter}
              onChangeText={setFilter}
              placeholder="بحث باسم التطبيق..."
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.search,
                {
                  backgroundColor: colors.cardSolid,
                  borderColor: colors.cardBorder,
                  color: colors.foreground,
                },
              ]}
            />
            <Pressable
              onPress={() => setShowSystem((s) => !s)}
              style={({ pressed }) => [
                styles.filterChip,
                {
                  backgroundColor: showSystem ? colors.primary : colors.cardSolid,
                  borderColor: showSystem ? colors.primary : colors.cardBorder,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: showSystem ? colors.primaryForeground : colors.foreground,
                  },
                ]}
              >
                {showSystem ? "إخفاء النظام" : "إظهار النظام"}
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.summary, { color: colors.mutedForeground }]}>
            {settings.excludedApps.length} تطبيق مستثنى من أصل {filtered.length} ظاهر
          </Text>

          <FlatList
            data={filtered}
            keyExtractor={(a) => a.packageName}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={8}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: insets.bottom + (Platform.OS === "web" ? 28 : 16) },
            ]}
            renderItem={({ item }) => {
              const checked = settings.excludedApps.includes(item.packageName);
              const iconUri = icons[item.packageName];
              if (iconUri === undefined) ensureIcon(item.packageName);
              return (
                <Pressable
                  onPress={() => toggle(item.packageName)}
                  style={({ pressed }) => [
                    styles.row,
                    {
                      backgroundColor: colors.cardSolid,
                      borderColor: checked ? colors.primary : colors.cardBorder,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: checked ? colors.primary : "transparent",
                        borderColor: checked ? colors.primary : colors.cardBorder,
                      },
                    ]}
                  >
                    {checked ? (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={colors.primaryForeground}
                      />
                    ) : null}
                  </View>
                  <View style={{ flex: 1, alignItems: "flex-end" }}>
                    <Text
                      style={[styles.appName, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                    <Text
                      style={[styles.appPkg, { color: colors.mutedForeground }]}
                      numberOfLines={1}
                    >
                      {item.packageName}
                      {item.isSystem ? "  ·  نظام" : ""}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.iconHolder,
                      { backgroundColor: colors.muted },
                    ]}
                  >
                    {iconUri ? (
                      <Image source={{ uri: iconUri }} style={styles.appIcon} />
                    ) : (
                      <Ionicons
                        name="apps"
                        size={18}
                        color={colors.mutedForeground}
                      />
                    )}
                  </View>
                </Pressable>
              );
            }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  notice: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  noticeText: {
    fontFamily: "Cairo_500Medium",
    fontSize: 12,
    textAlign: "center",
    writingDirection: "rtl",
    lineHeight: 20,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    fontFamily: "Cairo_500Medium",
    fontSize: 12,
  },
  searchRow: {
    flexDirection: "row-reverse",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  search: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: "Cairo_500Medium",
    fontSize: 13,
    textAlign: "right",
    writingDirection: "rtl",
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipText: {
    fontFamily: "Cairo_700Bold",
    fontSize: 11,
  },
  summary: {
    fontFamily: "Cairo_500Medium",
    fontSize: 11,
    textAlign: "right",
    writingDirection: "rtl",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  list: { padding: 16, gap: 8, flexGrow: 1 },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  iconHolder: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  appIcon: { width: 38, height: 38, borderRadius: 10 },
  appName: {
    fontFamily: "Cairo_700Bold",
    fontSize: 13,
    textAlign: "right",
    writingDirection: "rtl",
  },
  appPkg: {
    fontFamily: "Cairo_500Medium",
    fontSize: 10,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
