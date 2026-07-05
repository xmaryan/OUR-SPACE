import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "@/src/api";
import { colors, spacing, radius } from "@/src/theme";
import { Shimmer } from "@/src/shimmer";

const CARDS = [
  { key: "students", label: "Students", icon: "account-group", color: "#3F51B5" },
  { key: "notices", label: "Notices", icon: "bell", color: "#B3261E" },
  { key: "materials", label: "Study Material", icon: "book-open", color: "#7E57C2" },
  { key: "pyqs", label: "PYQs", icon: "file-document", color: "#009688" },
  { key: "assignments", label: "Assignments", icon: "clipboard-text", color: "#795900" },
  { key: "groups", label: "Chat Groups", icon: "forum", color: "#0062A0" },
  { key: "messages", label: "Total Messages", icon: "message-text", color: "#386A20" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const r = await api.get("/admin/stats"); setStats(r.data); }
      catch {} finally { setLoading(false); }
    })();
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
      <Text style={styles.h1}>Dashboard</Text>
      <Text style={styles.sub}>Overview of OurSpace platform</Text>

      <View style={styles.grid}>
        {CARDS.map((c) => (
          <View key={c.key} style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: c.color + "22" }]}>
              <MaterialCommunityIcons name={c.icon as any} size={22} color={c.color} />
            </View>
            {loading ? <Shimmer style={{ height: 32, width: 60, marginTop: spacing.md }} /> : (
              <Text style={styles.value}>{stats?.[c.key] ?? 0}</Text>
            )}
            <Text style={styles.label}>{c.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.tips}>
        <Text style={styles.tipTitle}>💡 Quick tips</Text>
        <Text style={styles.tipText}>• Use the sidebar (or top pills on mobile) to manage content.</Text>
        <Text style={styles.tipText}>• PDFs are stored as URLs — upload to Google Drive, share as "Anyone with link", then paste the URL.</Text>
        <Text style={styles.tipText}>• Notices and materials will appear instantly in the student app after saving.</Text>
        <Text style={styles.tipText}>• Chat messages appear in the student app within 2.5 seconds (real-time polling).</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: "800", color: colors.onSurface },
  sub: { color: colors.muted, marginTop: 2, marginBottom: spacing.xl },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg },
  card: { flexGrow: 1, flexBasis: 180, backgroundColor: "#fff", borderRadius: radius.lg, padding: spacing.lg, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  value: { fontSize: 32, fontWeight: "800", color: colors.onSurface, marginTop: spacing.md },
  label: { color: colors.muted, fontSize: 13, marginTop: 4 },
  tips: { backgroundColor: "#EDE7F6", padding: spacing.lg, borderRadius: radius.lg, marginTop: spacing.xl },
  tipTitle: { fontWeight: "700", color: colors.brand, marginBottom: spacing.sm, fontSize: 15 },
  tipText: { color: colors.onSurfaceSecondary, marginBottom: 6, fontSize: 13, lineHeight: 20 },
});
