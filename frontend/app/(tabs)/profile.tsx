import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Image as RNImage } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/src/auth";
import { colors, spacing, radius } from "@/src/theme";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const router = useRouter();

  const items = [
    { icon: "office-building-outline", label: "College", value: "Delhi University" },
    { icon: "school-outline", label: "Course", value: "BCA" },
    { icon: "numeric", label: "Semester", value: `Sem ${user?.semester}` },
    { icon: "identifier", label: "Roll Number", value: user?.roll_number },
    { icon: "at", label: "Username", value: user?.username },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <LinearGradient colors={["#7E57C2", "#3F51B5"]} style={[styles.banner, { paddingTop: insets.top + spacing.lg }]}>
          <View style={styles.avatarWrap}>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1590086782957-93c06ef21604?w=400&q=80" }}
              style={styles.avatar}
              contentFit="cover"
            />
          </View>
          <Text testID="profile-name" style={styles.name}>{user?.full_name}</Text>
          <Text style={styles.username}>@{user?.username} • {user?.roll_number}</Text>
        </LinearGradient>

        <View style={styles.card}>
          {items.map((it, idx) => (
            <View key={it.label} style={[styles.row, idx !== items.length - 1 && styles.rowBorder]}>
              <MaterialCommunityIcons name={it.icon as any} size={20} color={colors.brand} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.lbl}>{it.label}</Text>
                <Text style={styles.val}>{it.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable testID="change-password" onPress={() => router.push("/change-password")} style={styles.actionOutline}>
          <MaterialCommunityIcons name="key-variant" size={18} color={colors.brand} />
          <Text style={styles.actionOutlineText}>Change password</Text>
        </Pressable>

        <Pressable testID="marks-shortcut" onPress={() => router.push("/marks")} style={styles.actionOutline}>
          <MaterialCommunityIcons name="chart-line" size={18} color={colors.brand} />
          <Text style={styles.actionOutlineText}>View my marks & CGPA</Text>
        </Pressable>
      </ScrollView>
      <View style={[styles.stickyWrap, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable testID="logout-button" onPress={async () => { await logout(); router.replace("/(auth)/login"); }} style={styles.logout}>
          <MaterialCommunityIcons name="logout" size={18} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { alignItems: "center", paddingBottom: spacing.xl, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  avatarWrap: { padding: 4, borderRadius: 64, backgroundColor: "#fff", marginBottom: spacing.md },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  name: { color: "#fff", fontSize: 22, fontWeight: "700" },
  username: { color: "#EEE", marginTop: 4, fontSize: 13 },
  card: { backgroundColor: "#fff", margin: spacing.lg, borderRadius: radius.lg, paddingHorizontal: spacing.md },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  lbl: { fontSize: 11, color: colors.muted },
  val: { fontSize: 15, color: colors.onSurface, fontWeight: "500", marginTop: 1 },
  actionOutline: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: spacing.sm, marginHorizontal: spacing.lg, marginTop: spacing.sm, backgroundColor: "#fff", borderRadius: radius.pill, paddingVertical: 14, borderWidth: 1, borderColor: colors.brand + "55" },
  actionOutlineText: { color: colors.brand, fontWeight: "700" },
  stickyWrap: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.lg, paddingTop: 8, backgroundColor: colors.surface },
  logout: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: spacing.sm, backgroundColor: colors.brand, borderRadius: radius.pill, paddingVertical: 16 },
  logoutText: { color: "#fff", fontWeight: "700" },
});
