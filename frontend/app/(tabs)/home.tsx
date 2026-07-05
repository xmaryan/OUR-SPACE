import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";
import { colors, spacing, radius, categoryColors } from "@/src/theme";
import { Shimmer } from "@/src/shimmer";

export default function Home() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.get("/dashboard");
      setData(r.data);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const quickActions = [
    { key: "marks", label: "Marks", icon: "chart-line", color: "#3F51B5", onPress: () => router.push("/marks") },
    { key: "study", label: "Study Material", icon: "book-open", color: "#7E57C2", onPress: () => router.push("/(tabs)/study?tab=material") },
    { key: "pyqs", label: "PYQs", icon: "file-document", color: "#009688", onPress: () => router.push("/(tabs)/study?tab=pyq") },
    { key: "assignments", label: "Assignments", icon: "clipboard-text", color: "#B3261E", onPress: () => router.push("/(tabs)/study?tab=assignments") },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.brand} />}
    >
      {/* Hero */}
      <View style={{ paddingTop: insets.top, backgroundColor: colors.surface }}>
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1770134233415-de8146868a24?w=1200&q=80" }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
          />
          <LinearGradient colors={["rgba(63,81,181,0.85)", "rgba(126,87,194,0.92)"]} style={StyleSheet.absoluteFillObject} />
          <View style={styles.heroContent}>
            <Text style={styles.hi}>Welcome back,</Text>
            <Text testID="home-user-name" style={styles.name}>{user?.full_name ?? "Student"}</Text>
            <Text style={styles.rollTxt}>Sem {user?.semester} • {user?.roll_number}</Text>
          </View>
        </View>
      </View>

      {/* Today's timetable */}
      <Section title="Today's Timetable" icon="calendar-clock">
        {loading ? <Shimmer style={{ height: 120, marginHorizontal: spacing.lg }} /> : (
          <View style={styles.card}>
            {(data?.timetable?.today ?? []).map((r: any, i: number) => (
              <View key={i} style={styles.tRow}>
                <View style={styles.tTime}><Text style={styles.tTimeText}>{r.time.split(" - ")[0]}</Text></View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.tSubj}>{r.subject}</Text>
                  <Text style={styles.tRoom}>{r.room}</Text>
                </View>
              </View>
            ))}
            {(!data?.timetable?.today || data.timetable.today.length === 0) && <Text style={styles.empty}>No classes today</Text>}
          </View>
        )}
      </Section>

      {/* Quick actions */}
      <Section title="Quick Actions" icon="lightning-bolt">
        <View style={styles.grid}>
          {quickActions.map((a) => (
            <Pressable key={a.key} testID={`qa-${a.key}`} onPress={a.onPress} style={({ pressed }) => [styles.gridCard, pressed && { transform: [{ scale: 0.98 }] }]}>
              <View style={[styles.gridIcon, { backgroundColor: a.color + "22" }]}>
                <MaterialCommunityIcons name={a.icon as any} size={26} color={a.color} />
              </View>
              <Text style={styles.gridLbl}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </Section>

      {/* Latest notices */}
      <Section title="Latest Notices" icon="bell-outline" action={{ label: "See all", onPress: () => router.push("/(tabs)/notices") }}>
        {loading ? <Shimmer style={{ height: 160, marginHorizontal: spacing.lg }} /> :
          (data?.notices ?? []).map((n: any) => (
            <View key={n.id} style={styles.card}>
              <View style={styles.noticeTop}>
                <View style={[styles.catTag, { backgroundColor: (categoryColors[n.category] ?? colors.brand) + "22" }]}>
                  <Text style={[styles.catTagText, { color: categoryColors[n.category] ?? colors.brand }]}>{n.category}</Text>
                </View>
                <Text style={styles.date}>{new Date(n.date).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.noticeTitle} numberOfLines={2}>{n.title}</Text>
              <Text style={styles.noticeDesc} numberOfLines={2}>{n.description}</Text>
            </View>
          ))
        }
      </Section>

      {/* Upcoming assignments */}
      <Section title="Upcoming Assignments" icon="clipboard-clock">
        {loading ? <Shimmer style={{ height: 120, marginHorizontal: spacing.lg }} /> :
          (data?.assignments ?? []).map((a: any) => (
            <Pressable key={a.id} onPress={() => WebBrowser.openBrowserAsync(a.url)} style={styles.card}>
              <View style={styles.pdfRow}>
                <View style={[styles.pdfIcon, { backgroundColor: "#B3261E22" }]}>
                  <MaterialCommunityIcons name="clipboard-text" size={22} color="#B3261E" />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.pdfTitle} numberOfLines={1}>{a.title}</Text>
                  <Text style={styles.pdfSub}>{a.subject_name} • due {new Date(a.due_date).toLocaleDateString()}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
              </View>
            </Pressable>
          ))
        }
      </Section>

      {/* Recently added materials */}
      <Section title="Recently Added Study Material" icon="book-open">
        {loading ? <Shimmer style={{ height: 120, marginHorizontal: spacing.lg }} /> :
          (data?.materials ?? []).map((m: any) => (
            <Pressable key={m.id} onPress={() => WebBrowser.openBrowserAsync(m.url)} style={styles.card}>
              <View style={styles.pdfRow}>
                <View style={[styles.pdfIcon, { backgroundColor: "#3F51B522" }]}>
                  <MaterialCommunityIcons name="file-pdf-box" size={22} color={colors.brand} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.pdfTitle} numberOfLines={1}>{m.title}</Text>
                  <Text style={styles.pdfSub}>{m.subject_name}</Text>
                </View>
                <MaterialCommunityIcons name="open-in-new" size={20} color={colors.muted} />
              </View>
            </Pressable>
          ))
        }
      </Section>
    </ScrollView>
  );
}

