import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDialog } from "@/components/Dialog";
import { PageHeader } from "@/components/PageHeader";
import { useSettings, type CustomDnsServer } from "@/contexts/SettingsContext";
import { useColors } from "@/hooks/useColors";

const IPV4_RE = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d)$/;

export default function CustomDnsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const settings = useSettings();
  const dialog = useDialog();
  const [name, setName] = useState("");
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState("");

  const reset = () => {
    setName("");
    setPrimary("");
    setSecondary("");
  };

  const handleAdd = async () => {
    const n = name.trim();
    const p = primary.trim();
    const s = secondary.trim();
    if (!n) {
      dialog.show({
        title: "اسم مطلوب",
        message: "يرجى إدخال اسم مميّز للخادم.",
        icon: "create-outline",
        iconTint: "warning",
      });
      return;
    }
    if (!IPV4_RE.test(p)) {
      dialog.show({
        title: "عنوان IP غير صحيح",
        message: "يجب أن يكون الخادم الأساسي عنوان IPv4 صحيح.",
        icon: "alert-circle",
        iconTint: "danger",
      });
      return;
    }
    if (s && !IPV4_RE.test(s)) {
      dialog.show({
        title: "عنوان IP غير صحيح",
        message:
          "الخادم الاحتياطي يجب أن يكون عنوان IPv4 صحيح أو فارغ.",
        icon: "alert-circle",
        iconTint: "danger",
      });
      return;
    }
    await settings.addCustomDns({
      name: n,
      primary: p,
      secondary: s || undefined,
    });
    reset();
  };

  const handleRemove = (item: CustomDnsServer) => {
    dialog.show({
      title: "حذف الخادم",
      message: `هل تريد حذف "${item.name}"؟`,
      icon: "trash",
      iconTint: "danger",
      buttons: [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: () => settings.removeCustomDns(item.id),
        },
      ],
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PageHeader
        title="خوادم DNS مخصّصة"
        subtitle="أضف خادم IPv4 لاستخدامه في الوضع المخصّص"
      />

      <View
        style={[
          styles.formCard,
          { backgroundColor: colors.cardSolid, borderColor: colors.cardBorder },
        ]}
      >
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="الاسم (مثال: NextDNS الخاصّ بي)"
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            { color: colors.foreground, borderColor: colors.cardBorder, backgroundColor: colors.background },
          ]}
        />
        <TextInput
          value={primary}
          onChangeText={setPrimary}
          placeholder="الأساسي (مثال: 1.1.1.1)"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="numeric"
          style={[
            styles.input,
            { color: colors.foreground, borderColor: colors.cardBorder, backgroundColor: colors.background },
          ]}
        />
        <TextInput
          value={secondary}
          onChangeText={setSecondary}
          placeholder="الاحتياطي — اختياري"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="numeric"
          style={[
            styles.input,
            { color: colors.foreground, borderColor: colors.cardBorder, backgroundColor: colors.background },
          ]}
        />
        <Pressable
          onPress={handleAdd}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="checkmark" size={18} color={colors.primaryForeground} />
          <Text style={[styles.saveLabel, { color: colors.primaryForeground }]}>
            حفظ الخادم
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={settings.customDnsServers}
        keyExtractor={(s) => s.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 28 : 16) },
        ]}
        ListHeaderComponent={
          <Text style={[styles.listHeader, { color: colors.mutedForeground }]}>
            الخوادم المحفوظة — اضغط للاختيار كافتراضي للوضع المخصّص
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="hardware-chip-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              لا يوجد خادم محفوظ بعد.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const selected = settings.selectedCustomDnsId === item.id;
          return (
            <Pressable
              onPress={() => settings.selectCustomDns(selected ? null : item.id)}
              style={({ pressed }) => [
                styles.item,
                {
                  backgroundColor: colors.cardSolid,
                  borderColor: selected ? colors.primary : colors.cardBorder,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Pressable
                onPress={() => handleRemove(item)}
                style={({ pressed }) => [styles.removeBtn, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Ionicons name="trash-outline" size={18} color="#E03E52" />
              </Pressable>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <View style={styles.itemTitleRow}>
                  {selected ? (
                    <View
                      style={[styles.badge, { backgroundColor: colors.primary }]}
                    >
                      <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>
                        مفعّل
                      </Text>
                    </View>
                  ) : null}
                  <Text style={[styles.itemTitle, { color: colors.foreground }]}>
                    {item.name}
                  </Text>
                </View>
                <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>
                  {item.primary}
                  {item.secondary ? `  ·  ${item.secondary}` : ""}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  formCard: {
    margin: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: "Cairo_500Medium",
    fontSize: 13,
    textAlign: "right",
    writingDirection: "rtl",
  },
  saveBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveLabel: {
    fontFamily: "Cairo_700Bold",
    fontSize: 13,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
    flexGrow: 1,
  },
  listHeader: {
    fontFamily: "Cairo_500Medium",
    fontSize: 11,
    textAlign: "right",
    writingDirection: "rtl",
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  item: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
    gap: 10,
  },
  itemTitleRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  itemTitle: {
    fontFamily: "Cairo_700Bold",
    fontSize: 13,
    textAlign: "right",
    writingDirection: "rtl",
  },
  itemMeta: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: "Cairo_700Bold",
    fontSize: 9,
    letterSpacing: 0.5,
  },
  removeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingTop: 40,
  },
  emptyText: {
    fontFamily: "Cairo_500Medium",
    fontSize: 12,
    textAlign: "center",
    writingDirection: "rtl",
  },
});
