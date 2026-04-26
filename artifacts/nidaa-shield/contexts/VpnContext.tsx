import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, Platform } from "react-native";

import {
  getCurrentSession,
  getVpnStats,
  isNativeAvailable,
  requestVpnPermission as requestPermissionNative,
  setNativeAutoStart,
  startVpnService,
  stopVpnService,
  type VpnStats as NativeVpnStats,
} from "nidaa-vpn";
import { showDialog } from "@/components/Dialog";
import { useSettings } from "@/contexts/SettingsContext";

export type ShieldMode =
  | "smart"
  | "gaming"
  | "family"
  | "military"
  | "custom"
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
    | "lock-closed"
    | "construct";
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
    shortDescription: "DNS سريع يقلّل تأخير الاستعلامات للألعاب",
    longDescription:
      "خادم DNS عالي السرعة من Cloudflare (1.1.1.1) لتقليل زمن استعلام النطاقات أثناء اللعب — مفيد لتسريع تحميل الموارد دون تغيير مسار الاتصال نفسه.",
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
  custom: {
    id: "custom",
    title: "الوضع المخصّص",
    shortDescription: "خادم DNS اخترته أنت من شاشة الإعدادات",
    longDescription:
      "يستخدم خادم DNS الذي حدّدته يدوياً من شاشة الإعدادات > خوادم DNS مخصّصة.",
    primaryDns: "0.0.0.0",
    protocol: "DNS",
    iconName: "construct",
  },
};

export type EngineStatus = "ready" | "missing-build" | "ios-unsupported";

export interface RuntimeStats {
  totalQueries: number;
  blockedQueries: number;
  forwardedQueries: number;
  dohQueries: number;
  averageLatencyMs: number;
  lastDomain: string | null;
  lastBlockedDomain: string | null;
  uptimeMs: number;
}

const EMPTY_STATS: RuntimeStats = {
  totalQueries: 0,
  blockedQueries: 0,
  forwardedQueries: 0,
  dohQueries: 0,
  averageLatencyMs: 0,
  lastDomain: null,
  lastBlockedDomain: null,
  uptimeMs: 0,
};

interface VpnState {
  activeMode: ShieldMode;
  isConnected: boolean;
  uptimeSeconds: number;
  engineStatus: EngineStatus;
  stats: RuntimeStats;
}

