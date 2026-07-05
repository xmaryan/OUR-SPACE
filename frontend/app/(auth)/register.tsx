import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/src/auth";
import { api } from "@/src/api";
import { colors, spacing, radius } from "@/src/theme";

export default function Register() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register } = useAuth();
  const [colleges, setColleges] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [form, setForm] = useState({
    full_name: "", username: "", password: "", recovery_email: "",
    college_id: "", course_id: "", semester: "3", roll_number: "",
  });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const c = await api.get("/colleges");
      const co = await api.get("/courses");
      setColleges(c.data);
      setCourses(co.data);
      if (c.data[0]) setForm((f) => ({ ...f, college_id: c.data[0].id }));
      if (co.data[0]) setForm((f) => ({ ...f, course_id: co.data[0].id }));
    })();
  }, []);

  const submit = async () => {
    if (!form.full_name || !form.username || !form.password || !form.roll_number) {
      setErr("Please fill all required fields");
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      await register({ ...form, semester: parseInt(form.semester, 10) || 1, recovery_email: form.recovery_email || null });
      router.replace("/(tabs)/home");
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="register-back" onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Create account</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Field label="Full name" testID="reg-name" value={form.full_name} onChangeText={set("full_name")} icon="account" />
        <Field label="Username" testID="reg-username" value={form.username} onChangeText={set("username")} icon="at" autoCapitalize="none" />
        <Field label="Password" testID="reg-password" value={form.password} onChangeText={set("password")} icon="lock" secureTextEntry />
        <Field label="Recovery email (optional)" testID="reg-email" value={form.recovery_email} onChangeText={set("recovery_email")} icon="email" autoCapitalize="none" />
        <Field label="Roll number" testID="reg-roll" value={form.roll_number} onChangeText={set("roll_number")} icon="identifier" />
        <Field label="Semester" testID="reg-sem" value={form.semester} onChangeText={set("semester")} icon="numeric" keyboardType="number-pad" />

        <Text style={styles.section}>College</Text>
        <View style={styles.picker}>
          {colleges.map((c) => (
            <Pressable key={c.id} onPress={() => set("college_id")(c.id)} style={[styles.pill, form.college_id === c.id && styles.pillActive]}>
              <Text style={[styles.pillText, form.college_id === c.id && styles.pillTextActive]}>{c.name}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.section}>Course</Text>
        <View style={styles.picker}>
          {courses.map((c) => (
            <Pressable key={c.id} onPress={() => set("course_id")(c.id)} style={[styles.pill, form.course_id === c.id && styles.pillActive]}>
              <Text style={[styles.pillText, form.course_id === c.id && styles.pillTextActive]}>{c.name}</Text>
            </Pressable>
          ))}
        </View>

        {err && <Text style={styles.err}>{err}</Text>}
        <Pressable testID="register-submit" onPress={submit} style={styles.cta} disabled={busy}>
          <Text style={styles.ctaText}>{busy ? "Creating..." : "Create account"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, testID, icon, ...rest }: any) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.lbl}>{label}</Text>
      <View style={styles.fieldWrap}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.muted} />
        <TextInput testID={testID} placeholderTextColor={colors.muted} style={styles.input} {...rest} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  title: { fontSize: 20, fontWeight: "700", color: colors.onSurface },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  lbl: { fontSize: 12, color: colors.muted, marginBottom: 6, marginLeft: 4 },
  fieldWrap: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: "#fff", borderRadius: radius.lg, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, height: 50 },
  input: { flex: 1, color: colors.onSurface, fontSize: 15 },
  section: { fontSize: 13, fontWeight: "600", color: colors.onSurfaceSecondary, marginTop: spacing.md, marginBottom: spacing.sm },
  picker: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  pill: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border },
  pillActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  pillText: { color: colors.onSurfaceSecondary, fontSize: 13 },
  pillTextActive: { color: "#fff", fontWeight: "600" },
  err: { color: colors.error, marginTop: spacing.md, marginBottom: spacing.sm },
  cta: { backgroundColor: colors.brand, borderRadius: radius.pill, paddingVertical: 16, alignItems: "center", marginTop: spacing.lg },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
