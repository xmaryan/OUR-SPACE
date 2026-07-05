import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/src/api";
import { colors, spacing, radius } from "@/src/theme";
import { Shimmer } from "@/src/shimmer";

const GRADE_COLORS: Record<string, string> = {
  "A+": "#386A20", A: "#4CAF50", "B+": "#FFA000", B: "#FF9800", C: "#FF7043", D: "#E64A19", F: "#B3261E",
};

export default function Marks() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get("/marks");
        setData(r.data);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="marks-back" onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>My Marks</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
        {loading ? (
          <>
            <Shimmer style={{ height: 120, marginBottom: spacing.md }} />
            {Array.from({ length: 4 }).map((_, i) => <Shimmer key={i} style={{ height: 80, marginBottom: spacing.sm }} />)}
          </>
        ) : (
          <>
            <LinearGradient colors={["#3F51B5", "#7E57C2"]} style={styles.cgpaCard}>
              <Text style={styles.cgpaLbl}>Current CGPA</Text>
              <Text testID="cgpa-value" style={styles.cgpaVal}>{data?.cgpa ?? "—"}</Text>
              <Text style={styles.cgpaSub}>Based on {data?.marks?.length ?? 0} subjects</Text>
            </LinearGradient>
            {(data?.marks ?? []).map((m: any) => (
              <View key={m.id} testID={`mark-${m.id}`} style={styles.card}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subj}>{m.subject_name}</Text>
                    <Text style={styles.code}>{m.subject_code}</Text>
                  </View>
                  <View style={[styles.gradePill, { backgroundColor: (GRADE_COLORS[m.grade] ?? colors.brand) + "22" }]}>
                    <Text style={[styles.gradeText, { color: GRADE_COLORS[m.grade] ?? colors.brand }]}>{m.grade}</Text>
                  </View>
                </View>
                <View style={styles.markRow}>
                  <MarkCol label="Internal" value={m.internal} />
                  <MarkCol label="External" value={m.external} />
                  <MarkCol label="Total" value={m.total} big />
                </View>
              </View>
            ))}
            {(!data?.marks || data.marks.length === 0) && (
              <View style={styles.empty}>
                <MaterialCommunityIcons name="chart-line" size={48} color={colors.muted} />
                <Text style={{ color: colors.muted }}>No marks published yet</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function MarkCol({ label, value, big }: any) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={styles.mlbl}>{label}</Text>
      <Text style={[styles.mval, big && { color: colors.brand, fontSize: 20 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.surface },
  title: { fontSize: 20, fontWeight: "700", color: colors.onSurface },
  cgpaCard: { borderRadius: radius.lg, padding: spacing.lg, alignItems: "center", marginBottom: spacing.lg },
  cgpaLbl: { color: "#EEE", fontSize: 13 },
  cgpaVal: { color: "#fff", fontSize: 42, fontWeight: "800", marginTop: 4 },
  cgpaSub: { color: "#DDD", fontSize: 12, marginTop: 4 },
  card: { backgroundColor: "#fff", borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  row: { flexDirection: "row", alignItems: "center" },
  subj: { fontWeight: "700", color: colors.onSurface, fontSize: 15 },
  code: { color: colors.muted, fontSize: 12, marginTop: 2 },
  gradePill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.pill },
  gradeText: { fontWeight: "800", fontSize: 13 },
  markRow: { flexDirection: "row", marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider },
  mlbl: { fontSize: 11, color: colors.muted },
  mval: { fontSize: 16, fontWeight: "700", color: colors.onSurface, marginTop: 4 },
  empty: { alignItems: "center", padding: spacing.xxl, gap: spacing.sm },
});
