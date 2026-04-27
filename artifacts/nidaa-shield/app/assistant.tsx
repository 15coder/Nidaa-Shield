import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/contexts/SettingsContext";
import { useVpn, MODES, type ShieldMode } from "@/contexts/VpnContext";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

// ─── Types ────────────────────────────────────────────────
type Tab = "chat" | "faq";
type Role = "assistant" | "user";

interface ActionButton {
  label: string;
  mode?: Exclude<ShieldMode, null>;
}

interface Message {
  id: string;
  role: Role;
  text: string;
  actions?: ActionButton[];
  timestamp: Date;
}

interface KnowledgeRule {
  keywords: string[];
  response: string;
  actions?: ActionButton[];
}

interface FAQItem {
  q: string;
  a: string;
}

interface FAQCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  colorDark: string;
  colorSoft: string;
  items: FAQItem[];
}

// ─── FAQ Data ─────────────────────────────────────────────
const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: "family",
    label: "حارس العائلة",
    icon: "people",
    color: "#12A75C",
    colorDark: "#0D8049",
    colorSoft: "#E8F9F0",
    items: [
      {
        q: "هل يمنع حارس العائلة ظهور الصور المخلة في جوجل؟",
        a: "نعم، يقوم بفرض ميزة SafeSearch التي تحجب الصور والمواقع غير اللائقة من نتائج البحث تلقائياً.",
      },
      {
        q: "هل يعمل وضع العائلة على تطبيق يوتيوب؟",
        a: "نعم، يساعد في تفعيل وضع التقييد لتقليل احتمالية ظهور فيديوهات غير مناسبة للأطفال.",
      },
      {
        q: "هل يمكن لطفلي إيقاف الحماية من إعدادات الهاتف؟",
        a: "إذا كان التطبيق مفعلاً، سيظل الـ DNS محمياً. يُفضل قفل التطبيق بكلمة سر لضمان عدم إيقافه.",
      },
      {
        q: "هل يحجب حارس العائلة ألعاب القمار؟",
        a: "نعم، يتضمن الفلتر حظراً للمواقع المرتبطة بالقمار والمحتوى الضار بالعائلة.",
      },
      {
        q: "هل يتم حجب مواقع الدردشة العشوائية؟",
        a: "نعم، يتم تصنيف معظم هذه المواقع كمحتوى غير آمن ويتم حظرها في وضع العائلة.",
      },
      {
        q: "هل الحماية العائلية تبطئ تحميل الفيديوهات التعليمية؟",
        a: "لا، الفلتر ذكي جداً ويميز بين المحتوى التعليمي والمحتوى المحظور دون التأثير على السرعة.",
      },
      {
        q: "ماذا يحدث إذا حاول المستخدم الدخول لموقع محظور؟",
        a: "ستظهر رسالة بأن الموقع غير متاح أو لن يتم تحميل الصفحة، مما يحمي المستخدم فوراً.",
      },
    ],
  },
  {
    id: "smart",
    label: "الدرع الذكي",
    icon: "shield-checkmark",
    color: "#0090CC",
    colorDark: "#006FA0",
    colorSoft: "#E5F6FF",
    items: [
      {
        q: "لماذا لا تزال بعض إعلانات فيسبوك تظهر؟",
        a: "بعض التطبيقات تدمج الإعلانات داخل برمجتها الخاصة، لكن الدرع ينجح في حظر 90% من إعلانات الويب والنوافذ المنبثقة.",
      },
      {
        q: "هل يحجب الدرع إعلانات الألعاب المجانية المزعجة؟",
        a: "نعم، يقضي على الإعلانات التي تظهر فجأة أثناء اللعب وتستهلك باقة الإنترنت.",
      },
      {
        q: "هل تفعيل الدرع يوفر في استهلاك باقة البيانات؟",
        a: "بكل تأكيد، لأن الإعلانات تستهلك جزءاً كبيراً من تحميل الصفحة، وحجبها يعني استهلاكاً أقل.",
      },
      {
        q: "هل الدرع الذكي يحمي من برمجيات التجسس؟",
        a: "نعم، يحظر الروابط التي تحاول تتبع نشاطك أو سحب بيانات جهازك بصمت.",
      },
      {
        q: "هل يؤدي حظر الإعلانات إلى تعطل بعض المواقع؟",
        a: "نادراً ما يحدث ذلك، والدرع مصمم ليكون ذكياً بحيث يحجب الإعلان فقط دون تخريب محتوى الموقع.",
      },
      {
        q: "هل يعمل الدرع الذكي على متصفح كروم فقط؟",
        a: "لا، الحماية تعمل على مستوى الجهاز بالكامل، وتشمل جميع المتصفحات والتطبيقات.",
      },
    ],
  },
  {
    id: "military",
    label: "الخصوصية العسكرية",
    icon: "lock-closed",
    color: "#6B48D4",
    colorDark: "#5236B0",
    colorSoft: "#F0ECFF",
    items: [
      {
        q: "ما الذي يجعل هذه الخصوصية عسكرية؟",
        a: "لأنها تستخدم بروتوكولات تشفير عالمية (DoH) تمنع أي جهة من اعتراض بياناتك أو فك تشفيرها.",
      },
      {
        q: "هل يتم تسجيل المواقع التي أزورها في هذا الوضع؟",
        a: "لا، نعتمد على خوادم Quad9 التي تتبع سياسة No-Logs، أي لا يتم تخزين أي سجل لنشاطك.",
      },
      {
        q: "هل يحميني هذا الوضع عند الاتصال بشبكة واي فاي عامة؟",
        a: "نعم، هو الخيار المثالي للشبكات العامة لأنه يمنع المتسللين على نفس الشبكة من مراقبة نشاطك.",
      },
      {
        q: "هل الخصوصية العسكرية هي نفسها الـ VPN؟",
        a: "هي تعمل كنفق مشفر لطلبات الـ DNS، مما يعطيك خصوصية الـ VPN لكن بدون تقليل سرعة الإنترنت.",
      },
      {
        q: "هل يخفي هذا الوضع عنوان الـ IP الخاص بي؟",
        a: "هو يخفي وجهة تصفحك، مما يجعل تتبع اهتماماتك لبناء ملف إعلاني عنك أمراً مستحيلاً.",
      },
      {
        q: "هل يمنع هذا الوضع المواقع من معرفة مكاني؟",
        a: "الخصوصية هنا تركز على تشفير الطلب، أما الموقع الجغرافي فيعتمد على إعدادات الـ GPS في جهازك.",
      },
    ],
  },
  {
    id: "gaming",
    label: "توربو الألعاب",
    icon: "game-controller",
    color: "#D97706",
    colorDark: "#B45309",
    colorSoft: "#FFF7E6",
    items: [
      {
        q: "هل يزيد وضع التوربو من سرعة التحميل (Download)؟",
        a: "هو يحسن الاستجابة (Ping) بشكل أساسي، مما يجعل تصفح المواقع وبدء التحميل أسرع.",
      },
      {
        q: "العب ببجي PUBG، فهل سيقل الـ لاق (Lag)؟",
        a: "نعم، عبر تقليل الوقت الذي يستغرقه جهازك للتواصل مع خادم اللعبة باستخدام خوادم Cloudflare السريعة.",
      },
      {
        q: "هل يؤثر وضع التوربو على جودة البث في نتفليكس؟",
        a: "يساعد في استقرار الاتصال وسرعة الوصول للسيرفرات، مما قد يحسن جودة البث ويمنع التقطيع.",
      },
      {
        q: "هل يمكنني استخدام التوربو أثناء تحميل الملفات الكبيرة؟",
        a: "نعم، فهو يوفر اتصالاً مستقراً وموثوقاً لضمان عدم انقطاع التحميل.",
      },
    ],
  },
  {
    id: "general",
    label: "أسئلة عامة",
    icon: "help-circle",
    color: "#475569",
    colorDark: "#334155",
    colorSoft: "#F1F5F9",
    items: [
      {
        q: "كيف أعرف أن التطبيق يعمل حالياً؟",
        a: "ستظهر عبارة مفعّل في الواجهة الرئيسية، بالإضافة إلى أيقونة المفتاح الصغيرة في شريط الإشعارات أعلى الشاشة.",
      },
      {
        q: "هل يعمل التطبيق في الخلفية دائماً؟",
        a: "نعم، بمجرد التفعيل، يعمل التطبيق في الخلفية بصمت دون إزعاجك لتوفير حماية مستمرة.",
      },
      {
        q: "هل يستهلك التطبيق الكثير من الرام (RAM)؟",
        a: "لا، التطبيق خفيف جداً ومصمم ليعمل بأقل استهلاك ممكن للموارد لضمان سلاسة الجهاز.",
      },
      {
        q: "هل التطبيق مجاني بالكامل؟",
        a: "نعم، جميع الأوضاع والخدمات المقدمة في نداء شايلد متاحة مجاناً لخدمة المستخدمين.",
      },
      {
        q: "هل أحتاج لعمل روت (Root) لجهازي؟",
        a: "لا يحتاج التطبيق لأي صلاحيات روت، فهو يعمل بشكل رسمي وآمن تماماً على كافة الأجهزة.",
      },
      {
        q: "ماذا أفعل إذا واجهت مشكلة في الاتصال؟",
        a: "جرب إيقاف الوضع وتفعيله مرة أخرى، أو تأكد من جودة اتصال الإنترنت لديك أولاً.",
      },
      {
        q: "هل يمكنني اقتراح وضع جديد لإضافته للتطبيق؟",
        a: "بكل تأكيد! نحن نسعى دائماً للتطوير، يمكنك مراسلتنا عبر أيقونة تواصل معنا داخل التطبيق.",
      },
    ],
  },
];

