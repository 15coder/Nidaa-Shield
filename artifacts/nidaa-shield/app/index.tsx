import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AboutModal } from "@/components/AboutModal";
import { FirstConnectionAnimation } from "@/components/FirstConnectionAnimation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ModeCard } from "@/components/ModeCard";
import { SalatCard } from "@/components/SalatCard";
import { StatusOrb } from "@/components/StatusOrb";
import { useSettings } from "@/contexts/SettingsContext";
import { MODES, useVpn, type ShieldMode } from "@/contexts/VpnContext";
import { MODE_COLORS } from "@/hooks/useModeColors";
import { useColors } from "@/hooks/useColors";

const MODE_IDS = ["smart", "gaming", "family", "military", "custom"] as const;

function ModeAura({ activeMode, isConnected }: { activeMode: ShieldMode; isConnected: boolean }) {
  const colors = useColors();
  const isDark = colors.scheme === "dark";

  const opacities = useRef(
    Object.fromEntries(MODE_IDS.map((id) => [id, new Animated.Value(0)])) as Record<string, Animated.Value>
  ).current;

  useEffect(() => {
    const anims = MODE_IDS.map((id) =>
      Animated.timing(opacities[id], {
        toValue: isConnected && activeMode === id ? 1 : 0,
        duration: 900,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );
    Animated.parallel(anims).start();
  }, [activeMode, isConnected, opacities]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {MODE_IDS.map((id) => {
        const mc = MODE_COLORS[id];
        const auraColor = isDark ? mc.auraDark : mc.auraLight;
        return (
          <Animated.View
            key={id}
            style={[StyleSheet.absoluteFill, { opacity: opacities[id] }]}
          >
            <LinearGradient
              colors={[auraColor, "transparent", "transparent"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.55 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        );
      })}
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activeMode, isConnected, setActiveMode, disconnect } = useVpn();
  const settings = useSettings();
  const [aboutVisible, setAboutVisible] = useState(false);
  const [firstConnVisible, setFirstConnVisible] = useState(false);

  useEffect(() => {
    if (
      isConnected &&
      !settings.firstConnectionShown &&
      settings.hydrated
    ) {
      const t = setTimeout(() => setFirstConnVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, [isConnected, settings.firstConnectionShown, settings.hydrated]);

  const closeFirstConn = () => {
    setFirstConnVisible(false);
    settings.setFirstConnectionShown(true);
  };

  const baseModes: Array<Exclude<ShieldMode, null>> = [
    "smart",
    "gaming",
    "family",
    "military",
  ];
  const modeIds = settings.customDnsServers.length > 0
    ? [...baseModes, "custom" as Exclude<ShieldMode, null>]
    : baseModes;

  const handleSelect = async (mode: Exclude<ShieldMode, null>) => {
    if (activeMode === mode) {
      await disconnect();
    } else {
      await setActiveMode(mode);
    }
  };

  const bottomPad =
    Platform.OS === "web" ? 34 + insets.bottom : insets.bottom + 8;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Dynamic mode background aura */}
      <ModeAura activeMode={activeMode} isConnected={isConnected} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
        overScrollMode="always"
      >
        <Header />

        {/* Status section */}
        <View style={styles.statusSection}>
          <StatusOrb />
        </View>

        {/* Daily salat reminder card */}
        <SalatCard />

        {/* Modes section */}
        <View style={styles.modesSection}>
          <View style={styles.sectionHeader}>
            <Text
              style={[styles.sectionTitle, { color: colors.foreground }]}
            >
              أوضاع الحماية
            </Text>
            <Text
              style={[styles.sectionHint, { color: colors.mutedForeground }]}
            >
              اضغط للتفعيل
            </Text>
          </View>

          <View style={styles.modesList}>
            {modeIds.map((id) => (
              <ModeCard
                key={id}
                mode={MODES[id]}
                isActive={activeMode === id}
                onPress={() => handleSelect(id)}
              />
            ))}
          </View>
        </View>

        {/* Footer section */}
        <View
          style={[
            styles.footerSection,
            {
              paddingBottom: bottomPad,
              borderTopColor: colors.cardBorder,
              marginTop: 24,
            },
          ]}
        >
          <Footer onAboutPress={() => setAboutVisible(true)} />
        </View>
      </ScrollView>

      <AboutModal
        visible={aboutVisible}
        onClose={() => setAboutVisible(false)}
      />

      <FirstConnectionAnimation
        visible={firstConnVisible}
        onClose={closeFirstConn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  statusSection: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 14,
  },
  modesSection: {
    paddingHorizontal: 18,
  },
  sectionHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: "Cairo_700Bold",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  sectionHint: {
    fontFamily: "Cairo_500Medium",
    fontSize: 11,
  },
  modesList: {
    gap: 10,
  },
  footerSection: {
    paddingHorizontal: 18,
    paddingTop: 16,
    borderTopWidth: 1,
  },
});
