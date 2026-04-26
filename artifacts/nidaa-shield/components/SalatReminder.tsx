import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

const STORAGE_KEY = "@nidaa-shield/salat-reminder-v1";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Phase = "loading" | "ask" | "blessing" | "done";

export function SalatReminder() {
  const colors = useColors();
  const [phase, setPhase] = useState<Phase>("loading");

  // On mount: check if we've already asked today
  useEffect(() => {
    (async () => {
      try {
        const last = await AsyncStorage.getItem(STORAGE_KEY);
        if (last === todayKey()) {
          setPhase("done");
        } else {
          setPhase("ask");
        }
      } catch {
        setPhase("ask");
      }
    })();
  }, []);

  const markDone = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, todayKey());
    } catch {}
  };

  const handleYes = async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    await markDone();
    setPhase("done");
  };

  const handleNo = async () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    setPhase("blessing");
  };

  const handleBlessingDone = async () => {
    await markDone();
    setPhase("done");
  };

  const visible = phase === "ask" || phase === "blessing";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        // Mandatory — user can't dismiss with back button without answering
      }}
    >
      <View style={[styles.backdrop, { backgroundColor: "rgba(0,0,0,0.55)" }]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.background,
              borderColor: colors.cardActiveBorder,
            },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="moon" size={32} color={colors.primary} />
          </View>

          {phase === "ask" ? (
            <>
              <Text style={[styles.title, { color: colors.foreground }]}>
                هل صلّيت على محمد اليوم؟
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                ﷺ صلوا عليه وسلّموا تسليما
              </Text>

              <View style={styles.actions}>
                <Pressable
                  onPress={handleYes}
                  style={({ pressed }) => [
                    styles.btn,
                    styles.btnPrimary,
                    {
                      backgroundColor: colors.primary,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={18} color={colors.primaryForeground} />
                  <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
                    نعم
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleNo}
                  style={({ pressed }) => [
                    styles.btn,
                    styles.btnSecondary,
                    {
                      backgroundColor: colors.muted,
                      borderColor: colors.cardActiveBorder,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.btnText, { color: colors.foreground }]}>
                    لا، سأصلي عليه
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.foreground }]}>
                اللهم صلِّ وسلِّم على نبينا محمد
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                وعلى آله وصحبه أجمعين
              </Text>

              <Pressable
                onPress={handleBlessingDone}
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnPrimary,
                  styles.btnFull,
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
                  متابعة
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: "Cairo_700Bold",
    fontSize: 20,
    textAlign: "center",
    writingDirection: "rtl",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Cairo_500Medium",
    fontSize: 13,
    textAlign: "center",
    writingDirection: "rtl",
    marginBottom: 22,
  },
  actions: {
    width: "100%",
    flexDirection: "column",
    gap: 10,
  },
  btn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  btnFull: {
    width: "100%",
    marginTop: 4,
  },
  btnPrimary: {},
  btnSecondary: {
    borderWidth: 1,
  },
  btnText: {
    fontFamily: "Cairo_700Bold",
    fontSize: 14,
    letterSpacing: 0.3,
  },
});
