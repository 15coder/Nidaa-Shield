import React, { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AboutModal } from "@/components/AboutModal";
import { FirstConnectionAnimation } from "@/components/FirstConnectionAnimation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ModeCard } from "@/components/ModeCard";
import { StatusOrb } from "@/components/StatusOrb";
import { useSettings } from "@/contexts/SettingsContext";
import { MODES, useVpn, type ShieldMode } from "@/contexts/VpnContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activeMode, isConnected, setActiveMode, disconnect } = useVpn();
  const settings = useSettings();
  const [aboutVisible, setAboutVisible] = useState(false);
  const [firstConnVisible, setFirstConnVisible] = useState(false);

  // Show the "first connection" animated diagram once after the user
  // successfully activates protection for the very first time.
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
