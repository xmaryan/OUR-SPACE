import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, FlatList, RefreshControl, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/src/api";
import { colors, spacing, radius, categoryColors } from "@/src/theme";
import { Shimmer } from "@/src/shimmer";

const CATS = ["All", "Announcements", "Exams", "Events", "Holidays", "Circulars", "Placements", "Achievements"];

export default function Notices() {
  const insets = useSafeAreaInsets();
  const [cat, setCat] = useState("All");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/notices", { params: { category: cat } });
      setItems(r.data);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cat]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top }}>
      <View style={styles.header}>
        <Text style={styles.title}>Notices</Text>
        <Text style={styles.sub}>Latest campus updates</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={{ maxHeight: 56, minHeight: 56 }}
      >
        {CATS.map((c) => {
          const on = cat === c;
          const tint = c === "All" ? colors.brand : categoryColors[c] ?? colors.brand;
          return (
            <Pressable
              key={c}
              testID={`notice-cat-${c}`}
              onPress={() => setCat(c)}
              style={[styles.chip, on && { backgroundColor: tint, borderColor: tint }]}
            >
              <Text style={[styles.chipText, on && { color: "#fff" }]}>{c}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Shimmer key={i} style={{ height: 96, marginBottom: spacing.md }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, paddingTop: 4 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.brand} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={colors.muted} />
              <Text style={styles.emptyText}>No notices in this category</Text>
            </View>
          }
          renderItem={({ item }) => {
            const tint = categoryColors[item.category] ?? colors.brand;
            return (
              <View testID={`notice-${item.id}`} style={styles.card}>
                <View style={styles.top}>
                  <View style={[styles.tag, { backgroundColor: tint + "22" }]}>
                    <Text style={[styles.tagText, { color: tint }]}>{item.category}</Text>
                  </View>
                  <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.h}>{item.title}</Text>
                <Text style={styles.desc} numberOfLines={3}>{item.description}</Text>
                <Text style={styles.author}>— {item.author}</Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  title: { fontSize: 26, fontWeight: "700", color: colors.onSurface },
  sub: { color: colors.muted, marginTop: 2 },
  chipRow: { paddingHorizontal: spacing.lg, gap: spacing.sm, alignItems: "center", height: 56 },
  chip: {
    flexShrink: 0, height: 36, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: "#fff",
    borderWidth: 1, borderColor: colors.border,
  },
  chipText: { color: colors.onSurfaceSecondary, fontWeight: "600", fontSize: 13 },
  card: { backgroundColor: "#fff", borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  tagText: { fontSize: 11, fontWeight: "700" },
  date: { color: colors.muted, fontSize: 12 },
  h: { fontWeight: "700", color: colors.onSurface, fontSize: 15, marginBottom: 4 },
  desc: { color: colors.onSurfaceSecondary, fontSize: 13, lineHeight: 18 },
  author: { color: colors.muted, fontSize: 12, marginTop: 8, fontStyle: "italic" },
  empty: { alignItems: "center", padding: spacing.xxl, gap: spacing.sm },
  emptyText: { color: colors.muted },
});
