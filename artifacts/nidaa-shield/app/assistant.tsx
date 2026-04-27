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
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/contexts/SettingsContext";
import { useVpn, MODES, type ShieldMode } from "@/contexts/VpnContext";
import { showAppToast } from "@/components/AppToast";

type Role = "assistant" | "user";

interface ActionButton {
  label: string;
  mode?: Exclude<ShieldMode, null>;
  onPress?: () => void;
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

const RULES: KnowledgeRule[] = [
  {
    keywords: ["مرحبا", "هلا", "اهلا", "أهلا", "السلام", "كيف حالك", "صباح", "مساء"],
    response:
      "أهلاً بك! أنا مساعد نداء شايلد 🛡️\n\nأستطيع مساعدتك في:\n• اختيار وضع الحماية المناسب\n• شرح تقنيات DoH والخصوصية\n• الإجابة على أسئلتك عن الأمان الرقمي\n\nبماذا يمكنني خدمتك اليوم؟",
  },
  {
    keywords: ["إعلانات", "اعلانات", "إعلان", "اعلان", "اعلاناً", "تتبع", "متتبع", "بلوك", "حجب إعلان"],
    response:
      "لحجب الإعلانات والمتتبعين أنصحك بـ **الدرع الذكي** 🛡️\n\nيستخدم خوادم AdGuard DNS over HTTPS لفلترة الإعلانات على مستوى النظام بأكمله — بما فيها إعلانات التطبيقات التي لا تستطيع أي أداة أخرى حجبها.",
    actions: [{ label: "تفعيل الدرع الذكي", mode: "smart" }],
  },
  {
    keywords: ["العاب", "ألعاب", "لعب", "لاغ", "ping", "بطيء", "سرعة", "فورتنايت", "ببجي", "تأخير", "استجابة", "اون لاين"],
    response:
      "للألعاب عليك **توربو الألعاب** 🎮\n\nيعتمد على Cloudflare DNS (one.one.one.one) عبر DoH — أسرع خوادم DNS في العالم بمتوسط استجابة أقل من 10ms، مما يقلل الـ Ping بشكل ملحوظ.",
    actions: [{ label: "تفعيل توربو الألعاب", mode: "gaming" }],
  },
  {
    keywords: ["اطفال", "أطفال", "ولد", "بنت", "ابن", "ابنة", "عائلة", "أسرة", "اسرة", "محتوى", "ابوي", "أبوي", "رقابة", "يوتيوب"],
    response:
      "**حارس العائلة** هو خيارك 👨‍👩‍👧\n\nيستخدم AdGuard Family DNS لـ:\n• حجب تلقائي للمحتوى الإباحي وغير اللائق\n• تفعيل البحث الآمن في يوتيوب وجوجل\n• حماية شاملة لجميع أجهزة الشبكة",
    actions: [{ label: "تفعيل حارس العائلة", mode: "family" }],
  },
  {
    keywords: ["خصوصية", "تجسس", "تشفير", "مراقبة", "اخفاء", "إخفاء", "هوية", "بيانات", "مزود", "isp", "امن", "أمن", "حماية كاملة"],
    response:
      "**الخصوصية العسكرية** هي أقصى درجات الحماية 🔒\n\nتستخدم Quad9 DNS over HTTPS بمعايير DNSSEC لـ:\n• إخفاء نشاطك عن مزود الإنترنت بالكامل\n• منع هجمات Man-in-the-Middle\n• حجب النطاقات الخبيثة المعروفة عالمياً",
    actions: [{ label: "تفعيل الخصوصية العسكرية", mode: "military" }],
  },
  {
    keywords: ["ما الفرق", "الفرق", "أيهم", "أيهما", "اختر", "وضع", "أنسب", "انسب", "يناسب", "موصى", "توصي"],
    response:
      "مقارنة الأوضاع الأربعة:\n\n🛡️ **الدرع الذكي** — حجب إعلانات ومتتبعين\n🎮 **توربو الألعاب** — سرعة وPing منخفض\n👨‍👩‍👧 **حارس العائلة** — رقابة أبوية شاملة\n🔒 **الخصوصية العسكرية** — تشفير أقصى\n\nجميعها تستخدم DoH (DNS over HTTPS). أخبرني أكثر عن احتياجاتك لأحدد الأنسب.",
  },
  {
    keywords: ["doh", "dns", "بروتوكول", "https", "تقنية", "كيف يعمل", "ماهو", "ما هو"],
    response:
      "**DNS over HTTPS (DoH)** هو البروتوكول الذي يحمي طلبات DNS:\n\n🔐 بدون DoH: مزود الإنترنت يرى كل موقع تزوره\n✅ مع DoH: الطلبات مشفرة بـ HTTPS — لا أحد يستطيع قراءتها\n\nnداء شايلد يستخدم DoH في جميع الأوضاع الأربعة تلقائياً.",
  },
  {
    keywords: ["vpn", "في بي ان", "شبكة خاصة"],
    response:
      "نداء شايلد يعمل كـ **Local VPN** — أي أنه يُنشئ نفقاً محلياً (Tunnel) على جهازك لتوجيه طلبات DNS فقط من خلاله.\n\nهذا يختلف عن VPN التقليدي:\n• VPN عادي: يُوجّه كل ترافيك الإنترنت\n• نداء شايلد: يُوجّه DNS فقط — أسرع وأقل استهلاكاً للبطارية",
  },
  {
    keywords: ["توقف", "ايقاف", "أوقف", "وقف", "تعطيل"],
    response:
      "لإيقاف الحماية، اضغط على الوضع المفعّل في الشاشة الرئيسية وسيتوقف تلقائياً، أو اضغط على \"إيقاف\" في إشعار الحماية في شريط الإشعارات.",
  },
  {
    keywords: ["بطارية", "استهلاك", "شحن"],
    response:
      "نداء شايلد مُصمّم ليكون خفيفاً على البطارية 🔋\n\nيُوجّه DNS فقط (ليس كل ترافيك الإنترنت)، مما يعني:\n• استهلاك CPU شبه صفري في وضع الخمول\n• استهلاك بطارية أقل من 1% يومياً في الاستخدام العادي",
  },
  {
    keywords: ["شكرا", "شكراً", "مشكور", "ممتاز", "رائع", "ممتنن"],
    response:
      "العفو! سعيد بخدمتك 😊\n\nإذا احتجت أي مساعدة أخرى في الأمان الرقمي أو اختيار الوضع المناسب، أنا هنا دائماً.",
  },
];

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  text: "مرحباً! أنا مساعد نداء شايلد الذكي 🛡️\n\nيمكنني مساعدتك في اختيار وضع الحماية المناسب، شرح تقنيات الأمان، أو الإجابة على أي سؤال يخص خصوصيتك الرقمية.\n\nاكتب سؤالك بالعربية وسأجيبك فوراً.",
  actions: [
    { label: "اختر لي الوضع المناسب", mode: undefined },
    { label: "ما الفرق بين الأوضاع؟", mode: undefined },
  ],
  timestamp: new Date(),
};