function Section({ title, icon, action, children }: any) {
  return (
    <View style={{ marginTop: spacing.lg }}>
      <View style={styles.secHead}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <MaterialCommunityIcons name={icon} size={18} color={colors.brand} />
          <Text style={styles.secTitle}>{title}</Text>
        </View>
        {action && <Pressable onPress={action.onPress}><Text style={styles.linkTxt}>{action.label}</Text></Pressable>}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  heroWrap: { marginHorizontal: spacing.lg, height: 170, borderRadius: radius.lg, overflow: "hidden", marginTop: spacing.sm },
  heroContent: { flex: 1, justifyContent: "flex-end", padding: spacing.lg },
  hi: { color: "#EEE", fontSize: 14 },
  name: { color: "#fff", fontSize: 24, fontWeight: "700", marginTop: 2 },
  rollTxt: { color: "#F0F0F0", fontSize: 13, marginTop: 4 },
  secHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  secTitle: { fontSize: 15, fontWeight: "700", color: colors.onSurface },
  linkTxt: { color: colors.brand, fontWeight: "600", fontSize: 13 },
  card: { backgroundColor: "#fff", marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderRadius: radius.lg, padding: spacing.md, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  tRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  tTime: { width: 60, alignItems: "center", justifyContent: "center", padding: 4, borderRadius: radius.sm, backgroundColor: "#EDE7F6" },
  tTimeText: { color: colors.brand, fontWeight: "700", fontSize: 12 },
  tSubj: { fontWeight: "600", color: colors.onSurface, fontSize: 14 },
  tRoom: { color: colors.muted, fontSize: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: spacing.lg, gap: spacing.md },
  gridCard: { flexGrow: 1, flexBasis: "45%", backgroundColor: "#fff", borderRadius: radius.lg, padding: spacing.md, alignItems: "flex-start", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  gridIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  gridLbl: { fontWeight: "600", color: colors.onSurface, fontSize: 14 },
  noticeTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  catTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  catTagText: { fontSize: 11, fontWeight: "700" },
  date: { fontSize: 11, color: colors.muted },
  noticeTitle: { fontWeight: "700", fontSize: 14, color: colors.onSurface, marginBottom: 2 },
  noticeDesc: { fontSize: 12, color: colors.onSurfaceSecondary },
  pdfRow: { flexDirection: "row", alignItems: "center" },
  pdfIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  pdfTitle: { fontWeight: "600", color: colors.onSurface, fontSize: 14 },
  pdfSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  empty: { textAlign: "center", color: colors.muted, padding: spacing.md },
});
