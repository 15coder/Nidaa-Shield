import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ShieldMode =
  | "smart"
  | "gaming"
  | "family"
  | "military"
  | null;

export interface ModeDefinition {
  id: Exclude<ShieldMode, null>;
  title: string;
  subtitle: string;
  description: string;
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
    subtitle: "حظر الإعلانات والتتبع",
    description:
      "حظر الإعلانات على مستوى النظام بأكمله — بما فيها إعلانات تطبيقات التواصل ومنع تتبع البيانات بتقنية DNS Sinkholing.",
    primaryDns: "94.140.14.14",
    secondaryDns: "94.140.15.15",
    protocol: "DNS",
    iconName: "shield-checkmark",
  },
  gaming: {
    id: "gaming",
    title: "توربو الألعاب",
    subtitle: "تقليل التأخير وتحسين الأداء",
    description:
      "توجيه منخفض التأخير عبر شبكة Cloudflare لتقليل البينج وضمان استقرار ألعاب الأونلاين كببجي وفري فاير.",
    primaryDns: "1.1.1.1",
    secondaryDns: "1.0.0.1",
    protocol: "DNS",
    iconName: "game-controller",
  },
  family: {
    id: "family",
    title: "حارس العائلة",
    subtitle: "حماية بيئية متكاملة",
    description:
      "حجب فوري للمحتوى غير اللائق والمواقع الضارة عبر CleanBrowsing لضمان بيئة تصفح آمنة للأسرة.",
    primaryDns: "185.228.168.168",
    secondaryDns: "185.228.169.168",
    protocol: "DNS",
    iconName: "people",
  },
  military: {
    id: "military",
    title: "الخصوصية العسكرية",
    subtitle: "تشفير عسكري لطلبات الـ DNS",
    description:
      "تشفير كامل لطلبات الـ DNS عبر بروتوكول DNS-over-HTTPS لمنع مزود الخدمة من تتبع نشاطك.",
    primaryDns: "1.1.1.1",
    protocol: "DoH",
    iconName: "lock-closed",
  },
};

interface VpnState {
  activeMode: ShieldMode;
  isConnected: boolean;
  hasVpnPermission: boolean;
  bytesBlocked: number;
  uptimeSeconds: number;
}

interface VpnContextValue extends VpnState {
  setActiveMode: (mode: ShieldMode) => Promise<void>;
  requestVpnPermission: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const STORAGE_KEY = "@nidaa-shield/state-v1";

const VpnContext = createContext<VpnContextValue | undefined>(undefined);

export function VpnProvider({ children }: { children: React.ReactNode }) {
  const [activeMode, setActiveModeState] = useState<ShieldMode>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasVpnPermission, setHasVpnPermission] = useState(false);
  const [bytesBlocked, setBytesBlocked] = useState(0);
  const [uptimeSeconds, setUptimeSeconds] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from local storage (mimics Hive auto-restore on boot)
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<VpnState>;
          if (parsed.activeMode) setActiveModeState(parsed.activeMode);
          if (parsed.hasVpnPermission)
            setHasVpnPermission(parsed.hasVpnPermission);
          if (parsed.bytesBlocked) setBytesBlocked(parsed.bytesBlocked);
          if (parsed.activeMode && parsed.hasVpnPermission) {
            setIsConnected(true);
          }
        }
      } catch {}
      setHydrated(true);
    })();
  }, []);

  // Persist
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activeMode,
        hasVpnPermission,
        bytesBlocked,
      }),
    ).catch(() => {});
  }, [activeMode, hasVpnPermission, bytesBlocked, hydrated]);

  // Connection telemetry simulator (uptime + blocked counter)
  useEffect(() => {
    if (!isConnected) return;
    const t = setInterval(() => {
      setUptimeSeconds((s) => s + 1);
      setBytesBlocked((b) => b + Math.floor(Math.random() * 1024 * 4));
    }, 1000);
    return () => clearInterval(t);
  }, [isConnected]);

  // Reset uptime when disconnected
  useEffect(() => {
    if (!isConnected) setUptimeSeconds(0);
  }, [isConnected]);

  const requestVpnPermission = useCallback(async () => {
    // In a native build this would trigger VpnService.prepare(). Here we simulate
    // the in-app consent flow described in the spec — instant approval, no exit.
    await new Promise((r) => setTimeout(r, 300));
    setHasVpnPermission(true);
  }, []);

  const setActiveMode = useCallback(
    async (mode: ShieldMode) => {
      if (!hasVpnPermission && mode !== null) {
        await requestVpnPermission();
      }
      setActiveModeState(mode);
      setIsConnected(mode !== null);
    },
    [hasVpnPermission, requestVpnPermission],
  );

  const disconnect = useCallback(async () => {
    setActiveModeState(null);
    setIsConnected(false);
  }, []);

  const value = useMemo<VpnContextValue>(
    () => ({
      activeMode,
      isConnected,
      hasVpnPermission,
      bytesBlocked,
      uptimeSeconds,
      setActiveMode,
      requestVpnPermission,
      disconnect,
    }),
    [
      activeMode,
      isConnected,
      hasVpnPermission,
      bytesBlocked,
      uptimeSeconds,
      setActiveMode,
      requestVpnPermission,
      disconnect,
    ],
  );

  return <VpnContext.Provider value={value}>{children}</VpnContext.Provider>;
}

export function useVpn() {
  const ctx = useContext(VpnContext);
  if (!ctx) throw new Error("useVpn must be used inside VpnProvider");
  return ctx;
}
