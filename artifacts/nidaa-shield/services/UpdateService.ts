import * as Updates from "expo-updates";

let inFlight: Promise<void> | null = null;

export async function checkForOtaUpdate(): Promise<void> {
  if (__DEV__ || !Updates.isEnabled) return;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) return;
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch {
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
