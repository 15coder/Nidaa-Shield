import { useColorScheme } from "react-native";

import colors, { getAccent, type AccentName } from "@/constants/colors";
import { useSettings } from "@/contexts/SettingsContext";

/**
 * Returns the design tokens for the current color scheme,
 * with the user-selected accent color applied on top.
 */
export function useColors() {
  const systemScheme = useColorScheme();
  let themeMode: "system" | "light" | "dark" = "system";
  let accentColor: AccentName = "cyan";
  try {
    const s = useSettings();
    themeMode = s.themeMode;
    accentColor = s.accentColor;
  } catch {
    // Settings provider not mounted yet — fall back to defaults.
  }
  const effective =
    themeMode === "system" ? (systemScheme === "dark" ? "dark" : "light") : themeMode;
  const palette = effective === "dark" ? colors.dark : colors.light;
  const accent = getAccent(effective, accentColor);

  return {
    ...palette,
    primary: accent.primary,
    primaryDark: accent.primaryDark,
    primaryGlow: accent.primaryGlow,
    primarySoft: accent.primarySoft,
    cardActiveBorder: accent.cardActiveBorder,
    cardActiveGlow: accent.cardActiveGlow,
    tint: accent.tint,
    radius: colors.radius,
    scheme: effective,
    accent: accentColor,
  };
}
