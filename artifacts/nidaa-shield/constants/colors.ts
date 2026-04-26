export type AccentName = "cyan" | "green" | "purple" | "orange" | "highContrast";

interface AccentTokens {
  primary: string;
  primaryDark: string;
  primaryGlow: string;
  primarySoft: string;
  cardActiveBorder: string;
  cardActiveGlow: string;
  cardActiveBgDark: string;
  tint: string;
}

const ACCENTS: Record<"light" | "dark", Record<AccentName, AccentTokens>> = {
  light: {
    cyan: {
      primary: "#00B4FF",
      primaryDark: "#0090CC",
      primaryGlow: "rgba(0, 180, 255, 0.40)",
      primarySoft: "rgba(0, 180, 255, 0.10)",
      cardActiveBorder: "rgba(0, 180, 255, 0.55)",
      cardActiveGlow: "rgba(0, 180, 255, 0.45)",
      cardActiveBgDark: "rgba(0, 180, 255, 0.10)",
      tint: "#00B4FF",
    },
    green: {
      primary: "#1B7A4B",
      primaryDark: "#15633D",
      primaryGlow: "rgba(27, 122, 75, 0.40)",
      primarySoft: "rgba(27, 122, 75, 0.10)",
      cardActiveBorder: "rgba(27, 122, 75, 0.55)",
      cardActiveGlow: "rgba(27, 122, 75, 0.45)",
      cardActiveBgDark: "rgba(27, 122, 75, 0.10)",
      tint: "#1B7A4B",
    },
    purple: {
      primary: "#7C5CFF",
      primaryDark: "#5B3FE0",
      primaryGlow: "rgba(124, 92, 255, 0.40)",
      primarySoft: "rgba(124, 92, 255, 0.10)",
      cardActiveBorder: "rgba(124, 92, 255, 0.55)",
      cardActiveGlow: "rgba(124, 92, 255, 0.45)",
      cardActiveBgDark: "rgba(124, 92, 255, 0.10)",
      tint: "#7C5CFF",
    },
    orange: {
      primary: "#F39200",
      primaryDark: "#C77600",
      primaryGlow: "rgba(243, 146, 0, 0.40)",
      primarySoft: "rgba(243, 146, 0, 0.10)",
      cardActiveBorder: "rgba(243, 146, 0, 0.55)",
      cardActiveGlow: "rgba(243, 146, 0, 0.45)",
      cardActiveBgDark: "rgba(243, 146, 0, 0.10)",
      tint: "#F39200",
    },
    highContrast: {
      primary: "#000000",
      primaryDark: "#000000",
      primaryGlow: "rgba(0, 0, 0, 0.50)",
      primarySoft: "rgba(0, 0, 0, 0.10)",
      cardActiveBorder: "#000000",
      cardActiveGlow: "rgba(0, 0, 0, 0.50)",
      cardActiveBgDark: "rgba(0, 0, 0, 0.08)",
      tint: "#000000",
    },
  },
  dark: {
    cyan: {
      primary: "#33C5FF",
      primaryDark: "#0090CC",
      primaryGlow: "rgba(0, 180, 255, 0.50)",
      primarySoft: "rgba(0, 180, 255, 0.16)",
      cardActiveBorder: "rgba(0, 180, 255, 0.55)",
      cardActiveGlow: "rgba(0, 180, 255, 0.5)",
      cardActiveBgDark: "rgba(0, 180, 255, 0.10)",
      tint: "#33C5FF",
    },
    green: {
      primary: "#2ECC71",
      primaryDark: "#1B7A4B",
      primaryGlow: "rgba(46, 204, 113, 0.50)",
      primarySoft: "rgba(46, 204, 113, 0.16)",
      cardActiveBorder: "rgba(46, 204, 113, 0.55)",
      cardActiveGlow: "rgba(46, 204, 113, 0.5)",
      cardActiveBgDark: "rgba(46, 204, 113, 0.10)",
      tint: "#2ECC71",
    },
    purple: {
      primary: "#9B7CFF",
      primaryDark: "#7C5CFF",
      primaryGlow: "rgba(155, 124, 255, 0.50)",
      primarySoft: "rgba(155, 124, 255, 0.16)",
      cardActiveBorder: "rgba(155, 124, 255, 0.55)",
      cardActiveGlow: "rgba(155, 124, 255, 0.5)",
      cardActiveBgDark: "rgba(155, 124, 255, 0.10)",
      tint: "#9B7CFF",
    },
    orange: {
      primary: "#FFB347",
      primaryDark: "#F39200",
      primaryGlow: "rgba(255, 179, 71, 0.50)",
      primarySoft: "rgba(255, 179, 71, 0.16)",
      cardActiveBorder: "rgba(255, 179, 71, 0.55)",
      cardActiveGlow: "rgba(255, 179, 71, 0.5)",
      cardActiveBgDark: "rgba(255, 179, 71, 0.10)",
      tint: "#FFB347",
    },
    highContrast: {
      primary: "#FFFFFF",
      primaryDark: "#FFFFFF",
      primaryGlow: "rgba(255, 255, 255, 0.50)",
      primarySoft: "rgba(255, 255, 255, 0.14)",
      cardActiveBorder: "#FFFFFF",
      cardActiveGlow: "rgba(255, 255, 255, 0.55)",
      cardActiveBgDark: "rgba(255, 255, 255, 0.10)",
      tint: "#FFFFFF",
    },
  },
};