// ─── Chat Knowledge ────────────────────────────────────────
const RULES: KnowledgeRule[] = [
  {
    keywords: ["مرحبا", "هلا", "اهلا", "أهلا", "السلام", "كيف حالك", "صباح", "مساء"],
    response: "أهلاً بك! أنا مساعد نداء شايلد 🛡️\n\nيمكنني مساعدتك في اختيار وضع الحماية، شرح تقنيات الأمان، أو الإجابة عن أسئلتك الرقمية.\n\nبماذا يمكنني خدمتك؟",
  },
  {
    keywords: ["إعلانات", "اعلانات", "إعلان", "اعلان", "تتبع", "متتبع", "بلوك"],
    response: "لحجب الإعلانات والمتتبعين أنصحك بـ الدرع الذكي 🛡️\n\nيستخدم AdGuard DoH لفلترة الإعلانات على مستوى النظام بأكمله، بما فيها إعلانات التطبيقات.",
    actions: [{ label: "تفعيل الدرع الذكي", mode: "smart" }],
  },
  {
    keywords: ["العاب", "ألعاب", "لعب", "لاغ", "ping", "بطيء", "سرعة", "فورتنايت", "ببجي", "تأخير"],
    response: "للألعاب عليك توربو الألعاب 🎮\n\nيعتمد على Cloudflare DoH، أسرع خوادم DNS في العالم، لتقليل الـ Ping وضمان استقرار الاتصال.",
    actions: [{ label: "تفعيل توربو الألعاب", mode: "gaming" }],
  },
  {
    keywords: ["اطفال", "أطفال", "ولد", "بنت", "ابن", "عائلة", "أسرة", "محتوى", "رقابة", "يوتيوب"],
    response: "حارس العائلة هو خيارك 👨‍👩‍👧\n\n• حجب تلقائي للمحتوى غير اللائق\n• البحث الآمن في يوتيوب وجوجل\n• حماية شاملة لكل التطبيقات",
    actions: [{ label: "تفعيل حارس العائلة", mode: "family" }],
  },
  {
    keywords: ["خصوصية", "تجسس", "تشفير", "مراقبة", "اخفاء", "إخفاء", "امن", "أمن"],
    response: "الخصوصية العسكرية هي أقصى درجات الحماية 🔒\n\nتستخدم Quad9 DoH بمعايير DNSSEC لإخفاء نشاطك عن مزود الإنترنت ومنع أي تتبع.",
    actions: [{ label: "تفعيل الخصوصية العسكرية", mode: "military" }],
  },
  {
    keywords: ["ما الفرق", "الفرق", "أيهم", "اختر", "وضع", "أنسب", "توصي"],
    response: "مقارنة الأوضاع الأربعة:\n\n🛡️ الدرع الذكي — حجب إعلانات ومتتبعين\n🎮 توربو الألعاب — Ping منخفض وسرعة\n👨‍👩‍👧 حارس العائلة — رقابة أبوية شاملة\n🔒 الخصوصية العسكرية — تشفير أقصى\n\nجميعها تستخدم DoH. أخبرني باحتياجاتك لأحدد الأنسب.",
  },
  {
    keywords: ["doh", "dns", "بروتوكول", "https", "تقنية", "كيف يعمل"],
    response: "DNS over HTTPS (DoH) هو البروتوكول الذي يحمي طلبات DNS:\n\n🔓 بدون DoH: مزود الإنترنت يرى كل موقع تزوره\n✅ مع DoH: الطلبات مشفرة — لا أحد يستطيع قراءتها\n\nnداء شايلد يستخدم DoH في جميع الأوضاع تلقائياً.",
  },
  {
    keywords: ["vpn", "في بي ان"],
    response: "نداء شايلد يعمل كـ Local VPN خفيف — يُنشئ نفقاً محلياً على جهازك لتوجيه DNS فقط.\n\nهذا يختلف عن VPN التقليدي:\n• VPN عادي: يوجّه كل ترافيك الإنترنت\n• نداء شايلد: DNS فقط — أسرع وأقل استهلاكاً للبطارية",
  },
  {
    keywords: ["شكرا", "شكراً", "مشكور", "ممتاز", "رائع"],
    response: "العفو! سعيد بخدمتك 😊\n\nإذا احتجت مساعدة أخرى في الأمان الرقمي، أنا هنا دائماً.",
  },
];