function matchRule(text: string): KnowledgeRule | null {
  const lower = text.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule;
    }
  }
  return null;
}

function buildFallback(text: string): string {
  return "لم أفهم سؤالك بشكل كامل 🤔\n\nجرّب أن تسألني عن:\n• \"ما الوضع المناسب للألعاب؟\"\n• \"كيف أحجب الإعلانات؟\"\n• \"ما هو DoH؟\"\n• \"كيف أحمي أطفالي؟\"";
}

function TypingIndicator({ color }: { color: string }) {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={typingStyles.row}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            typingStyles.dot,
            { backgroundColor: color, opacity: dot, transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] },
          ]}
        />
      ))}
    </View>
  );
}

const typingStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 5, paddingVertical: 8, paddingHorizontal: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

interface BubbleProps {
  msg: Message;
  colors: ReturnType<typeof useColors>;
  onAction: (action: ActionButton) => void;
}

function Bubble({ msg, colors, onAction }: BubbleProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const slideX = useRef(new Animated.Value(msg.role === "user" ? 20 : -20)).current;
  const isDark = colors.scheme === "dark";
  const isUser = msg.role === "user";

  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideX, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const userBg = colors.primary;
  const assistantBg = isDark ? colors.cardSolid : "#F0F4FC";
  const assistantBorder = isDark ? colors.cardBorder : "rgba(0,0,0,0.07)";

  return (
    <Animated.View
      style={[
        bubbleStyles.container,
        isUser ? bubbleStyles.userContainer : bubbleStyles.assistantContainer,
        { opacity: anim, transform: [{ translateX: slideX }] },
      ]}
    >
      {!isUser && (
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={bubbleStyles.avatar}
        >
          <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
        </LinearGradient>
      )}
      <View style={bubbleStyles.bubbleCol}>
        <View
          style={[
            bubbleStyles.bubble,
            isUser
              ? [bubbleStyles.userBubble, { backgroundColor: userBg }]
              : [bubbleStyles.assistantBubble, { backgroundColor: assistantBg, borderColor: assistantBorder }],
          ]}
        >
          <Text
            style={[
              bubbleStyles.text,
              {
                color: isUser ? "#FFFFFF" : colors.foreground,
                textAlign: "right",
                writingDirection: "rtl",
              },
            ]}
          >
            {msg.text}
          </Text>
        </View>

        {msg.actions && msg.actions.length > 0 && (
          <View style={bubbleStyles.actions}>
            {msg.actions.map((action, idx) => (
              <Pressable
                key={idx}
                onPress={() => onAction(action)}
                style={({ pressed }) => [
                  bubbleStyles.actionBtn,
                  {
                    backgroundColor: isDark ? colors.cardSolid : "#FFFFFF",
                    borderColor: colors.primary,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons name="flash" size={12} color={colors.primary} />
                <Text style={[bubbleStyles.actionLabel, { color: colors.primary }]}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const bubbleStyles = StyleSheet.create({
  container: {
    marginBottom: 14,
    paddingHorizontal: 16,
  },
  userContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  assistantContainer: {
    flexDirection: "row-reverse",
    justifyContent: "flex-start",
  },
  bubbleCol: {
    maxWidth: "82%",
    alignItems: "flex-end",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    flexShrink: 0,
    alignSelf: "flex-end",
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    borderBottomLeftRadius: 4,
  },
  assistantBubble: {
    borderBottomRightRadius: 4,
    borderWidth: 1,
  },
  text: {
    fontFamily: "Cairo_400Regular",
    fontSize: 13.5,
    lineHeight: 22,
  },
  actions: {
    marginTop: 8,
    gap: 6,
    alignItems: "flex-end",
  },
  actionBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  actionLabel: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 12,
  },
});

const QUICK_PROMPTS = [
  "ما الوضع المناسب للألعاب؟",
  "كيف أحجب الإعلانات؟",
  "حماية الأطفال",
  "ما هو DoH؟",
  "أريد أقصى خصوصية",
];

export default function AssistantScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const settings = useSettings();
  const { setActiveMode } = useVpn();
  const isDark = colors.scheme === "dark";

  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages, isTyping]);

  const addMessage = (msg: Omit<Message, "id" | "timestamp">) => {
    const full: Message = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, full]);
    return full;
  };

  const handleAction = useCallback(
    async (action: ActionButton) => {
      if (Platform.OS !== "web" && settings.hapticsEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }

      if (action.mode) {
        addMessage({ role: "user", text: action.label });
        setIsTyping(true);
        await new Promise((r) => setTimeout(r, 900));
        setIsTyping(false);

        try {
          await setActiveMode(action.mode);
          addMessage({
            role: "assistant",
            text: `تم تفعيل ${MODES[action.mode].title} بنجاح! ✅\n\nأنت الآن محمي بتشفير DoH عبر ${action.mode === "smart" ? "AdGuard" : action.mode === "gaming" ? "Cloudflare" : action.mode === "family" ? "AdGuard Family" : "Quad9"}.`,
          });
        } catch {
          addMessage({
            role: "assistant",
            text: "تعذّر تفعيل الوضع. تأكد من أن التطبيق مثبّت كـ APK وليس من خلال Expo Go.",
          });
        }
      } else {
        const rule = matchRule(action.label);
        addMessage({ role: "user", text: action.label });
        setIsTyping(true);
        await new Promise((r) => setTimeout(r, 1000));
        setIsTyping(false);
        addMessage({
          role: "assistant",
          text: rule ? rule.response : buildFallback(action.label),
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

    addMessage({ role: "user", text });

    setIsTyping(true);
    const delay = 800 + Math.random() * 600;
    await new Promise((r) => setTimeout(r, delay));
    setIsTyping(false);

    const rule = matchRule(text);
    addMessage({
      role: "assistant",
      text: rule ? rule.response : buildFallback(text),
      actions: rule?.actions,
    });
  }, [input, settings.hapticsEnabled]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={
          isDark
            ? ["#0D1520", colors.background]
            : ["#EBF5FF", colors.background]
        }
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: colors.muted, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.foreground} />
          </Pressable>

          <View style={styles.headerCenter}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.headerAvatar}
            >
              <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
            </LinearGradient>
            <View>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                مساعد نداء شايلد
              </Text>
              <View style={styles.onlineRow}>
                <View style={[styles.onlineDot, { backgroundColor: "#2ECC71" }]} />
                <Text style={[styles.onlineLabel, { color: colors.mutedForeground }]}>
                  متاح الآن
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => (
            <Bubble key={msg.id} msg={msg} colors={colors} onAction={handleAction} />
          ))}

          {isTyping && (
            <View style={[bubbleStyles.container, bubbleStyles.assistantContainer]}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={bubbleStyles.avatar}
              >
                <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
              </LinearGradient>
              <View
                style={[
                  bubbleStyles.bubble,
                  bubbleStyles.assistantBubble,
                  {
                    backgroundColor: isDark ? colors.cardSolid : "#F0F4FC",
                    borderColor: isDark ? colors.cardBorder : "rgba(0,0,0,0.07)",
                  },
                ]}
              >
                <TypingIndicator color={colors.primary} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick prompts */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.quickScroll, { borderTopColor: colors.border }]}
          contentContainerStyle={styles.quickContent}
        >
          {QUICK_PROMPTS.map((p) => (
            <Pressable
              key={p}
              onPress={() => {
                setInput(p);
              }}
              style={({ pressed }) => [
                styles.quickChip,
                {
                  backgroundColor: isDark ? colors.cardSolid : "#EBF5FF",
                  borderColor: isDark ? colors.border : "rgba(0, 180, 255, 0.25)",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={[styles.quickChipText, { color: colors.primary }]}>
                {p}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Input */}
        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + 8,
            },
          ]}
        >
          <Pressable
            onPress={handleSend}
            disabled={!input.trim()}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: input.trim() ? colors.primary : colors.muted,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons
              name="arrow-up"
              size={20}
              color={input.trim() ? "#FFFFFF" : colors.mutedForeground}
            />
          </Pressable>

          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            placeholder="اكتب سؤالك هنا..."
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              {
                backgroundColor: isDark ? colors.cardSolid : "#F0F4FC",
                color: colors.foreground,
                borderColor: colors.border,
              },
            ]}
            textAlign="right"
            multiline
            maxLength={300}
            returnKeyType="send"
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
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
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  onlineLabel: {
    fontFamily: "Cairo_400Regular",
    fontSize: 11,
  },
  headerRight: {
    width: 38,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  quickScroll: {
    borderTopWidth: 1,
    maxHeight: 54,
  },
  quickContent: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickChipText: {
    fontFamily: "Cairo_500Medium",
    fontSize: 12,
  },
  inputRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 10,
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
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
});
