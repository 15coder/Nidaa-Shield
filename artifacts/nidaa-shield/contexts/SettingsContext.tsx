import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemeMode = "system" | "light" | "dark";

export interface CustomDnsServer {
  id: string;
  name: string;
  primary: string;
  secondary?: string;
}

export interface SettingsState {
  themeMode: ThemeMode;
  customDnsServers: CustomDnsServer[];
  selectedCustomDnsId: string | null;
  blocklist: string[];
  whitelist: string[];
  excludedApps: string[];
  autoStartOnBoot: boolean;
  useDoH: boolean;
  hasMigrated: boolean;
}

const DEFAULT_STATE: SettingsState = {
  themeMode: "system",
  customDnsServers: [],
  selectedCustomDnsId: null,
  blocklist: [],
  whitelist: [],
  excludedApps: [],
  autoStartOnBoot: false,
  useDoH: true,
  hasMigrated: true,
};

const STORAGE_KEY = "@nidaa-shield/settings-v1";

interface SettingsContextValue extends SettingsState {
  setThemeMode: (mode: ThemeMode) => Promise<void>;
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

  const resetAll = useCallback(async () => {
    setState(DEFAULT_STATE);
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...state,
      hydrated,
      setThemeMode,
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
      resetAll,
    }),
    [
      state,
      hydrated,
      setThemeMode,
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