const WELCOME_MSG: Message = {
  id: "welcome",
  role: "assistant",
  text: "مرحباً! أنا مساعد نداء شايلد 🛡️\n\nاكتب سؤالك بالعربية وسأجيبك فوراً، أو تصفح الأسئلة الشائعة من التبويب أعلاه.",
  actions: [
    { label: "ما الوضع المناسب للألعاب؟" },
    { label: "كيف أحجب الإعلانات؟" },
    { label: "أريد أقصى خصوصية" },
  ],
  timestamp: new Date(),
};

function matchRule(text: string): KnowledgeRule | null {
  const lower = text.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) return rule;
  }
  return null;
}

const QUICK_PROMPTS = [
  "ما الفرق بين الأوضاع؟",
  "حماية الأطفال",
  "أسرع وضع للألعاب",
  "ما هو DoH؟",
  "أقصى خصوصية",
];

// ─── Typing indicator ─────────────────────────────────────
function TypingDots({ color }: { color: string }) {
  const dots = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
  ];
  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(d, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0.3, duration: 350, useNativeDriver: true }),
        ]),
      ),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);
  return (
    <View style={{ flexDirection: "row", gap: 5, paddingHorizontal: 4, paddingVertical: 6 }}>
      {dots.map((d, i) => (
        <Animated.View
          key={i}
          style={{
            width: 7, height: 7, borderRadius: 3.5,
            backgroundColor: color, opacity: d,
          }}
        />
      ))}
    </View>
  );
}

