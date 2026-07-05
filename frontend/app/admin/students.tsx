import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "@/src/api";
import { colors, spacing, radius } from "@/src/theme";
import { Shimmer } from "@/src/shimmer";

export default function AdminStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const r = await api.get("/admin/students"); setStudents(r.data); }
      catch {} finally { setLoading(false); }
    })();
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
      <Text style={styles.h1}>Students</Text>
      <Text style={styles.sub}>All registered student accounts ({students.length})</Text>

      {loading ? (
        <>
          {Array.from({ length: 4 }).map((_, i) => <Shimmer key={i} style={{ height: 60, marginTop: spacing.sm }} />)}
        </>
      ) : (
        <View style={styles.table}>
          <View style={[styles.row, styles.rowHead]}>
            <Text style={[styles.cell, styles.cellHead, { flex: 2 }]}>Name</Text>
            <Text style={[styles.cell, styles.cellHead]}>Username</Text>
            <Text style={[styles.cell, styles.cellHead]}>Roll No</Text>
            <Text style={[styles.cell, styles.cellHead]}>Semester</Text>
            <Text style={[styles.cell, styles.cellHead, { flex: 1.5 }]}>Joined</Text>
          </View>
          {students.map((s) => (
            <View key={s.id} style={styles.row}>
              <View style={[styles.cell, { flex: 2, flexDirection: "row", alignItems: "center", gap: spacing.sm }]}>
                <View style={styles.av}>
                  <Text style={styles.avT}>{(s.full_name?.[0] ?? "?").toUpperCase()}</Text>
                </View>
                <Text style={{ color: colors.onSurface, fontWeight: "600" }}>{s.full_name}</Text>
              </View>
              <Text style={styles.cell}>@{s.username}</Text>
              <Text style={styles.cell}>{s.roll_number}</Text>
              <Text style={styles.cell}>Sem {s.semester}</Text>
              <Text style={[styles.cell, { flex: 1.5, color: colors.muted, fontSize: 11 }]}>
                {s.created_at ? new Date(s.created_at).toLocaleDateString() : ""}
              </Text>
            </View>
          ))}
          {students.length === 0 && (
            <View style={{ padding: spacing.xxl, alignItems: "center", gap: spacing.sm }}>
              <MaterialCommunityIcons name="account-off-outline" size={40} color={colors.muted} />
              <Text style={{ color: colors.muted }}>No students registered yet</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: "800", color: colors.onSurface },
  sub: { color: colors.muted, marginTop: 2, marginBottom: spacing.lg },
  table: { backgroundColor: "#fff", borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: "row", paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider, alignItems: "center", gap: spacing.sm },
  rowHead: { backgroundColor: "#F5F1FA" },
  cell: { flex: 1, color: colors.onSurface, fontSize: 13 },
  cellHead: { fontWeight: "700", color: colors.brand, fontSize: 11, textTransform: "uppercase" },
  av: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.brandSecondary, alignItems: "center", justifyContent: "center" },
  avT: { color: "#fff", fontWeight: "700" },
});
