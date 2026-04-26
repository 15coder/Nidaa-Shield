import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDialog } from "@/components/Dialog";
import { PageHeader } from "@/components/PageHeader";
import { useSettings } from "@/contexts/SettingsContext";
import { useColors } from "@/hooks/useColors";

export default function AdvancedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const settings = useSettings();
  const dialog = useDialog();

  const handleReset = () => {
    dialog.show({
      title: "إعادة ضبط الإعدادات",
      message:
        "سيتم حذف جميع الإعدادات والقوائم والخوادم المخصّصة. هل أنت متأكد؟",
      icon: "warning",
      iconTint: "danger",
      buttons: [
        { text: "إلغاء", style: "cancel" },
        {
          text: "إعادة الضبط",
          style: "destructive",
          onPress: async () => {
            await settings.resetAll();
            if (router.canGoBack()) router.back();
            else router.replace("/");
          },
        },
      ],
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PageHeader title="إعدادات متقدّمة" subtitle="خيارات قوية للمستخدمين المتمرّسين" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 28 : 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardSolid, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.row}>
            <Switch
              value={settings.useDoH}
              onValueChange={(v) => settings.setUseDoH(v)}
              trackColor={{ true: colors.primary, false: colors.muted }}
              thumbColor="#FFFFFF"
            />
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={[styles.title, { color: colors.foreground }]}>
                تشفير DNS عبر HTTPS (DoH)
              </Text>
              <Text style={[styles.body, { color: colors.mutedForeground }]}>
                عند التفعيل، يستخدم وضع "الخصوصية العسكرية" بروتوكول DoH عبر Cloudflare لمنع المزود من قراءة طلباتك.
              </Text>
            </View>
            <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="lock-closed" size={16} color={colors.primary} />
            </View>
          </View>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardSolid, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.row}>
            <Switch
              value={settings.autoStartOnBoot}
              onValueChange={(v) => settings.setAutoStartOnBoot(v)}
              trackColor={{ true: colors.primary, false: colors.muted }}
              thumbColor="#FFFFFF"
            />
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={[styles.title, { color: colors.foreground }]}>
                تشغيل تلقائي عند الإقلاع
              </Text>
              <Text style={[styles.body, { color: colors.mutedForeground }]}>
                يبدأ آخر وضع حماية مفعّل تلقائياً عند تشغيل الجهاز. يحتاج لمنح إذن VPN مرّة واحدة.
              </Text>
            </View>
            <View style={[styles.iconWrap, { backgroundColor: "#9B6CFF22" }]}>
              <Ionicons name="power" size={16} color="#9B6CFF" />
            </View>
          </View>
        </View>

        <Pressable
          onPress={handleReset}
          style={({ pressed }) => [
            styles.dangerBtn,
            {
              backgroundColor: "#E03E5215",
              borderColor: "#E03E52",
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons name="warning" size={16} color="#E03E52" />
          <Text style={[styles.dangerLabel, { color: "#E03E52" }]}>
            إعادة ضبط جميع الإعدادات
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, gap: 12 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Cairo_700Bold",
    fontSize: 13,
    textAlign: "right",
    writingDirection: "rtl",
  },
  body: {
    fontFamily: "Cairo_500Medium",
    fontSize: 11,
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 18,
    marginTop: 4,
  },
  dangerBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  dangerLabel: {
    fontFamily: "Cairo_700Bold",
    fontSize: 13,
  },
});
