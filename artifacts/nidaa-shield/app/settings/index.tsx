import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PageHeader } from "@/components/PageHeader";
import { ACCENT_LIST, type AccentName } from "@/constants/colors";
import { useSettings, type ThemeMode } from "@/contexts/SettingsContext";
import { useColors } from "@/hooks/useColors";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const settings = useSettings();

  const openTileSettings = () => {
    if (Platform.OS !== "android") {
      Alert.alert(
        "غير مدعوم",
        "مفاتيح الإعدادات السريعة متاحة فقط على أجهزة الأندرويد.",
      );
      return;
    }
    Alert.alert(
      "كيفية الإضافة",
      "اسحب من أعلى الشاشة بإصبعين لفتح الإعدادات السريعة، ثم اضغط على رمز القلم (تعديل الأزرار) وستجد عدة بطاقات لنداء شايلد:\n\n• نداء شايلد (تشغيل/إيقاف)\n• الدرع الذكي\n• توربو الألعاب\n• حارس العائلة\n• الخصوصية العسكرية\n\nاسحب البطاقات التي تريدها إلى الأعلى.",
    );
  };

  const showWidgetHowTo = () => {
    Alert.alert(
      "إضافة الويدجت",
      'اضغط مطوّلاً على مساحة فارغة في شاشتك الرئيسية، ثم اختر "إضافة ودجت" أو "Widgets"، وابحث عن "نداء شايلد". ستجد عدة تصاميم:\n\n• ودجت سريع (مفتاح تشغيل/إيقاف)\n• ودجت الأوضاع (4 أوضاع بضغطة)\n• ودجت الحالة الكبير\n\nاختر التصميم الذي يناسبك ثم اسحبه إلى شاشتك.',
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PageHeader title="الإعدادات" subtitle="خصّص الحماية كما تريد" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 28 : 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Section title="المظهر" colors={colors}>
          <ThemeRow
            label="تلقائي (يتبع النظام)"
            mode="system"
            current={settings.themeMode}
            onSelect={(m) => settings.setThemeMode(m)}
            icon="phone-portrait-outline"
            colors={colors}
          />
          <ThemeRow
            label="فاتح"
            mode="light"
            current={settings.themeMode}
            onSelect={(m) => settings.setThemeMode(m)}
            icon="sunny-outline"
            colors={colors}
          />
          <ThemeRow
            label="داكن"
            mode="dark"
            current={settings.themeMode}
            onSelect={(m) => settings.setThemeMode(m)}
            icon="moon-outline"
            colors={colors}
          />

          <View style={[styles.accentBlock, { backgroundColor: colors.cardSolid, borderColor: colors.cardBorder }]}>
            <Text style={[styles.accentTitle, { color: colors.foreground }]}>
              لون التطبيق الأساسي
            </Text>
            <Text style={[styles.accentHint, { color: colors.mutedForeground }]}>
              اختر اللون الذي يلائم ذوقك. خيار «تباين عالٍ» مناسب لكبار السن.
            </Text>
            <View style={styles.accentRow}>
              {ACCENT_LIST.map((a) => (
                <AccentSwatch
                  key={a.id}
                  id={a.id}
                  label={a.label}
                  color={a.color}
                  selected={settings.accentColor === a.id}
                  onSelect={() => settings.setAccentColor(a.id)}
                  colors={colors}
                />
              ))}
            </View>
          </View>
        </Section>

        <Section title="حظر إعلانات يوتيوب" colors={colors}>
          <ToggleRow
            icon="logo-youtube"
            iconColor="#FF0033"
            label="حجب إعلانات يوتيوب"
            hint="يضيف ~30 نطاقاً إعلانياً معروفاً تلقائياً"
            value={settings.blockYoutubeAds}
            onValueChange={(v) => settings.setBlockYoutubeAds(v)}
            colors={colors}
          />
          <View
            style={[
              styles.tipCard,
              { backgroundColor: "#FF003311", borderColor: "#FF003344" },
            ]}
          >
            <Ionicons name="information-circle" size={16} color="#FF0033" />
            <Text style={[styles.tipText, { color: colors.foreground }]}>
              ملاحظة: بعض إعلانات يوتيوب تأتي من نفس خادم الفيديوهات (googlevideo.com)
              ولا يمكن حجبها عبر DNS بدون كسر الفيديو نفسه. هذه الميزة تحجب
              ~85% من الإعلانات والمتتبّعات بشكل آمن.
            </Text>
          </View>
        </Section>

        <Section title="الأدوات" colors={colors}>
          <NavRow
            icon="checkmark-circle-outline"
            iconColor="#1B7A4B"
            label="اختبر الحماية الآن"
            hint="تأكد أن الفلترة تعمل فعلاً"
            onPress={() => router.push("/test-protection")}
            colors={colors}
          />
          <NavRow
            icon="share-social-outline"
            iconColor={colors.primary}
            label="شارك إنجازك"
            hint="انشر شارة الحماية على ستوري واتساب"
            onPress={() => router.push("/share-badge")}
            colors={colors}
          />
          <NavRow
            icon="speedometer-outline"
            iconColor="#9B6CFF"
            label="اختبار سرعة DNS"
            hint="قِس زمن الاستجابة لكل خادم"
            onPress={() => router.push("/speed-test")}
            colors={colors}
          />
        </Section>

        <Section title="إدارة النطاقات" colors={colors}>
          <NavRow
            icon="ban-outline"
            iconColor="#E03E52"
            label="القائمة السوداء"
            hint={`${settings.blocklist.length} نطاق محظور${settings.blockYoutubeAds ? " (شامل قائمة يوتيوب)" : ""}`}
            onPress={() => router.push("/settings/blocklist")}
            colors={colors}
          />
          <NavRow
            icon="checkmark-done-outline"
            iconColor="#00B47A"
            label="القائمة البيضاء"
            hint={`${settings.whitelist.length} نطاق مسموح دائماً`}
            onPress={() => router.push("/settings/whitelist")}
            colors={colors}
          />
        </Section>

        <Section title="المتقدّم" colors={colors}>
          <ToggleRow
            icon="phone-portrait-outline"
            iconColor={colors.primary}
            label="اهتزاز خفيف عند التشغيل"
            hint="تأثير لمسي عند تفعيل/إيقاف الحماية"
            value={settings.hapticsEnabled}
            onValueChange={(v) => settings.setHapticsEnabled(v)}
            colors={colors}
          />
          <NavRow
            icon="hardware-chip-outline"
            iconColor={colors.primary}
            label="خوادم DNS مخصّصة"
            hint={`${settings.customDnsServers.length} خادم محفوظ`}
            onPress={() => router.push("/settings/custom-dns")}
            colors={colors}
          />
          <NavRow
            icon="apps-outline"
            iconColor="#9B6CFF"
            label="استثناء تطبيقات"
            hint={`${settings.excludedApps.length} تطبيق مستثنى`}
            onPress={() => router.push("/settings/excluded-apps")}
            colors={colors}
          />
          <NavRow
            icon="settings-outline"
            iconColor={colors.foreground}
            label="إعدادات متقدّمة"
            hint="DoH، تشغيل تلقائي، إعادة الضبط"
            onPress={() => router.push("/settings/advanced")}
            colors={colors}
          />
        </Section>

        <Section title="ميّزات النظام" colors={colors}>
          <NavRow
            icon="apps"
            iconColor={colors.primary}
            label="ودجت الشاشة الرئيسية"
            hint="زرّ تشغيل سريع على شاشتك الرئيسية"
            onPress={showWidgetHowTo}
            colors={colors}
          />
          <NavRow
            icon="grid"
            iconColor={colors.primary}
            label="مفتاح الإعدادات السريعة"
            hint="تحكّم بالحماية من شريط الإشعارات"
            onPress={openTileSettings}
            colors={colors}
          />
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  colors,
  children,
}: {
  title: string;
  colors: ReturnType<typeof useColors>;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
        {title}
      </Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function ThemeRow({
  label,
  mode,
  current,
  onSelect,
  icon,
  colors,
}: {
  label: string;
  mode: ThemeMode;
  current: ThemeMode;
  onSelect: (m: ThemeMode) => void;
  icon: any;
  colors: ReturnType<typeof useColors>;
}) {
  const selected = current === mode;
  return (
    <Pressable
      onPress={() => onSelect(mode)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.cardSolid,
          borderColor: selected ? colors.primary : colors.cardBorder,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={styles.rowRight}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: colors.primarySoft },
          ]}
        >
          <Ionicons name={icon} size={16} color={colors.primary} />
        </View>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>
          {label}
        </Text>
      </View>
      <View
        style={[
          styles.radio,
          { borderColor: selected ? colors.primary : colors.cardBorder },
        ]}
      >
        {selected ? (
          <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
        ) : null}
      </View>
    </Pressable>
  );
}

