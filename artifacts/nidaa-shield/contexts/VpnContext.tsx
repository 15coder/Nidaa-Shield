import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert, Platform } from "react-native";

import {
  isNativeAvailable,
  requestVpnPermission as requestPermissionNative,
  startVpnService,
  stopVpnService,
} from "nidaa-vpn";

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
    secondaryDns: "1.0.0.1",
    protocol: "DoH",
    iconName: "lock-closed",
  },
};

export type EngineStatus =
  | "ready"          // Native VPN engine loaded — full functionality available
  | "missing-build" // Running in Expo Go or web — native module not bundled
  | "ios-unsupported"; // iOS — system-wide DNS not supported here yet

interface VpnState {
  activeMode: ShieldMode;
  isConnected: boolean;
  uptimeSeconds: number;
  engineStatus: EngineStatus;
}

interface VpnContextValue extends VpnState {
  setActiveMode: (mode: ShieldMode) => Promise<void>;
  disconnect: () => Promise<void>;
}

const STORAGE_KEY = "@nidaa-shield/state-v1";

const VpnContext = createContext<VpnContextValue | undefined>(undefined);

function computeEngineStatus(): EngineStatus {
  if (Platform.OS === "android") {
    return isNativeAvailable ? "ready" : "missing-build";
  }
  if (Platform.OS === "ios") {
    return "ios-unsupported";
  }
  return "missing-build";
}

export function VpnProvider({ children }: { children: React.ReactNode }) {
  const [activeMode, setActiveModeState] = useState<ShieldMode>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [uptimeSeconds, setUptimeSeconds] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const engineStatus = useMemo(computeEngineStatus, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<VpnState>;
          if (parsed.activeMode) {
            setActiveModeState(parsed.activeMode);
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

  const setActiveMode = useCallback(
    async (mode: ShieldMode) => {
      if (mode === null) {
        if (engineStatus === "ready") {
          await stopVpnService();
        }
        setActiveModeState(null);
        setIsConnected(false);
        return;
      }

      if (engineStatus === "missing-build") {
        Alert.alert(
          "هذه نسخة معاينة فقط",
          "لتفعيل الحماية الفعلية على الهاتف يجب تثبيت ملف APK المبني عبر EAS Build (راجع ملف BUILD_FROM_PHONE.md). لا يمكن تفعيل خدمة VPN داخل Expo Go أو متصفح الويب.",
        );
        return;
      }

      if (engineStatus === "ios-unsupported") {
        Alert.alert(
          "غير مدعوم حالياً على iOS",
          "ميزة تغيير DNS على مستوى النظام تتطلب NetworkExtension entitlement من Apple. النسخة المدعومة حالياً هي Android فقط.",
        );
        return;
      }

      const def = MODES[mode];

      try {
        const granted = await requestPermissionNative();
        if (!granted) {
          Alert.alert(
            "إذن الحماية مطلوب",
            "يجب السماح للتطبيق بإنشاء اتصال آمن لتفعيل الحماية. يُرجى الموافقة عند ظهور النافذة.",
          );
          return;
        }

        const ok = await startVpnService(
          def.title,
          def.primaryDns,
          def.secondaryDns ?? null,
        );

        if (!ok) {
          Alert.alert(
            "تعذر تفعيل الحماية",
            "حدث خطأ أثناء بدء الحماية. تأكد من عدم وجود تطبيق VPN آخر مفعّل، ثم حاول مرة أخرى.",
          );
          return;
        }

        setActiveModeState(mode);
        setIsConnected(true);
      } catch (e: any) {
        Alert.alert(
          "تعذر تفعيل الحماية",
          e?.message
            ? `حدث خطأ: ${e.message}`
            : "حدث خطأ غير متوقع. حاول مرة أخرى.",
        );
      }
    },
    [engineStatus],
  );

  const disconnect = useCallback(async () => {
    if (engineStatus === "ready") {
      await stopVpnService();
    }
    setActiveModeState(null);
    setIsConnected(false);
  }, [engineStatus]);

  const value = useMemo<VpnContextValue>(
    () => ({
      activeMode,
      isConnected,
      uptimeSeconds,
      engineStatus,
      setActiveMode,
      disconnect,
    }),
    [activeMode, isConnected, uptimeSeconds, engineStatus, setActiveMode, disconnect],
  );

  return <VpnContext.Provider value={value}>{children}</VpnContext.Provider>;
}

export function useVpn() {
  const ctx = useContext(VpnContext);
  if (!ctx) throw new Error("useVpn must be used inside VpnProvider");
  return ctx;
}
