import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { createContext, useCallback, useContext, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

export type DialogButtonStyle = "default" | "cancel" | "destructive";

export interface DialogButton {
  text: string;
  style?: DialogButtonStyle;
  onPress?: () => void | Promise<void>;
}

export interface DialogOptions {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconTint?: "primary" | "danger" | "success" | "warning";
  buttons?: DialogButton[];
}

interface DialogContextValue {
  show: (opts: DialogOptions) => void;
  hide: () => void;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

interface InternalState extends DialogOptions {
  visible: boolean;
}

const DEFAULT_OPTS: InternalState = {
  visible: false,
  title: "",
  message: undefined,
  icon: undefined,
  iconTint: "primary",
  buttons: [{ text: "حسناً", style: "default" }],
};

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<InternalState>(DEFAULT_OPTS);
  const fade = React.useRef(new Animated.Value(0)).current;
  const scale = React.useRef(new Animated.Value(0.92)).current;

  const animateIn = useCallback(() => {
    fade.setValue(0);
    scale.setValue(0.92);
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        speed: 24,
        bounciness: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, scale]);

  const animateOut = useCallback(
    (after: () => void) => {
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 0,
          duration: 140,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.94,
          duration: 140,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => after());
    },
    [fade, scale],
  );

  const show = useCallback(
    (opts: DialogOptions) => {
      setState({
        visible: true,
        title: opts.title,
        message: opts.message,
        icon: opts.icon,
        iconTint: opts.iconTint ?? "primary",
        buttons:
          opts.buttons && opts.buttons.length > 0
            ? opts.buttons
            : [{ text: "حسناً", style: "default" }],
      });
      requestAnimationFrame(animateIn);
    },
    [animateIn],
  );

  const hide = useCallback(() => {
    animateOut(() => setState((s) => ({ ...s, visible: false })));
  }, [animateOut]);

  const handleButton = useCallback(
    (btn: DialogButton) => {
      animateOut(async () => {
        setState((s) => ({ ...s, visible: false }));
        try {
          await btn.onPress?.();
        } catch {}
      });
    },
    [animateOut],
  );

  const value: DialogContextValue = { show, hide };

  return (
    <DialogContext.Provider value={value}>
      {children}
      <DialogHost
        state={state}
        fade={fade}
        scale={scale}
        onRequestClose={hide}
        onPressButton={handleButton}
      />
    </DialogContext.Provider>
  );
}

