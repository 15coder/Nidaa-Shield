import { NativeModule, requireOptionalNativeModule } from "expo";

export interface VpnConfig {
  sessionName: string;
  primaryDns: string;
  secondaryDns?: string | null;
  useDoH?: boolean;
  modeId?: string | null;
  blocklist?: string[];
  whitelist?: string[];
  excludedApps?: string[];
}

export interface VpnStats {
  totalQueries: number;
  blockedQueries: number;
  forwardedQueries: number;
  dohQueries: number;
  averageLatencyMs: number;
  lastDomain: string | null;
  lastBlockedDomain: string | null;
  startedAtMs: number;
  uptimeMs: number;
}

export interface InstalledApp {
  packageName: string;
  label: string;
  isSystem: boolean;
}

export interface CurrentSession {
  isRunning: boolean;
  session: string | null;
  modeId: string | null;
}

declare class NidaaVpnNativeModule extends NativeModule {
  requestPermission(): Promise<boolean>;
  startVpn(config: VpnConfig): Promise<boolean>;
  stopVpn(): Promise<boolean>;
  isRunning(): Promise<boolean>;
  getStats(): Promise<VpnStats>;
  getCurrentSession(): Promise<CurrentSession>;
  setAutoStart(enabled: boolean): Promise<boolean>;
  listInstalledApps(): Promise<InstalledApp[]>;
  getAppIcon(packageName: string): Promise<string | null>;
}

const NidaaVpn = requireOptionalNativeModule<NidaaVpnNativeModule>("NidaaVpn");

export const isNativeAvailable = NidaaVpn !== null;

export async function requestVpnPermission(): Promise<boolean> {
  if (!NidaaVpn) return false;
  try {
    return await NidaaVpn.requestPermission();
  } catch {
    return false;
  }
}

export async function startVpnService(config: VpnConfig): Promise<boolean> {
  if (!NidaaVpn) return false;
  try {
    return await NidaaVpn.startVpn(config);
  } catch {
    return false;
  }
}

export async function stopVpnService(): Promise<boolean> {
  if (!NidaaVpn) return false;
  try {
    return await NidaaVpn.stopVpn();
  } catch {
    return false;
  }
}

export async function isVpnRunning(): Promise<boolean> {
  if (!NidaaVpn) return false;
  try {
    return await NidaaVpn.isRunning();
  } catch {
    return false;
  }
}

export async function getVpnStats(): Promise<VpnStats | null> {
  if (!NidaaVpn) return null;
  try {
    return await NidaaVpn.getStats();
  } catch {
    return null;
  }
}

export async function getCurrentSession(): Promise<CurrentSession> {
  if (!NidaaVpn) return { isRunning: false, session: null, modeId: null };
  try {
    return await NidaaVpn.getCurrentSession();
  } catch {
    return { isRunning: false, session: null, modeId: null };
  }
}

export async function setNativeAutoStart(enabled: boolean): Promise<boolean> {
  if (!NidaaVpn) return false;
  try {
    return await NidaaVpn.setAutoStart(enabled);
  } catch {
    return false;
  }
}

export async function listInstalledApps(): Promise<InstalledApp[]> {
  if (!NidaaVpn) return [];
  try {
    return await NidaaVpn.listInstalledApps();
  } catch {
    return [];
  }
}

export async function getAppIcon(packageName: string): Promise<string | null> {
  if (!NidaaVpn) return null;
  try {
    return await NidaaVpn.getAppIcon(packageName);
  } catch {
    return null;
  }
}
