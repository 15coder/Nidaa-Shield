import { NativeModule, requireOptionalNativeModule } from "expo";

declare class NidaaVpnNativeModule extends NativeModule {
  requestPermission(): Promise<boolean>;
  startVpn(
    sessionName: string,
    primaryDns: string,
    secondaryDns: string | null,
  ): Promise<boolean>;
  stopVpn(): Promise<boolean>;
  isRunning(): Promise<boolean>;
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

export async function startVpnService(
  sessionName: string,
  primaryDns: string,
  secondaryDns: string | null = null,
): Promise<boolean> {
  if (!NidaaVpn) return false;
  try {
    return await NidaaVpn.startVpn(sessionName, primaryDns, secondaryDns);
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
