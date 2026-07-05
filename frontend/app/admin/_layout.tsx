import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, useWindowDimensions } from "react-native";
import { Slot, useRouter, usePathname } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/src/auth";
import { colors, spacing, radius } from "@/src/theme";

const NAV = [
  { key: "/admin", label: "Dashboard", icon: "view-dashboard" },
  { key: "/admin/notices", label: "Notices", icon: "bell" },
  { key: "/admin/materials", label: "Study Material", icon: "book-open" },
  { key: "/admin/pyqs", label: "PYQs", icon: "file-document" },
  { key: "/admin/assignments", label: "Assignments", icon: "clipboard-text" },
  { key: "/admin/marks", label: "Marks", icon: "chart-line" },
  { key: "/admin/students", label: "Students", icon: "account-group" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  return (
    <View style={styles.wrap}>
      {wide && (
        <View style={styles.sidebar}>
          <View style={styles.brandRow}>
            <MaterialCommunityIcons name="shield-crown" size={26} color={colors.brand} />
            <Text style={styles.brand}>OurSpace</Text>
          </View>
          <Text style={styles.sideSub}>Admin Panel</Text>

          <ScrollView style={{ marginTop: spacing.lg }}>
            {NAV.map((n) => {
              const on = pathname === n.key;
              return (
                <Pressable
                  key={n.key}
                  onPress={() => router.push(n.key as any)}
                  style={[styles.navItem, on && styles.navItemOn]}
                >
                  <MaterialCommunityIcons name={n.icon as any} size={20} color={on ? "#fff" : colors.onSurfaceSecondary} />
                  <Text style={[styles.navText, on && { color: "#fff", fontWeight: "700" }]}>{n.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.userBox}>
            <View style={styles.userAvatar}>
              <Text style={styles.userInitial}>A</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName} numberOfLines={1}>{user?.full_name ?? "Admin"}</Text>
              <Text style={styles.userRole}>@{user?.username}</Text>
            </View>
            <Pressable onPress={async () => { await logout(); router.replace("/(auth)/login"); }} hitSlop={8}>
              <MaterialCommunityIcons name="logout" size={18} color={colors.error} />
            </Pressable>
          </View>
        </View>
      )}

      <View style={{ flex: 1 }}>
        {!wide && (
          <View style={styles.mobileTop}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, alignItems: "center" }}>
              {NAV.map((n) => {
                const on = pathname === n.key;
                return (
                  <Pressable key={n.key} onPress={() => router.push(n.key as any)} style={[styles.pill, on && styles.pillOn]}>
                    <MaterialCommunityIcons name={n.icon as any} size={14} color={on ? "#fff" : colors.brand} />
                    <Text style={[styles.pillText, on && { color: "#fff" }]}>{n.label}</Text>
                  </Pressable>
                );
              })}
              <Pressable onPress={async () => { await logout(); router.replace("/(auth)/login"); }} style={[styles.pill, { borderColor: colors.error }]}>
                <MaterialCommunityIcons name="logout" size={14} color={colors.error} />
                <Text style={[styles.pillText, { color: colors.error }]}>Logout</Text>
              </Pressable>
            </ScrollView>
          </View>
        )}
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.surface, flexDirection: "row" },
  sidebar: { width: 240, backgroundColor: "#fff", borderRightWidth: 1, borderRightColor: colors.border, padding: spacing.lg },
  brandRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  brand: { fontSize: 20, fontWeight: "800", color: colors.brand },
  sideSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  navItem: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: 10, borderRadius: radius.md, marginBottom: 4 },
  navItemOn: { backgroundColor: colors.brand },
  navText: { color: colors.onSurfaceSecondary, fontSize: 14 },
  userBox: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm, borderTopWidth: 1, borderTopColor: colors.divider, marginTop: 8 },
  userAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  userInitial: { color: "#fff", fontWeight: "700" },
  userName: { fontWeight: "700", color: colors.onSurface, fontSize: 13 },
  userRole: { color: colors.muted, fontSize: 11 },
  mobileTop: { backgroundColor: "#fff", padding: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" },
  pillOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  pillText: { fontSize: 12, color: colors.brand, fontWeight: "600" },
});
