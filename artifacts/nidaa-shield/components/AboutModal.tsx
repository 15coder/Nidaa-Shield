import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AboutModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isDark = colors.scheme === "dark";

  // Theme-aware tokens
  const sheetBg = isDark
    ? "rgba(15, 22, 30, 0.96)"
    : "rgba(255, 255, 255, 0.95)";
  const handleBg = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)";
  const dividerBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const bulletIconBg = isDark
    ? "rgba(255,255,255,0.06)"
    : "rgba(0,0,0,0.05)";
  const closeBg = isDark ? colors.primary : colors.foreground;
  const closeText = isDark ? colors.primaryForeground : colors.primaryForeground;
  const blurTint: "light" | "dark" = isDark ? "dark" : "light";

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <BlurView
          intensity={70}
          tint={blurTint}
          style={[
            styles.sheet,
            {
              backgroundColor: sheetBg,
              borderColor: colors.cardActiveBorder,
              paddingBottom: Math.max(insets.bottom, 24),
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: handleBg }]} />

          <View style={styles.headerRow}>
            <View style={[styles.iconBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              لماذا نداء شايلد؟
            </Text>
          </View>

          <ScrollView
            style={{ maxHeight: 420 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            <Text style={[styles.lead, { color: colors.foreground }]}>
              سياسة الصفر بيانات سحابية
            </Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>
              نداء شايلد يعمل محلياً بالكامل على جهازك. لا يوجد خادم وسيط، ولا
              قاعدة بيانات سحابية، ولا تحليلات. تقنياً، لا يمكن للمطور مراقبة
              نشاطك لأن التطبيق لا يرسل أي بيانات إلى أي جهة خارجية.
            </Text>

            <View style={[styles.divider, { backgroundColor: dividerBg }]} />

            <Bullet
              icon="checkmark-circle"
              title="تشغيل محلي بالكامل"
              text="جميع الإعدادات والحالات محفوظة على ذاكرة جهازك فقط."
              colors={colors}
              iconBg={bulletIconBg}
            />
            <Bullet
              icon="shield-checkmark"
              title="بدون تتبع"
              text="لا نستخدم أي مكتبة تحليلات أو تتبع للأحداث."
              colors={colors}
              iconBg={bulletIconBg}
            />
            <Bullet
              icon="flash"
              title="استجابة فورية"
              text="استجابة DNS بأقل من 10ms لضمان سلاسة التصفح."
              colors={colors}
              iconBg={bulletIconBg}
            />
            <Bullet
              icon="key"
              title="أنت تملك المفاتيح"
              text="لا حسابات، لا تسجيل دخول، لا أرقام هاتف. التطبيق يعمل بمجرد منح إذن الـ VPN داخل الجهاز."
              colors={colors}
              iconBg={bulletIconBg}
            />
          </ScrollView>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeBtn,
              {
                backgroundColor: closeBg,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.closeText, { color: closeText }]}>
              فهمت
            </Text>
          </Pressable>
        </BlurView>
      </View>
    </Modal>
  );
}

function Bullet({
  icon,
  title,
  text,
  colors,
  iconBg,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  colors: ReturnType<typeof useColors>;
  iconBg: string;
}) {
  return (
    <View style={styles.bulletRow}>
      <View
        style={[
          styles.bulletIcon,
          { backgroundColor: iconBg },
        ]}
      >
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View style={{ flex: 1, alignItems: "flex-end" }}>
        <Text style={[styles.bulletTitle, { color: colors.foreground }]}>
          {title}
        </Text>
        <Text style={[styles.bulletText, { color: colors.mutedForeground }]}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 14,
    overflow: "hidden",
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 3,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Cairo_700Bold",
    fontSize: 20,
    textAlign: "right",
    writingDirection: "rtl",
  },
  lead: {
    fontFamily: "Cairo_700Bold",
    fontSize: 15,
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: 6,
  },
  body: {
    fontFamily: "Cairo_500Medium",
    fontSize: 13,
    lineHeight: 22,
    textAlign: "right",
    writingDirection: "rtl",
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  bulletRow: {
    flexDirection: "row-reverse",
    gap: 12,
    marginBottom: 14,
    alignItems: "flex-start",
  },
  bulletIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  bulletTitle: {
    fontFamily: "Cairo_700Bold",
    fontSize: 14,
    textAlign: "right",
    writingDirection: "rtl",
  },
  bulletText: {
    fontFamily: "Cairo_500Medium",
    fontSize: 12,
    lineHeight: 20,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: 2,
  },
  closeBtn: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: "center",
  },
  closeText: {
    fontFamily: "Cairo_700Bold",
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
