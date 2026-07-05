import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, FlatList } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { api } from "@/src/api";
import { colors, spacing, radius } from "@/src/theme";
import { Shimmer } from "@/src/shimmer";

const TABS = [
  { key: "material", label: "Material", endpoint: "/study/material", icon: "book-open-page-variant" },
  { key: "pyq", label: "PYQ", endpoint: "/study/pyqs", icon: "file-document" },
  { key: "assignments", label: "Assignments", endpoint: "/study/assignments", icon: "clipboard-text" },
] as const;

export default function Study() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [active, setActive] = useState<string>(params.tab ?? "material");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    const tab = TABS.find((t) => t.key === active)!;
    try {
      const r = await api.get(tab.endpoint);
      setItems(r.data);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [active]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top }}>
      <View style={styles.header}>
        <Text style={styles.hTitle}>Study</Text>
        <Text style={styles.hSub}>Materials, PYQs & assignments</Text>
      </View>

      {/* Tabs (chip row - sticky, 56pt) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={{ maxHeight: 56, minHeight: 56 }}
      >
        {TABS.map((t) => {
          const on = active === t.key;
          return (
            <Pressable
              key={t.key}
              testID={`study-tab-${t.key}`}
              onPress={() => setActive(t.key)}
              style={[styles.chip, on && styles.chipOn]}
            >
              <MaterialCommunityIcons name={t.icon as any} size={16} color={on ? "#fff" : colors.brand} />
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Shimmer key={i} style={{ height: 72, marginBottom: spacing.md }} />
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
              <MaterialCommunityIcons name="folder-open-outline" size={48} color={colors.muted} />
              <Text style={styles.emptyText}>No documents yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              testID={`doc-${item.id}`}
              onPress={() => WebBrowser.openBrowserAsync(item.url)}
              style={styles.pdfCard}
            >
              <View style={styles.pdfIcon}>
                <MaterialCommunityIcons name="file-pdf-box" size={22} color={colors.brand} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.pdfTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.pdfSub}>
                  {item.subject_name}
                  {item.year ? ` • ${item.year}` : ""}
                  {item.due_date ? ` • due ${new Date(item.due_date).toLocaleDateString()}` : ""}
                </Text>
              </View>
              <MaterialCommunityIcons name="open-in-new" size={20} color={colors.brand} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  hTitle: { fontSize: 26, fontWeight: "700", color: colors.onSurface },
  hSub: { color: colors.muted, marginTop: 2 },
  chipRow: { paddingHorizontal: spacing.lg, gap: spacing.sm, alignItems: "center", height: 56 },
  chip: {
    flexShrink: 0, height: 36, flexDirection: "row", gap: 6, alignItems: "center",
    paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: "#fff",
    borderWidth: 1, borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { color: colors.brand, fontWeight: "600", fontSize: 13 },
  chipTextOn: { color: "#fff" },
  pdfCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  pdfIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#3F51B522", alignItems: "center", justifyContent: "center" },
  pdfTitle: { fontWeight: "600", color: colors.onSurface, fontSize: 14 },
  pdfSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  empty: { alignItems: "center", padding: spacing.xxl, gap: spacing.sm },
  emptyText: { color: colors.muted },
});
