import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { AccentName } from "@/constants/colors";
import {
  YOUTUBE_AD_DOMAINS,
  YOUTUBE_BLOCKLIST_VERSION,
} from "@/constants/youtubeBlocklist";

export type ThemeMode = "system" | "light" | "dark";

export interface CustomDnsServer {
  id: string;
  name: string;
  primary: string;
  secondary?: string;
}

export interface SettingsState {
  themeMode: ThemeMode;
  accentColor: AccentName;
  customDnsServers: CustomDnsServer[];
  selectedCustomDnsId: string | null;
  blocklist: string[];
  whitelist: string[];
  excludedApps: string[];
  autoStartOnBoot: boolean;
  useDoH: boolean;
  hapticsEnabled: boolean;
  blockYoutubeAds: boolean;
  youtubeBlocklistVersion: number;
  onboardingCompleted: boolean;
  firstConnectionShown: boolean;
  hasMigrated: boolean;
}

const DEFAULT_STATE: SettingsState = {
  themeMode: "light",
  accentColor: "cyan",
  customDnsServers: [],
  selectedCustomDnsId: null,
  blocklist: [],
  whitelist: [],
  excludedApps: [],
  autoStartOnBoot: false,
  useDoH: true,
  hapticsEnabled: true,
  blockYoutubeAds: true,
  youtubeBlocklistVersion: 0,
  onboardingCompleted: false,
  firstConnectionShown: false,
  hasMigrated: true,
};

const STORAGE_KEY = "@nidaa-shield/settings-v1";

