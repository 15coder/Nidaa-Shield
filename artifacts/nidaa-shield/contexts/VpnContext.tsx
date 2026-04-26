import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import * as IntentLauncher from "expo-intent-launcher";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert, Linking, Platform } from "react-native";

export type ShieldMode =
  | "smart"
  | "gaming"
  | "family"
  | "military"
  | null;

export interface ModeDefinition {
  id: Exclude<ShieldMode, null>;
  title: string;
  shortDescription: string;
  longDescription: string;
  primaryDns: string;
  secondaryDns?: string;
  privateDnsHostname: string;
  protocol: "DNS" | "DoH" | "DoT";
  iconName:
    | "shield-checkmark"
    | "game-controller"
    | "people"
    | "lock-closed";
}

export const MODES: Record<Exclude<ShieldMode, null>, ModeDefinition> = {
  smart: {
    id: "smart",
    title: "الدرع الذكي",
    shortDescription: "حظر الإعلانات والتتبع على مستوى النظام",
    longDescription:
      "حظر الإعلانات على مستوى النظام بأكمله — بما فيها إعلانات تطبيقات التواصل ومنع تتبع البيانات بتقنية DNS Sinkholing.",
    primaryDns: "94.140.14.14",
    secondaryDns: "94.140.15.15",
    privateDnsHostname: "dns.adguard-dns.com",
    protocol: "DNS",
    iconName: "shield-checkmark",
  },
  gaming: {
    id: "gaming",
    title: "توربو الألعاب",
    shortDescription: "تقليل البينج لاستقرار الألعاب الأونلاين",
    longDescription:
      "توجيه منخفض التأخير عبر شبكة Cloudflare لتقليل البينج وضمان استقرار ألعاب الأونلاين كببجي وفري فاير.",
    primaryDns: "1.1.1.1",
    secondaryDns: "1.0.0.1",
    privateDnsHostname: "1dot1dot1dot1.cloudflare-dns.com",
    protocol: "DNS",
    iconName: "game-controller",
  },
  family: {
    id: "family",
    title: "حارس العائلة",
    shortDescription: "حجب المحتوى غير اللائق والمواقع الضارة",
    longDescription:
      "حجب فوري للمحتوى غير اللائق والمواقع الضارة عبر CleanBrowsing لضمان بيئة تصفح آمنة للأسرة.",
    primaryDns: "185.228.168.168",
    secondaryDns: "185.228.169.168",
    privateDnsHostname: "family-filter-dns.cleanbrowsing.org",
    protocol: "DNS",
    iconName: "people",
  },
  military: {
    id: "military",
    title: "الخصوصية العسكرية",
    shortDescription: "تشفير DNS بروتوكول HTTPS لمنع التتبع",
    longDescription:
      "تشفير كامل لطلبات الـ DNS عبر بروتوكول DNS-over-HTTPS لمنع مزود الخدمة من تتبع نشاطك.",
    primaryDns: "1.1.1.1",
    privateDnsHostname: "1dot1dot1dot1.cloudflare-dns.com",
    protocol: "DoH",
    iconName: "lock-closed",
  },
};

interface VpnState {
  activeMode: ShieldMode;
  isConnected: boolean;
  uptimeSeconds: number;
}

interface VpnContextValue extends VpnState {
  setActiveMode: (mode: ShieldMode) => Promise<void>;
  disconnect: () => Promise<void>;
  openPrivateDnsSettings: (mode: Exclude<ShieldMode, null>) => Promise<void>;
}

const STORAGE_KEY = "@nidaa-shield/state-v1";

const VpnContext = createContext<VpnContextValue | undefined>(undefined);

async function openAndroidPrivateDnsSettings() {
  if (Platform.OS !== "android") return;
  const candidates = [
    "android.settings.WIRELESS_SETTINGS",
    "android.settings.NETWORK_OPERATOR_SETTINGS",
    "android.settings.SETTINGS",
  ];
  for (const action of candidates) {
    try {
      await IntentLauncher.startActivityAsync(action);
      return;
    } catch {
      // try next
    }
  }
  try {
    await Linking.openSettings();
  } catch {}
}

async function applyPrivateDnsForMode(mode: Exclude<ShieldMode, null>) {
  const def = MODES[mode];
  try {
    await Clipboard.setStringAsync(def.privateDnsHostname);
  } catch {}

  if (Platform.OS !== "android") {
    Alert.alert(
      def.title,
      `هذا الوضع يفعّل الحماية عبر تقنية Private DNS على هاتف Android فقط.\n\nالخادم المعتمد:\n${def.privateDnsHostname}`,
    );
    return;
  }

  Alert.alert(
    `تفعيل ${def.title}`,
    `تم نسخ اسم الخادم تلقائياً:\n\n${def.privateDnsHostname}\n\nالخطوات:\n١. اضغط "فتح الإعدادات"\n٢. ادخل إلى: الشبكة والإنترنت ← Private DNS\n٣. اختر "اسم مضيف موفّر Private DNS"\n٤. الصق الاسم واضغط حفظ\n\nالحماية ستعمل فوراً على كل التطبيقات.`,
    [
      { text: "لاحقاً", style: "cancel" },
      {
        text: "فتح الإعدادات",
        style: "default",
        onPress: () => {
          openAndroidPrivateDnsSettings();
        },
      },
    ],
  );
}

export function VpnProvider({ children }: { children: React.ReactNode }) {
  const [activeMode, setActiveModeState] = useState<ShieldMode>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [uptimeSeconds, setUptimeSeconds] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<VpnState>;
          if (parsed.activeMode) {
            setActiveModeState(parsed.activeMode);
            setIsConnected(true);
          }
        }
      } catch {}
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ activeMode }),
    ).catch(() => {});
  }, [activeMode, hydrated]);

  useEffect(() => {
    if (!isConnected) return;
    const t = setInterval(() => {
      setUptimeSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [isConnected]);

  useEffect(() => {
    if (!isConnected) setUptimeSeconds(0);
  }, [isConnected]);

  const setActiveMode = useCallback(async (mode: ShieldMode) => {
    setActiveModeState(mode);
    setIsConnected(mode !== null);
    if (mode !== null) {
      await applyPrivateDnsForMode(mode);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setActiveModeState(null);
    setIsConnected(false);
    if (Platform.OS === "android") {
      Alert.alert(
        "إيقاف الحماية",
        'لإيقاف الحماية فعلياً:\n\nادخل إلى: الشبكة والإنترنت ← Private DNS\nثم اختر "تلقائي" أو "إيقاف".',
        [
          { text: "حسناً", style: "cancel" },
          {
            text: "فتح الإعدادات",
            style: "default",
            onPress: () => {
              openAndroidPrivateDnsSettings();
            },
          },
        ],
      );
    }
  }, []);

  const openPrivateDnsSettings = useCallback(
    async (mode: Exclude<ShieldMode, null>) => {
      await applyPrivateDnsForMode(mode);
    },
    [],
  );

  const value = useMemo<VpnContextValue>(
    () => ({
      activeMode,
      isConnected,
      uptimeSeconds,
      setActiveMode,
      disconnect,
      openPrivateDnsSettings,
    }),
    [
      activeMode,
      isConnected,
      uptimeSeconds,
      setActiveMode,
      disconnect,
      openPrivateDnsSettings,
    ],
  );

  return <VpnContext.Provider value={value}>{children}</VpnContext.Provider>;
}

export function useVpn() {
  const ctx = useContext(VpnContext);
  if (!ctx) throw new Error("useVpn must be used inside VpnProvider");
  return ctx;
}
