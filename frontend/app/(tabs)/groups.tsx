import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/src/api";
import { colors, spacing, radius } from "@/src/theme";
import { Shimmer } from "@/src/shimmer";

function initials(name: string) {
  const p = name.replace(/^BCA Sem 3 - /, "").split(" ");
  return (p[0]?.[0] ?? "").toUpperCase() + (p[1]?.[0] ?? "").toUpperCase();
}
function timeAgo(iso?: string) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function Groups() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.get("/groups");
      setGroups(r.data);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top }}>
      <View style={styles.header}>
        <Text style={styles.title}>Groups</Text>
        <Text style={styles.sub}>Subject-based academic chats</Text>
      </View>
      {loading ? (
        <View style={{ paddingHorizontal: spacing.lg }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Shimmer key={i} style={{ height: 72, marginBottom: spacing.sm }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.brand} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="chat-outline" size={48} color={colors.muted} />
              <Text style={styles.emptyText}>No groups yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              testID={`group-${item.id}`}
              onPress={() => router.push({ pathname: "/chat/[id]", params: { id: item.id, name: item.name } })}
              style={styles.row}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(item.name)}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.gName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.gLast} numberOfLines={1}>
                  {item.last_message ? `${item.last_message.sender_name}: ${item.last_message.text}` : "Say hi 👋"}
                </Text>
              </View>
              <Text style={styles.time}>{timeAgo(item.last_message?.timestamp)}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  title: { fontSize: 26, fontWeight: "700", color: colors.onSurface },
  sub: { color: colors.muted, marginTop: 2 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#00968833", alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.brandTertiary, fontWeight: "700" },
  gName: { fontWeight: "600", color: colors.onSurface, fontSize: 14 },
  gLast: { color: colors.muted, fontSize: 12, marginTop: 3 },
  time: { color: colors.muted, fontSize: 11 },
  empty: { alignItems: "center", padding: spacing.xxl, gap: spacing.sm },
  emptyText: { color: colors.muted },
});
