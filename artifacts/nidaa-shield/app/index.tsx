import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AboutModal } from "@/components/AboutModal";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ModeCard } from "@/components/ModeCard";
import { StatusOrb } from "@/components/StatusOrb";
import { MODES, useVpn, type ShieldMode } from "@/contexts/VpnContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activeMode, setActiveMode, disconnect } = useVpn();
  const [aboutVisible, setAboutVisible] = useState(false);

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
            {(
              ["smart", "gaming", "family", "military"] as Array<
                Exclude<ShieldMode, null>
              >
            ).map((id) => (
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
              borderTopColor: "rgba(0,0,0,0.06)",
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