function DialogHost({
  state,
  fade,
  scale,
  onRequestClose,
  onPressButton,
}: {
  state: InternalState;
  fade: Animated.Value;
  scale: Animated.Value;
  onRequestClose: () => void;
  onPressButton: (btn: DialogButton) => void;
}) {
  const colors = useColors();
  const isDark = colors.scheme === "dark";

  const sheetBg = isDark ? "rgba(20, 28, 38, 0.98)" : "rgba(255, 255, 255, 0.99)";
  const blurTint: "light" | "dark" = isDark ? "dark" : "light";
  const dividerColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  const tintColor =
    state.iconTint === "danger"
      ? "#E03E52"
      : state.iconTint === "success"
        ? "#1B7A4B"
        : state.iconTint === "warning"
          ? "#E8A22B"
          : colors.primary;
  const tintBg =
    state.iconTint === "danger"
      ? "rgba(224, 62, 82, 0.14)"
      : state.iconTint === "success"
        ? "rgba(27, 122, 75, 0.14)"
        : state.iconTint === "warning"
          ? "rgba(232, 162, 43, 0.14)"
          : colors.primarySoft;

  const buttons = state.buttons ?? [];

  return (
    <Modal
      visible={state.visible}
      transparent
      animationType="none"
      onRequestClose={onRequestClose}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: fade,
            backgroundColor: isDark
              ? "rgba(0, 0, 0, 0.62)"
              : "rgba(8, 14, 22, 0.42)",
          },
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            const cancel = buttons.find((b) => b.style === "cancel");
            if (cancel) onPressButton(cancel);
            else onRequestClose();
          }}
        />

        <View style={styles.center} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.sheetWrap,
              { transform: [{ scale }], opacity: fade },
            ]}
          >
            <BlurView
              intensity={Platform.OS === "ios" ? 60 : 40}
              tint={blurTint}
              style={[
                styles.sheet,
                {
                  backgroundColor: sheetBg,
                  borderColor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.06)",
                },
              ]}
            >
              {state.icon ? (
                <View style={[styles.iconBadge, { backgroundColor: tintBg }]}>
                  <Ionicons name={state.icon} size={26} color={tintColor} />
                </View>
              ) : null}

              <Text
                style={[
                  styles.title,
                  {
                    color: colors.foreground,
                    marginTop: state.icon ? 12 : 4,
                  },
                ]}
              >
                {state.title}
              </Text>

              {state.message ? (
                <Text
                  style={[
                    styles.message,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {state.message}
                </Text>
              ) : null}

              <View
                style={[
                  styles.actionsWrap,
                  { borderTopColor: dividerColor },
                ]}
              >
                {buttons.map((btn, idx) => {
                  const last = idx === buttons.length - 1;
                  const btnColor =
                    btn.style === "destructive"
                      ? "#E03E52"
                      : btn.style === "cancel"
                        ? colors.mutedForeground
                        : colors.primary;
                  return (
                    <React.Fragment key={`${btn.text}-${idx}`}>
                      <Pressable
                        onPress={() => onPressButton(btn)}
                        style={({ pressed }) => [
                          styles.actionBtn,
                          {
                            opacity: pressed ? 0.55 : 1,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.actionText,
                            {
                              color: btnColor,
                              fontFamily:
                                btn.style === "cancel"
                                  ? "Cairo_500Medium"
                                  : "Cairo_700Bold",
                            },
                          ]}
                        >
                          {btn.text}
                        </Text>
                      </Pressable>
                      {!last ? (
                        <View
                          style={[
                            styles.actionDivider,
                            { backgroundColor: dividerColor },
                          ]}
                        />
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </View>
            </BlurView>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error("useDialog must be used inside <DialogProvider>");
  }
  return ctx;
}

// Imperative singleton — set by provider so non-React modules (contexts)
// can show dialogs without depending on React hooks.
let imperativeRef: DialogContextValue | null = null;

export function ImperativeDialogBridge({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = useDialog();
  React.useEffect(() => {
    imperativeRef = ctx;
    return () => {
      if (imperativeRef === ctx) imperativeRef = null;
    };
  }, [ctx]);
  return <>{children}</>;
}

export function showDialog(opts: DialogOptions) {
  if (imperativeRef) {
    imperativeRef.show(opts);
  } else if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn(
      "[Dialog] showDialog() called before DialogProvider mounted:",
      opts.title,
    );
  }
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  sheetWrap: {
    width: "100%",
    maxWidth: 360,
  },
  sheet: {
    borderRadius: 24,
    borderWidth: 1,
    paddingTop: 22,
    overflow: "hidden",
  },
  iconBadge: {
    alignSelf: "center",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Cairo_700Bold",
    fontSize: 17,
    textAlign: "center",
    writingDirection: "rtl",
    paddingHorizontal: 22,
  },
  message: {
    fontFamily: "Cairo_500Medium",
    fontSize: 13,
    lineHeight: 22,
    textAlign: "center",
    writingDirection: "rtl",
    paddingHorizontal: 22,
    marginTop: 8,
    marginBottom: 6,
  },
  actionsWrap: {
    flexDirection: "row-reverse",
    borderTopWidth: 1,
    marginTop: 16,
    minHeight: 50,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  actionDivider: {
    width: 1,
  },
  actionText: {
    fontSize: 14,
    letterSpacing: 0.3,
  },
});
