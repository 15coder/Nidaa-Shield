import { useColorScheme } from "react-native";

import colors from "@/constants/colors";
import { useSettings } from "@/contexts/SettingsContext";

/**
 * Returns the design tokens for the current color scheme.
 * Honors the user-selected theme override from SettingsContext when set,
 * otherwise follows the device's appearance setting.
 */
export function useColors() {
  const systemScheme = useColorScheme();
  let themeMode: "system" | "light" | "dark" = "system";
  try {
    themeMode = useSettings().themeMode;
  } catch {
    // Settings provider not mounted yet — fall back to system.
  }
  const effective =
    themeMode === "system" ? (systemScheme === "dark" ? "dark" : "light") : themeMode;
  const palette = effective === "dark" ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius, scheme: effective };
}