function AccentSwatch({
  id,
  label,
  color,
  selected,
  onSelect,
  colors,
}: {
  id: AccentName;
  label: string;
  color: string;
  selected: boolean;
  onSelect: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.swatchBtn,
        {
          borderColor: selected ? color : colors.cardBorder,
          backgroundColor: selected ? color + "1A" : "transparent",
          opacity: pressed ? 0.6 : 1,
        },
      ]}
    >
      <View style={[styles.swatchDot, { backgroundColor: color }]}>
        {selected ? (
          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
        ) : null}
      </View>
      <Text style={[styles.swatchLabel, { color: colors.foreground }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ToggleRow({
  icon,
  iconColor,
  label,
  hint,
  value,
  onValueChange,
  colors,
}: {
  icon: any;
  iconColor: string;
  label: string;
  hint: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.cardSolid,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={styles.rowRight}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: iconColor + "22" },
          ]}
        >
          <Ionicons name={icon} size={16} color={iconColor} />
        </View>
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>
            {label}
          </Text>
          <Text style={[styles.rowHint, { color: colors.mutedForeground }]}>
            {hint}
          </Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor={Platform.OS === "android" ? "#FFFFFF" : undefined}
        trackColor={{ false: colors.muted, true: colors.primary }}
      />
    </View>
  );
}

