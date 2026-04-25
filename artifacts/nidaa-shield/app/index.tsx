import React, { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
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
      <Header />

      <View style={styles.statusWrap}>
        <StatusOrb />
      </View>

      <View style={styles.modesWrap}>
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

      <View style={[styles.footerWrap, { paddingBottom: bottomPad }]}>
        <Footer onAboutPress={() => setAboutVisible(true)} />
      </View>

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
  statusWrap: {
    paddingHorizontal: 4,
  },
  modesWrap: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 10,
    justifyContent: "center",
  },
  footerWrap: {
    paddingHorizontal: 16,
  },
});