// ─── Chat Bubble ──────────────────────────────────────────
function ChatBubble({
  msg, colors, onAction,
}: {
  msg: Message;
  colors: ReturnType<typeof useColors>;
  onAction: (a: ActionButton) => void;
}) {
  const slideAnim = useRef(new Animated.Value(msg.role === "user" ? 16 : -16)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isDark = colors.scheme === "dark";
  const isUser = msg.role === "user";

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        chatStyles.row,
        isUser ? chatStyles.userRow : chatStyles.assistantRow,
        { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
      ]}
    >
      {!isUser && (
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={chatStyles.avatar}
        >
          <Ionicons name="shield-checkmark" size={13} color="#FFF" />
        </LinearGradient>
      )}
      <View style={[chatStyles.col, isUser ? { alignItems: "flex-start" } : { alignItems: "flex-end" }]}>
        <View
          style={[
            chatStyles.bubble,
            isUser
              ? { backgroundColor: colors.primary, borderBottomLeftRadius: 4 }
              : {
                  backgroundColor: isDark ? colors.cardSolid : "#F0F5FF",
                  borderColor: isDark ? colors.cardBorder : "rgba(0,0,0,0.06)",
                  borderWidth: 1,
                  borderBottomRightRadius: 4,
                },
          ]}
        >
          <Text
            style={[
              chatStyles.bubbleText,
              { color: isUser ? "#FFF" : colors.foreground },
            ]}
          >
            {msg.text}
          </Text>
        </View>

        {msg.actions && msg.actions.length > 0 && (
          <View style={chatStyles.actions}>
            {msg.actions.map((a, i) => (
              <Pressable
                key={i}
                onPress={() => onAction(a)}
                style={({ pressed }) => [
                  chatStyles.actionChip,
                  {
                    backgroundColor: isDark ? colors.cardSolid : "#FFFFFF",
                    borderColor: colors.primary + "50",
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons name="flash" size={11} color={colors.primary} />
                <Text style={[chatStyles.actionLabel, { color: colors.primary }]}>
                  {a.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const chatStyles = StyleSheet.create({
  row: { marginBottom: 14, paddingHorizontal: 16 },
  userRow: { flexDirection: "row", justifyContent: "flex-start" },
  assistantRow: { flexDirection: "row-reverse", justifyContent: "flex-start" },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    marginLeft: 8, alignSelf: "flex-end", flexShrink: 0,
  },
  col: { maxWidth: "82%" },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleText: {
    fontFamily: "Cairo_400Regular",
    fontSize: 13.5,
    lineHeight: 22,
    textAlign: "right",
    writingDirection: "rtl",
  },
  actions: { marginTop: 8, gap: 6, alignItems: "flex-end" },
  actionChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  actionLabel: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 11.5,
  },
});

// ─── FAQ Question Card ────────────────────────────────────
function QuestionCard({
  item, index, accentColor, softColor, isDark,
}: {
  item: FAQItem;
  index: number;
  accentColor: string;
  softColor: string;
  isDark: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    LayoutAnimation.configureNext({
      duration: 280,
      update: { type: "spring", springDamping: 0.8 },
      create: { type: "easeInEaseOut", property: "opacity", duration: 220 },
      delete: { type: "easeInEaseOut", property: "opacity", duration: 180 },
    });

    const next = !expanded;
    setExpanded(next);

    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: next ? 1 : 0,
        duration: 250,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: next ? 1 : 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "45deg"] });

  return (
    <Pressable
      onPress={toggle}
      style={[
        faqStyles.card,
        {
          backgroundColor: isDark
            ? expanded ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)"
            : "#FFFFFF",
          borderColor: expanded
            ? accentColor + "30"
            : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.055)",
          borderLeftColor: expanded ? accentColor : "transparent",
          borderLeftWidth: expanded ? 3.5 : 0,
        },
      ]}
    >
      {/* Question row */}
      <View style={faqStyles.qRow}>
        <Text style={[faqStyles.qText, { color: isDark ? "#E8EEF8" : "#1A2332" }]}>
          {item.q}
        </Text>
        <Animated.View
          style={[
            faqStyles.plusCircle,
            {
              backgroundColor: expanded ? accentColor : (isDark ? "rgba(255,255,255,0.08)" : "#F0F4FA"),
              transform: [{ rotate }],
            },
          ]}
        >
          <Ionicons name="add" size={16} color={expanded ? "#FFFFFF" : (isDark ? "#8B95A1" : "#64748B")} />
        </Animated.View>
      </View>

      {/* Answer — renders only when expanded */}
      {expanded && (
        <Animated.View
          style={[
            faqStyles.answer,
            {
              backgroundColor: isDark ? "rgba(255,255,255,0.04)" : softColor,
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={[faqStyles.aText, { color: isDark ? "#A8B8CC" : "#374151" }]}>
            {item.a}
          </Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

const faqStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  qRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  qText: {
    flex: 1,
    fontFamily: "Cairo_600SemiBold",
    fontSize: 13.5,
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 22,
  },
  plusCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  answer: {
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  aText: {
    fontFamily: "Cairo_400Regular",
    fontSize: 13,
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 22,
  },
});

// ─── FAQ View ─────────────────────────────────────────────
function FAQView({ colors }: { colors: ReturnType<typeof useColors> }) {
  const [selectedId, setSelectedId] = useState("family");
  const isDark = colors.scheme === "dark";
  const cat = FAQ_CATEGORIES.find((c) => c.id === selectedId) ?? FAQ_CATEGORIES[0];

  return (
    <View style={{ flex: 1 }}>
      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={faqViewStyles.chipRow}
        style={[faqViewStyles.chipScroll, { borderBottomColor: colors.border }]}
      >
        {FAQ_CATEGORIES.map((c) => {
          const active = c.id === selectedId;
          return (
            <Pressable
              key={c.id}
              onPress={() => setSelectedId(c.id)}
              style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
            >
              {active ? (
                <LinearGradient
                  colors={[c.color, c.colorDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={faqViewStyles.chipActive}
                >
                  <Ionicons name={c.icon as never} size={13} color="#FFFFFF" />
                  <Text style={faqViewStyles.chipLabelActive}>{c.label}</Text>
                </LinearGradient>
              ) : (
                <View
                  style={[
                    faqViewStyles.chipInactive,
                    {
                      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F5F7FB",
                      borderColor: isDark ? "rgba(255,255,255,0.10)" : "#E4EAF4",
                    },
                  ]}
                >
                  <Ionicons name={c.icon as never} size={13} color={colors.mutedForeground} />
                  <Text style={[faqViewStyles.chipLabelInactive, { color: colors.mutedForeground }]}>
                    {c.label}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Category header */}
      <View style={[faqViewStyles.catHeader, { marginHorizontal: 16, marginBottom: 12 }]}>
        <View style={[faqViewStyles.catDot, { backgroundColor: cat.color }]} />
        <Text style={[faqViewStyles.catTitle, { color: colors.foreground }]}>
          {cat.label}
        </Text>
        <Text style={[faqViewStyles.catCount, { color: colors.mutedForeground }]}>
          {cat.items.length} سؤال
        </Text>
      </View>

      {/* Questions list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 2 }}
      >
        {cat.items.map((item, i) => (
          <QuestionCard
            key={`${cat.id}-${i}`}
            item={item}
            index={i}
            accentColor={cat.color}
            softColor={cat.colorSoft}
            isDark={isDark}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const faqViewStyles = StyleSheet.create({
  chipScroll: { borderBottomWidth: 1, maxHeight: 60 },
  chipRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  chipActive: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 22,
  },
  chipLabelActive: {
    fontFamily: "Cairo_700Bold",
    fontSize: 12,
    color: "#FFFFFF",
  },
  chipInactive: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 22,
    borderWidth: 1,
  },
  chipLabelInactive: {
    fontFamily: "Cairo_500Medium",
    fontSize: 12,
  },
  catHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catTitle: {
    fontFamily: "Cairo_700Bold",
    fontSize: 15,
    flex: 1,
    textAlign: "right",
    writingDirection: "rtl",
  },
  catCount: {
    fontFamily: "Cairo_400Regular",
    fontSize: 11,
  },
});

// ─── Chat View ────────────────────────────────────────────
function ChatView({ colors }: { colors: ReturnType<typeof useColors> }) {
  const settings = useSettings();
  const { setActiveMode } = useVpn();
  const isDark = colors.scheme === "dark";
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages, isTyping]);

  const addMsg = (m: Omit<Message, "id" | "timestamp">): Message => {
    const full: Message = { ...m, id: `${Date.now()}-${Math.random()}`, timestamp: new Date() };
    setMessages((p) => [...p, full]);
    return full;
  };

  const handleAction = useCallback(
    async (action: ActionButton) => {
      if (Platform.OS !== "web" && settings.hapticsEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
      addMsg({ role: "user", text: action.label });
      setIsTyping(true);

      if (action.mode) {
        await new Promise((r) => setTimeout(r, 900));
        setIsTyping(false);
        try {
          await setActiveMode(action.mode);
          addMsg({
            role: "assistant",
            text: `تم تفعيل ${MODES[action.mode].title} بنجاح ✅\n\nأنت الآن محمي بتشفير DoH.`,
          });
        } catch {
          addMsg({ role: "assistant", text: "تعذّر تفعيل الوضع. تأكد من أن التطبيق مثبّت كـ APK." });
        }
      } else {
        const rule = matchRule(action.label);
        await new Promise((r) => setTimeout(r, 900 + Math.random() * 400));
        setIsTyping(false);
        addMsg({
          role: "assistant",
          text: rule ? rule.response : "أخبرني أكثر حتى أتمكن من مساعدتك بشكل أفضل.",
          actions: rule?.actions,
        });
      }
    },
    [setActiveMode, settings.hapticsEnabled],
  );

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    if (Platform.OS !== "web" && settings.hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    addMsg({ role: "user", text });
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
    setIsTyping(false);
    const rule = matchRule(text);
    addMsg({
      role: "assistant",
      text: rule ? rule.response : "لم أفهم سؤالك تماماً 🤔\n\nجرّب أن تسأل مثلاً:\n• \"ما الوضع المناسب للألعاب؟\"\n• \"كيف أحجب الإعلانات؟\"\n• \"أريد أقصى خصوصية\"",
      actions: rule?.actions,
    });
  }, [input, settings.hapticsEnabled]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((m) => (
          <ChatBubble key={m.id} msg={m} colors={colors} onAction={handleAction} />
        ))}
        {isTyping && (
          <View style={[chatStyles.row, chatStyles.assistantRow]}>
            <LinearGradient colors={[colors.primary, colors.primaryDark]} style={chatStyles.avatar}>
              <Ionicons name="shield-checkmark" size={13} color="#FFF" />
            </LinearGradient>
            <View
              style={[
                chatStyles.bubble,
                {
                  backgroundColor: isDark ? colors.cardSolid : "#F0F5FF",
                  borderColor: isDark ? colors.cardBorder : "rgba(0,0,0,0.06)",
                  borderWidth: 1,
                },
              ]}
            >
              <TypingDots color={colors.primary} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick prompts */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[{ maxHeight: 52, borderTopWidth: 1, borderTopColor: colors.border }]}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 9, gap: 8, flexDirection: "row-reverse" }}
      >
        {QUICK_PROMPTS.map((p) => (
          <Pressable
            key={p}
            onPress={() => setInput(p)}
            style={({ pressed }) => [
              {
                backgroundColor: isDark ? colors.cardSolid : "#EBF5FF",
                borderColor: isDark ? colors.border : "rgba(0,180,255,0.22)",
                borderWidth: 1,
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 5,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={{ fontFamily: "Cairo_500Medium", fontSize: 11.5, color: colors.primary }}>
              {p}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Input */}
      <View
        style={[
          chatInputStyles.row,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: 12,
          },
        ]}
      >
        <Pressable
          onPress={handleSend}
          disabled={!input.trim()}
          style={({ pressed }) => [
            chatInputStyles.sendBtn,
            { backgroundColor: input.trim() ? colors.primary : colors.muted, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Ionicons name="arrow-up" size={20} color={input.trim() ? "#FFF" : colors.mutedForeground} />
        </Pressable>
        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          placeholder="اكتب سؤالك..."
          placeholderTextColor={colors.mutedForeground}
          style={[
            chatInputStyles.input,
            {
              backgroundColor: isDark ? colors.cardSolid : "#F2F6FF",
              color: colors.foreground,
              borderColor: colors.border,
            },
          ]}
          textAlign="right"
          multiline
          maxLength={300}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const chatInputStyles = StyleSheet.create({
  row: {
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: "Cairo_400Regular",
    fontSize: 13.5,
    maxHeight: 100,
    lineHeight: 20,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center",
  },
});

// ─── Main Screen ──────────────────────────────────────────
export default function AssistantScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDark = colors.scheme === "dark";
  const [tab, setTab] = useState<Tab>("chat");

  return (
    <View style={[mainStyles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          mainStyles.header,
          {
            paddingTop: insets.top + 10,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={mainStyles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              mainStyles.backBtn,
              { backgroundColor: colors.muted, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.foreground} />
          </Pressable>

          <View style={mainStyles.titleBlock}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={mainStyles.avatarCircle}
            >
              <Ionicons name="shield-checkmark" size={16} color="#FFF" />
            </LinearGradient>
            <View>
              <Text style={[mainStyles.title, { color: colors.foreground }]}>
                مساعد نداء شايلد
              </Text>
              <View style={mainStyles.onlineRow}>
                <View style={[mainStyles.dot, { backgroundColor: "#22C55E" }]} />
                <Text style={[mainStyles.onlineText, { color: colors.mutedForeground }]}>
                  متاح الآن
                </Text>
              </View>
            </View>
          </View>

          <View style={{ width: 38 }} />
        </View>

        {/* Tab bar */}
        <View style={[mainStyles.tabBar, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F0F4FA" }]}>
          {(["chat", "faq"] as Tab[]).map((t) => {
            const active = tab === t;
            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={[
                  mainStyles.tabBtn,
                  active && { backgroundColor: isDark ? colors.cardSolid : "#FFFFFF" },
                  active && {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    elevation: 2,
                  },
                ]}
              >
                <Ionicons
                  name={t === "chat" ? "chatbubble-ellipses" : "help-circle"}
                  size={14}
                  color={active ? colors.primary : colors.mutedForeground}
                />
                <Text
                  style={[
                    mainStyles.tabLabel,
                    { color: active ? colors.primary : colors.mutedForeground },
                    active && { fontFamily: "Cairo_700Bold" },
                  ]}
                >
                  {t === "chat" ? "المحادثة" : "الأسئلة الشائعة"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Content */}
      {tab === "chat" ? (
        <ChatView colors={colors} />
      ) : (
        <FAQView colors={colors} />
      )}
    </View>
  );
}

const mainStyles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
  },
  titleBlock: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  avatarCircle: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  title: {
    fontFamily: "Cairo_700Bold",
    fontSize: 15,
    textAlign: "right",
    writingDirection: "rtl",
  },
  onlineRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  onlineText: {
    fontFamily: "Cairo_400Regular",
    fontSize: 11,
  },
  tabBar: {
    flexDirection: "row-reverse",
    borderRadius: 14,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 11,
  },
  tabLabel: {
    fontFamily: "Cairo_500Medium",
    fontSize: 12.5,
  },
});