export const ACCENT_LIST: { id: AccentName; label: string; color: string }[] = [
  { id: "cyan", label: "السماوي", color: "#00B4FF" },
  { id: "green", label: "الأخضر", color: "#1B7A4B" },
  { id: "purple", label: "البنفسجي", color: "#7C5CFF" },
  { id: "orange", label: "البرتقالي", color: "#F39200" },
  { id: "highContrast", label: "تباين عالٍ", color: "#000000" },
];

export function getAccent(scheme: "light" | "dark", accent: AccentName): AccentTokens {
  return ACCENTS[scheme][accent] ?? ACCENTS[scheme].cyan;
}

const colors = {
  light: {
    text: "#0D1117",
    tint: "#00B4FF",

    background: "#EEF2F7",
    foreground: "#0D1117",

    card: "rgba(255, 255, 255, 0.90)",
    cardForeground: "#0D1117",
    cardBorder: "rgba(0, 0, 0, 0.07)",
    cardSolid: "#FFFFFF",

    cardActive: "rgba(255, 255, 255, 0.98)",
    cardActiveBorder: "rgba(0, 180, 255, 0.55)",
    cardActiveGlow: "rgba(0, 180, 255, 0.45)",

    primary: "#00B4FF",
    primaryDark: "#0090CC",
    primaryForeground: "#FFFFFF",
    primaryGlow: "rgba(0, 180, 255, 0.40)",
    primarySoft: "rgba(0, 180, 255, 0.12)",

    secondary: "#E6EBF2",
    secondaryForeground: "#1A2332",

    muted: "#DDE3ED",
    mutedForeground: "#64748B",

    accent: "#D8E0EC",
    accentForeground: "#1A2332",

    silver: "#A8B4C4",
    silverGlow: "rgba(168, 180, 196, 0.35)",

    destructive: "#C8102E",
    destructiveForeground: "#FFFFFF",

    success: "#1B7A4B",
    successForeground: "#FFFFFF",

    border: "#D8E0EC",
    input: "#D8E0EC",

    overlay: "rgba(10, 14, 20, 0.50)",

    statusBarStyle: "dark-content" as "dark-content" | "light-content",
  },

  dark: {
    text: "#F4F4F6",
    tint: "#33C5FF",

    background: "#0B0F14",
    foreground: "#F4F4F6",

    card: "rgba(22, 28, 36, 0.85)",
    cardForeground: "#F4F4F6",
    cardBorder: "rgba(255, 255, 255, 0.08)",
    cardSolid: "#161C24",

    cardActive: "rgba(0, 180, 255, 0.10)",
    cardActiveBorder: "rgba(0, 180, 255, 0.55)",
    cardActiveGlow: "rgba(0, 180, 255, 0.5)",

    primary: "#33C5FF",
    primaryDark: "#0090CC",
    primaryForeground: "#0B0F14",
    primaryGlow: "rgba(0, 180, 255, 0.50)",
    primarySoft: "rgba(0, 180, 255, 0.16)",

    secondary: "#1A222C",
    secondaryForeground: "#E8E8EC",

    muted: "#1A222C",
    mutedForeground: "#8B95A1",

    accent: "#222B36",
    accentForeground: "#F4F4F6",

    silver: "#5B6573",
    silverGlow: "rgba(91, 101, 115, 0.35)",

    destructive: "#FF5572",
    destructiveForeground: "#0B0F14",

    success: "#2ECC71",
    successForeground: "#0B0F14",

    border: "#222B36",
    input: "#222B36",

    overlay: "rgba(0, 0, 0, 0.7)",

    statusBarStyle: "light-content" as "dark-content" | "light-content",
  },

  radius: 32,
};

export default colors;
