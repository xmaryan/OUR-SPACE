import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/src/auth";
import { colors, spacing, radius } from "@/src/theme";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const insets = useSafeAreaInsets();

  const submit = async () => {
    if (!username.trim() || !password) {
      setErr("Enter username & password");
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      await login(username.trim(), password);
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <LinearGradient colors={["#000000", "#0a0a2e"]} style={[styles.header, { paddingTop: insets.top + 30 }]}>
        <Image source={require("../../assets/images/icon.png")} style={styles.logoImg} contentFit="contain" />
        <Text style={styles.brand}>Our Space</Text>
        <Text style={styles.tagline}>Your campus, in one app</Text>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.h1}>Welcome back</Text>
        <Text style={styles.sub}>Sign in to continue</Text>
        <View style={styles.field}>
          <MaterialCommunityIcons name="account-outline" size={20} color={colors.muted} />
          <TextInput
            testID="login-username-input"
            placeholder="Username"
            placeholderTextColor={colors.muted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            style={styles.input}
          />
        </View>
        <View style={styles.field}>
          <MaterialCommunityIcons name="lock-outline" size={20} color={colors.muted} />
          <TextInput
            testID="login-password-input"
            placeholder="Password"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
        </View>
        {err && <Text style={styles.err} testID="login-error">{err}</Text>}
        <Pressable testID="login-submit-button" onPress={submit} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]} disabled={busy}>
          <Text style={styles.ctaText}>{busy ? "Signing in..." : "Sign in"}</Text>
        </Pressable>
        <View style={styles.demoBox}>
          <Text style={styles.demoTitle}>Demo login</Text>
          <Text style={styles.demoText}>Student: alex / alex1234</Text>
          <Text style={styles.demoText}>Admin:   admin / admin1234  (opens admin panel)</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.muted}>New to OurSpace?  </Text>
          <Link href="/(auth)/register" asChild>
            <Pressable testID="go-register-link"><Text style={styles.link}>Create account</Text></Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingBottom: 30, alignItems: "center", borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  logoImg: { width: 96, height: 96, marginBottom: 4 },
  brand: { fontSize: 30, fontWeight: "700", color: "#fff", marginTop: spacing.sm, letterSpacing: 1 },
  tagline: { color: "#EEE", marginTop: 4 },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  h1: { fontSize: 24, fontWeight: "700", color: colors.onSurface, marginTop: spacing.lg },
  sub: { color: colors.muted, marginBottom: spacing.lg },
  field: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, paddingHorizontal: spacing.md, marginBottom: spacing.md, height: 52,
  },
  input: { flex: 1, color: colors.onSurface, fontSize: 15 },
  err: { color: colors.error, marginBottom: spacing.sm },
  cta: { backgroundColor: colors.brand, borderRadius: radius.pill, paddingVertical: 16, alignItems: "center", marginTop: spacing.sm },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  row: { flexDirection: "row", justifyContent: "center", marginTop: spacing.xl },
  muted: { color: colors.muted },
  link: { color: colors.brand, fontWeight: "700" },
  demoBox: { backgroundColor: "#EDE7F6", padding: spacing.md, borderRadius: radius.md, marginTop: spacing.lg },
  demoTitle: { fontWeight: "700", color: colors.brand, marginBottom: 4 },
  demoText: { color: colors.onSurfaceSecondary, fontSize: 13 },
});