interface VpnContextValue extends VpnState {
  setActiveMode: (mode: ShieldMode) => Promise<void>;
  disconnect: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

const STORAGE_KEY = "@nidaa-shield/state-v1";

const VpnContext = createContext<VpnContextValue | undefined>(undefined);

function computeEngineStatus(): EngineStatus {
  if (Platform.OS === "android") {
    return isNativeAvailable ? "ready" : "missing-build";
  }
  if (Platform.OS === "ios") return "ios-unsupported";
  return "missing-build";
}

function nativeStatsToRuntime(s: NativeVpnStats | null): RuntimeStats {
  if (!s) return EMPTY_STATS;
  return {
    totalQueries: s.totalQueries,
    blockedQueries: s.blockedQueries,
    forwardedQueries: s.forwardedQueries,
    dohQueries: s.dohQueries,
    averageLatencyMs: s.averageLatencyMs,
    lastDomain: s.lastDomain,
    lastBlockedDomain: s.lastBlockedDomain,
    uptimeMs: s.uptimeMs,
  };
}

export function VpnProvider({ children }: { children: React.ReactNode }) {
  const settings = useSettings();
  const [activeMode, setActiveModeState] = useState<ShieldMode>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [uptimeSeconds, setUptimeSeconds] = useState(0);
  const [stats, setStats] = useState<RuntimeStats>(EMPTY_STATS);
  const [hydrated, setHydrated] = useState(false);
  const engineStatus = useMemo(computeEngineStatus, []);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hydrate persisted active mode + reconcile with native running state
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<VpnState>;
          if (parsed.activeMode) setActiveModeState(parsed.activeMode);
        }
      } catch {}
      if (engineStatus === "ready") {
        const session = await getCurrentSession();
        if (session.isRunning) {
          setIsConnected(true);
          if (session.modeId) {
            setActiveModeState(session.modeId as ShieldMode);
          }
        }
      }
      setHydrated(true);
    })();
  }, [engineStatus]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ activeMode })).catch(() => {});
  }, [activeMode, hydrated]);

  // Uptime ticker (UI side)
  useEffect(() => {
    if (!isConnected) {
      setUptimeSeconds(0);
      return;
    }
    const t = setInterval(() => setUptimeSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isConnected]);

  // Stats polling
  const refreshStats = useCallback(async () => {
    if (engineStatus !== "ready" || !isConnected) {
      setStats(EMPTY_STATS);
      return;
    }
    const s = await getVpnStats();
    setStats(nativeStatsToRuntime(s));
  }, [engineStatus, isConnected]);

  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (engineStatus === "ready" && isConnected) {
      refreshStats();
      pollRef.current = setInterval(refreshStats, 1500);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [engineStatus, isConnected, refreshStats]);

  // Refresh state when app returns to foreground (user may have toggled via quick-settings tile)
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (next) => {
      if (next === "active" && engineStatus === "ready") {
        const session = await getCurrentSession();
        setIsConnected(session.isRunning);
        if (session.modeId) setActiveModeState(session.modeId as ShieldMode);
        refreshStats();
      }
    });
    return () => sub.remove();
  }, [engineStatus, refreshStats]);

  // Mirror auto-start preference into native shared prefs
  useEffect(() => {
    if (engineStatus !== "ready" || !settings.hydrated) return;
    setNativeAutoStart(settings.autoStartOnBoot).catch(() => {});
  }, [engineStatus, settings.autoStartOnBoot, settings.hydrated]);

  const buildModeConfig = useCallback(
    (mode: Exclude<ShieldMode, null>) => {
      let primaryDns: string;
      let secondaryDns: string | undefined;
      let title: string;

      if (mode === "custom") {
        const sel = settings.customDnsServers.find(
          (c) => c.id === settings.selectedCustomDnsId,
        );
        if (!sel) throw new Error("لم تختر خادم DNS مخصّص بعد");
        primaryDns = sel.primary;
        secondaryDns = sel.secondary;
        title = sel.name || MODES.custom.title;
      } else {
        const def = MODES[mode];
        primaryDns = def.primaryDns;
        secondaryDns = def.secondaryDns;
        title = def.title;
      }

      // Military mode ALWAYS uses DoH — that's its core promise.
      // Other modes follow the user setting.
      const useDoH = mode === "military" ? true : settings.useDoH;

      return {
        sessionName: title,
        primaryDns,
        secondaryDns: secondaryDns ?? null,
        useDoH,
        modeId: mode,
        blocklist: settings.blocklist,
        whitelist: settings.whitelist,
        excludedApps: settings.excludedApps,
      };
    },
    [
      settings.customDnsServers,
      settings.selectedCustomDnsId,
      settings.useDoH,
      settings.blocklist,
      settings.whitelist,
      settings.excludedApps,
    ],
  );

  const setActiveMode = useCallback(
    async (mode: ShieldMode) => {
      if (mode === null) {
        if (engineStatus === "ready") await stopVpnService();
        setActiveModeState(null);
        setIsConnected(false);
        setUptimeSeconds(0);
        return;
      }

      if (engineStatus === "missing-build") {
        showDialog({
          title: "هذه نسخة معاينة فقط",
          message:
            "لتفعيل الحماية الفعلية على الهاتف يجب تثبيت ملف APK المبني عبر EAS Build. لا يمكن تفعيل خدمة VPN داخل Expo Go أو متصفح الويب.",
          icon: "construct",
          iconTint: "warning",
        });
        return;
      }

      if (engineStatus === "ios-unsupported") {
        showDialog({
          title: "غير مدعوم حالياً على iOS",
          message:
            "ميزة تغيير DNS على مستوى النظام تتطلب NetworkExtension entitlement من Apple. النسخة المدعومة حالياً هي Android فقط.",
          icon: "logo-apple",
          iconTint: "warning",
        });
        return;
      }

      try {
        const granted = await requestPermissionNative();
        if (!granted) {
          showDialog({
            title: "إذن الحماية مطلوب",
            message:
              "يجب السماح للتطبيق بإنشاء اتصال آمن لتفعيل الحماية. يُرجى الموافقة عند ظهور النافذة.",
            icon: "shield-half",
            iconTint: "warning",
          });
          return;
        }

        const config = buildModeConfig(mode);
        const ok = await startVpnService(config);
        if (!ok) {
          showDialog({
            title: "تعذّر تفعيل الحماية",
            message:
              "حدث خطأ أثناء بدء الحماية. تأكد من عدم وجود تطبيق VPN آخر مفعّل ثم حاول مرة أخرى.",
            icon: "alert-circle",
            iconTint: "danger",
          });
          return;
        }

        setActiveModeState(mode);
        setIsConnected(true);
        // Reset uptime so switching between modes restarts the counter.
        setUptimeSeconds(0);

        // Success haptic — long, rich pattern so user feels "the shield is up".
        if (Platform.OS !== "web" && settings.hapticsEnabled) {
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          ).catch(() => {});
        }
      } catch (e: any) {
        showDialog({
          title: "تعذّر تفعيل الحماية",
          message: e?.message
            ? `حدث خطأ: ${e.message}`
            : "حدث خطأ غير متوقع. حاول مرة أخرى.",
          icon: "alert-circle",
          iconTint: "danger",
        });
      }
    },
    [engineStatus, buildModeConfig, settings.hapticsEnabled],
  );

  const disconnect = useCallback(async () => {
    if (engineStatus === "ready") await stopVpnService();
    setActiveModeState(null);
    setIsConnected(false);
    setStats(EMPTY_STATS);
    if (Platform.OS !== "web" && settings.hapticsEnabled) {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning,
      ).catch(() => {});
    }
  }, [engineStatus, settings.hapticsEnabled]);

  const value = useMemo<VpnContextValue>(
    () => ({
      activeMode,
      isConnected,
      uptimeSeconds,
      engineStatus,
      stats,
      setActiveMode,
      disconnect,
      refreshStats,
    }),
    [
      activeMode,
      isConnected,
      uptimeSeconds,
      engineStatus,
      stats,
      setActiveMode,
      disconnect,
      refreshStats,
    ],
  );

  return <VpnContext.Provider value={value}>{children}</VpnContext.Provider>;
}

export function useVpn() {
  const ctx = useContext(VpnContext);
  if (!ctx) throw new Error("useVpn must be used inside VpnProvider");
  return ctx;
}
