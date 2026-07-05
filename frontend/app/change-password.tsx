import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/src/api";
import { colors, spacing, radius } from "@/src/theme";

export default function ChangePassword() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async () => {
    if (!cur || nw.length < 6) {
      setMsg({ ok: false, text: "New password must be at least 6 chars" });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await api.post("/auth/change-password", { current_password: cur, new_password: nw });
      setMsg({ ok: true, text: "Password updated successfully" });
      setCur(""); setNw("");
    } catch (e: any) {
      setMsg({ ok: false, text: e?.response?.data?.detail ?? "Failed to update" });
    } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="cp-back" onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Change password</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Field icon="lock" placeholder="Current password" value={cur} onChangeText={setCur} testID="cp-current" />
        <Field icon="lock-plus" placeholder="New password (min 6 chars)" value={nw} onChangeText={setNw} testID="cp-new" />
        {msg && <Text style={[styles.msg, { color: msg.ok ? colors.success : colors.error }]}>{msg.text}</Text>}
        <Pressable testID="cp-submit" onPress={submit} style={styles.btn} disabled={busy}>
          <Text style={styles.btnText}>{busy ? "Updating..." : "Update password"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ icon, testID, ...rest }: any) {
  return (
    <View style={styles.field}>
      <MaterialCommunityIcons name={icon} size={20} color={colors.muted} />
      <TextInput testID={testID} secureTextEntry placeholderTextColor={colors.muted} style={styles.input} {...rest} />
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  title: { fontSize: 20, fontWeight: "700", color: colors.onSurface },
  field: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: "#fff", borderRadius: radius.lg, paddingHorizontal: spacing.md, marginBottom: spacing.md, height: 52, borderWidth: 1, borderColor: colors.border },
  input: { flex: 1, color: colors.onSurface, fontSize: 15 },
  btn: { backgroundColor: colors.brand, borderRadius: radius.pill, paddingVertical: 16, alignItems: "center", marginTop: spacing.md },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  msg: { textAlign: "center", marginTop: spacing.sm },
});
