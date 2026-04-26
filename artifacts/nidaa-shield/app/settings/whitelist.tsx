import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PageHeader } from "@/components/PageHeader";
import { useSettings } from "@/contexts/SettingsContext";
import { useColors } from "@/hooks/useColors";

export default function WhitelistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { whitelist, addToWhitelist, removeFromWhitelist } = useSettings();
  const [input, setInput] = useState("");

  const handleAdd = async () => {
    const v = input.trim();
    if (!v) return;
    await addToWhitelist(v);
    setInput("");
  };

  const handleRemove = (d: string) => {
    Alert.alert("حذف من القائمة البيضاء", `هل تريد حذف ${d}؟`, [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: () => removeFromWhitelist(d) },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PageHeader
        title="القائمة البيضاء"
        subtitle="نطاقات يسمح بها التطبيق دائماً ولو كانت في وضع الحجب"
      />

      <View style={styles.inputRow}>
        <Pressable
          onPress={handleAdd}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: "#00B47A", opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </Pressable>
        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
          placeholder="مثال: trustedsite.com"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          autoCorrect={false}
          style={[
            styles.input,
            {
              backgroundColor: colors.cardSolid,
              color: colors.foreground,
              borderColor: colors.cardBorder,
            },
          ]}
        />
      </View>

      <FlatList
        data={whitelist}
        keyExtractor={(d) => d}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 28 : 16) },
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-done-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              القائمة فارغة. أضف نطاقات يجب السماح بها دائماً.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.item,
              { backgroundColor: colors.cardSolid, borderColor: colors.cardBorder },
            ]}
          >
            <Pressable
              onPress={() => handleRemove(item)}
              style={({ pressed }) => [styles.removeBtn, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Ionicons name="trash-outline" size={18} color="#E03E52" />
            </Pressable>
            <Text style={[styles.itemText, { color: colors.foreground }]}>
              {item}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inputRow: {
    flexDirection: "row-reverse",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Cairo_500Medium",
    fontSize: 13,
    textAlign: "right",
    writingDirection: "rtl",
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    padding: 16,
    gap: 8,
    flexGrow: 1,
  },
  item: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  itemText: {
    fontFamily: "Cairo_700Bold",
    fontSize: 13,
    flex: 1,
    textAlign: "right",
    writingDirection: "rtl",
  },
  removeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingTop: 60,
  },
  emptyText: {
    fontFamily: "Cairo_500Medium",
    fontSize: 12,
    textAlign: "center",
    writingDirection: "rtl",
  },
});
