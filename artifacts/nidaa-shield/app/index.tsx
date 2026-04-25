import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
  const { activeMode, isConnected, setActiveMode, disconnect } = useVpn();
  const [aboutVisible, setAboutVisible] = useState(false);

  const handleSelect = async (mode: Exclude<ShieldMode, null>) => {
    if (activeMode === mode) {
      await disconnect();
    } else {
      await setActiveMode(mode);
    }
  };

  const handleDisconnect = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    await disconnect();
  };

  const bottomPad =
    Platform.OS === "web" ? 34 + insets.bottom : insets.bottom + 16;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <StatusOrb />

        {isConnected && (
          <Pressable
            onPress={handleDisconnect}
            style={({ pressed }) => [
              styles.disconnect,
              {
                borderColor: colors.cardBorder,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Text style={[styles.disconnectText, { color: colors.foreground }]}>
              إيقاف الحماية
            </Text>
          </Pressable>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            أوضاع الحماية
          </Text>
          <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
            اختر وضعاً واحداً
          </Text>
        </View>

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

        {activeMode && (
          <View
            style={[
              styles.detailCard,
              { borderColor: colors.cardBorder },
            ]}
          >
            <Text
              style={[
                styles.detailTitle,
                { color: colors.foreground },
              ]}
            >
              {MODES[activeMode].title}
            </Text>
            <Text
              style={[
                styles.detailBody,
                { color: colors.mutedForeground },
              ]}
            >
              {MODES[activeMode].description}
            </Text>
            <View style={styles.detailFooter}>
              <View style={styles.detailMetaRow}>
                <Text
                  style={[
                    styles.detailMetaLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  البروتوكول
                </Text>
                <Text
                  style={[
                    styles.detailMetaValue,
                    { color: colors.foreground },
                  ]}
                >
                  {MODES[activeMode].protocol}
                </Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailMetaRow}>
                <Text
                  style={[
                    styles.detailMetaLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  خادم DNS
                </Text>
                <Text
                  style={[
                    styles.detailMetaValue,
                    { color: colors.foreground },
                  ]}
                >
                  {MODES[activeMode].primaryDns}
                </Text>
              </View>
            </View>
          </View>
        )}

        <Footer onAboutPress={() => setAboutVisible(true)} />
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
    paddingHorizontal: 18,
    paddingTop: 6,
  },
  disconnect: {
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: -2,
    marginBottom: 14,
  },
  disconnectText: {
    fontFamily: "Cairo_700Bold",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingHorizontal: 4,
    marginTop: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Cairo_700Bold",
    fontSize: 16,
    textAlign: "right",
    writingDirection: "rtl",
  },
  sectionHint: {
    fontFamily: "Cairo_500Medium",
    fontSize: 11,
  },
  detailCard: {
    marginTop: 6,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.015)",
  },
  detailTitle: {
    fontFamily: "Cairo_700Bold",
    fontSize: 14,
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: 6,
  },
  detailBody: {
    fontFamily: "Cairo_500Medium",
    fontSize: 12,
    lineHeight: 20,
    textAlign: "right",
    writingDirection: "rtl",
  },
  detailFooter: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  detailMetaRow: {
    flex: 1,
    alignItems: "flex-end",
  },
  detailMetaLabel: {
    fontFamily: "Cairo_500Medium",
    fontSize: 10,
    letterSpacing: 0.4,
  },
  detailMetaValue: {
    fontFamily: "Cairo_700Bold",
    fontSize: 13,
    marginTop: 3,
  },
  detailDivider: {
    width: 1,
    height: 26,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginHorizontal: 14,
  },
});