function NavRow({
  icon,
  iconColor,
  label,
  hint,
  onPress,
  colors,
}: {
  icon: any;
  iconColor: string;
  label: string;
  hint: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.cardSolid,
          borderColor: colors.cardBorder,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={styles.rowRight}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: iconColor + "22" },
          ]}
        >
          <Ionicons name={icon} size={16} color={iconColor} />
        </View>
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>
            {label}
          </Text>
          <Text style={[styles.rowHint, { color: colors.mutedForeground }]}>
            {hint}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-back" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

// Re-export for use elsewhere if needed
export { Switch };

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, gap: 18 },
  section: { gap: 8 },
  sectionTitle: {
    fontFamily: "Cairo_700Bold",
    fontSize: 12,
    textAlign: "right",
    writingDirection: "rtl",
    paddingHorizontal: 4,
    letterSpacing: 0.5,
  },
  sectionBody: { gap: 8 },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  rowRight: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    fontFamily: "Cairo_700Bold",
    fontSize: 13,
    textAlign: "right",
    writingDirection: "rtl",
  },
  rowHint: {
    fontFamily: "Cairo_500Medium",
    fontSize: 11,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  accentBlock: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  accentTitle: {
    fontFamily: "Cairo_700Bold",
    fontSize: 13,
    textAlign: "right",
    writingDirection: "rtl",
  },
  accentHint: {
    fontFamily: "Cairo_500Medium",
    fontSize: 11,
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: 4,
  },
  accentRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
  },
  swatchBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  swatchDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchLabel: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 11,
  },
  tipCard: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  tipText: {
    flex: 1,
    fontFamily: "Cairo_500Medium",
    fontSize: 11,
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 17,
  },
});
