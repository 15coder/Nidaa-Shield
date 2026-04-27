export interface ModeColorSet {
  primary: string;
  dark: string;
  glow: string;
  soft: string;
  border: string;
  gradientStart: string;
  gradientEnd: string;
  auraLight: string;
  auraDark: string;
}

export const MODE_COLORS: Record<string, ModeColorSet> = {
  smart: {
    primary: "#00B4FF",
    dark: "#0080CC",
    glow: "rgba(0,180,255,0.55)",
    soft: "rgba(0,180,255,0.11)",
    border: "rgba(0,180,255,0.38)",
    gradientStart: "#00B4FF",
    gradientEnd: "#0070CC",
    auraLight: "rgba(0,180,255,0.055)",
    auraDark: "rgba(0,180,255,0.08)",
  },
  gaming: {
    primary: "#FF6B1A",
    dark: "#CC4400",
    glow: "rgba(255,107,26,0.55)",
    soft: "rgba(255,107,26,0.11)",
    border: "rgba(255,107,26,0.38)",
    gradientStart: "#FF6B1A",
    gradientEnd: "#CC2200",
    auraLight: "rgba(255,100,20,0.055)",
    auraDark: "rgba(255,100,20,0.085)",
  },
  family: {
    primary: "#14B8A6",
    dark: "#0D9488",
    glow: "rgba(20,184,166,0.55)",
    soft: "rgba(20,184,166,0.11)",
    border: "rgba(20,184,166,0.38)",
    gradientStart: "#14B8A6",
    gradientEnd: "#0A7A70",
    auraLight: "rgba(20,184,166,0.055)",
    auraDark: "rgba(20,184,166,0.085)",
  },
  military: {
    primary: "#22C55E",
    dark: "#16A34A",
    glow: "rgba(34,197,94,0.55)",
    soft: "rgba(34,197,94,0.11)",
    border: "rgba(34,197,94,0.38)",
    gradientStart: "#22C55E",
    gradientEnd: "#0F7A35",
    auraLight: "rgba(34,197,94,0.05)",
    auraDark: "rgba(34,197,94,0.08)",
  },
  custom: {
    primary: "#A855F7",
    dark: "#7C3AED",
    glow: "rgba(168,85,247,0.55)",
    soft: "rgba(168,85,247,0.11)",
    border: "rgba(168,85,247,0.38)",
    gradientStart: "#A855F7",
    gradientEnd: "#6D28D9",
    auraLight: "rgba(168,85,247,0.055)",
    auraDark: "rgba(168,85,247,0.08)",
  },
};

export function getModeColors(modeId?: string | null): ModeColorSet {
  return (modeId && MODE_COLORS[modeId]) ? MODE_COLORS[modeId] : MODE_COLORS.smart;
}