interface SettingsContextValue extends SettingsState {
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setAccentColor: (color: AccentName) => Promise<void>;
  addCustomDns: (server: Omit<CustomDnsServer, "id">) => Promise<CustomDnsServer>;
  removeCustomDns: (id: string) => Promise<void>;
  selectCustomDns: (id: string | null) => Promise<void>;
  addToBlocklist: (domain: string) => Promise<void>;
  removeFromBlocklist: (domain: string) => Promise<void>;
  addToWhitelist: (domain: string) => Promise<void>;
  removeFromWhitelist: (domain: string) => Promise<void>;
  setExcludedApps: (apps: string[]) => Promise<void>;
  setAutoStartOnBoot: (enabled: boolean) => Promise<void>;
  setUseDoH: (enabled: boolean) => Promise<void>;
  setHapticsEnabled: (enabled: boolean) => Promise<void>;
  setBlockYoutubeAds: (enabled: boolean) => Promise<void>;
  setOnboardingCompleted: (done: boolean) => Promise<void>;
  setFirstConnectionShown: (done: boolean) => Promise<void>;
  resetAll: () => Promise<void>;
  hydrated: boolean;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

function normalizeDomain(d: string): string {
  return d
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

/**
 * Returns blocklist with YouTube ad domains injected if `blockYoutubeAds`
 * is enabled, deduplicated. Used internally before persisting/sending to native.
 */
function effectiveBlocklist(
  userBlocklist: string[],
  blockYoutubeAds: boolean,
): string[] {
  if (!blockYoutubeAds) return userBlocklist;
  const merged = new Set<string>(userBlocklist);
  for (const d of YOUTUBE_AD_DOMAINS) merged.add(d);
  return Array.from(merged);
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SettingsState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<SettingsState>;
          setState((s) => ({ ...s, ...parsed }));
        }
      } catch {}
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, hydrated]);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setState((s) => ({ ...s, themeMode: mode }));
  }, []);

  const setAccentColor = useCallback(async (color: AccentName) => {
    setState((s) => ({ ...s, accentColor: color }));
  }, []);

  const addCustomDns = useCallback(
    async (server: Omit<CustomDnsServer, "id">) => {
      const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const newServer: CustomDnsServer = { id, ...server };
      setState((s) => ({
        ...s,
        customDnsServers: [...s.customDnsServers, newServer],
      }));
      return newServer;
    },
    [],
  );

  const removeCustomDns = useCallback(async (id: string) => {
    setState((s) => ({
      ...s,
      customDnsServers: s.customDnsServers.filter((c) => c.id !== id),
      selectedCustomDnsId: s.selectedCustomDnsId === id ? null : s.selectedCustomDnsId,
    }));
  }, []);

  const selectCustomDns = useCallback(async (id: string | null) => {
    setState((s) => ({ ...s, selectedCustomDnsId: id }));
  }, []);

  const addToBlocklist = useCallback(async (domain: string) => {
    const norm = normalizeDomain(domain);
    if (!norm) return;
    setState((s) =>
      s.blocklist.includes(norm) ? s : { ...s, blocklist: [...s.blocklist, norm] },
    );
  }, []);

  const removeFromBlocklist = useCallback(async (domain: string) => {
    setState((s) => ({ ...s, blocklist: s.blocklist.filter((d) => d !== domain) }));
  }, []);

  const addToWhitelist = useCallback(async (domain: string) => {
    const norm = normalizeDomain(domain);
    if (!norm) return;
    setState((s) =>
      s.whitelist.includes(norm) ? s : { ...s, whitelist: [...s.whitelist, norm] },
    );
  }, []);

  const removeFromWhitelist = useCallback(async (domain: string) => {
    setState((s) => ({ ...s, whitelist: s.whitelist.filter((d) => d !== domain) }));
  }, []);

  const setExcludedApps = useCallback(async (apps: string[]) => {
    setState((s) => ({ ...s, excludedApps: apps }));
  }, []);

  const setAutoStartOnBoot = useCallback(async (enabled: boolean) => {
    setState((s) => ({ ...s, autoStartOnBoot: enabled }));
  }, []);

  const setUseDoH = useCallback(async (enabled: boolean) => {
    setState((s) => ({ ...s, useDoH: enabled }));
  }, []);

  const setHapticsEnabled = useCallback(async (enabled: boolean) => {
    setState((s) => ({ ...s, hapticsEnabled: enabled }));
  }, []);

  const setBlockYoutubeAds = useCallback(async (enabled: boolean) => {
    setState((s) => ({
      ...s,
      blockYoutubeAds: enabled,
      youtubeBlocklistVersion: enabled ? YOUTUBE_BLOCKLIST_VERSION : 0,
    }));
  }, []);

  const setOnboardingCompleted = useCallback(async (done: boolean) => {
    setState((s) => ({ ...s, onboardingCompleted: done }));
  }, []);

  const setFirstConnectionShown = useCallback(async (done: boolean) => {
    setState((s) => ({ ...s, firstConnectionShown: done }));
  }, []);

  const resetAll = useCallback(async () => {
    setState({ ...DEFAULT_STATE, onboardingCompleted: true });
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...state,
      // expose the merged YouTube-aware blocklist as `blocklist`
      blocklist: effectiveBlocklist(state.blocklist, state.blockYoutubeAds),
      hydrated,
      setThemeMode,
      setAccentColor,
      addCustomDns,
      removeCustomDns,
      selectCustomDns,
      addToBlocklist,
      removeFromBlocklist,
      addToWhitelist,
      removeFromWhitelist,
      setExcludedApps,
      setAutoStartOnBoot,
      setUseDoH,
      setHapticsEnabled,
      setBlockYoutubeAds,
      setOnboardingCompleted,
      setFirstConnectionShown,
      resetAll,
    }),
    [
      state,
      hydrated,
      setThemeMode,
      setAccentColor,
      addCustomDns,
      removeCustomDns,
      selectCustomDns,
      addToBlocklist,
      removeFromBlocklist,
      addToWhitelist,
      removeFromWhitelist,
      setExcludedApps,
      setAutoStartOnBoot,
      setUseDoH,
      setHapticsEnabled,
      setBlockYoutubeAds,
      setOnboardingCompleted,
      setFirstConnectionShown,
      resetAll,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}

/**
 * Returns the user-defined blocklist WITHOUT the auto-injected YouTube ads.
 * Useful for the blocklist editor UI so the user only sees their own entries.
 */
export function useUserBlocklist(): string[] {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useUserBlocklist must be used inside SettingsProvider");
  // strip injected YT domains so the editor only manages user-added entries
  return ctx.blocklist.filter((d) => !YOUTUBE_AD_DOMAINS.includes(d));
}
