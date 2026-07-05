import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";
import { colors, spacing, radius } from "@/src/theme";

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Chat() {
  const params = useLocalSearchParams<{ id: string; name?: string }>();
  const groupId = params.id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const listRef = useRef<FlatList>(null);
  const timerRef = useRef<any>(null);

  const load = useCallback(async () => {
    try {
      const r = await api.get(`/groups/${groupId}/messages`);
      setMessages(r.data);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
    } catch {}
  }, [groupId]);

  useEffect(() => {
    load();
    timerRef.current = setInterval(load, 2500);
    return () => clearInterval(timerRef.current);
  }, [load]);

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    try {
      const r = await api.post(`/groups/${groupId}/messages`, { text: t });
      setMessages((m) => [...m, r.data]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch {}
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="chat-back" onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <View style={styles.headAvatar}><MaterialCommunityIcons name="account-group" size={20} color="#fff" /></View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text numberOfLines={1} style={styles.hName}>{params.name ?? "Group"}</Text>
          <Text style={styles.hSub}>Tap for group info</Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.sm }}
        renderItem={({ item }) => {
          const mine = item.sender_id === user?.id;
          return (
            <View testID={`msg-${item.id}`} style={[styles.bubbleWrap, mine ? styles.mineWrap : styles.otherWrap]}>
              {!mine && <Text style={styles.sender}>{item.sender_name}</Text>}
              <View style={[styles.bubble, mine ? styles.mine : styles.other]}>
                <Text style={[styles.bubbleText, mine && { color: "#fff" }]}>{item.text}</Text>
                <Text style={[styles.time, mine && { color: "#EEE" }]}>{fmt(item.timestamp)}</Text>
              </View>
            </View>
          );
        }}
      />

      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.inputWrap}>
          <TextInput
            testID="chat-input"
            value={text}
            onChangeText={setText}
            placeholder="Type a message"
            placeholderTextColor={colors.muted}
            style={styles.input}
            multiline
          />
        </View>
        <Pressable testID="chat-send" onPress={send} style={styles.sendBtn}>
          <MaterialCommunityIcons name="send" size={20} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.md, backgroundColor: colors.brand },
  headAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#ffffff33", alignItems: "center", justifyContent: "center" },
  hName: { color: "#fff", fontWeight: "700", fontSize: 15 },
  hSub: { color: "#DDD", fontSize: 11 },
  bubbleWrap: { marginBottom: spacing.sm, maxWidth: "80%" },
  mineWrap: { alignSelf: "flex-end", alignItems: "flex-end" },
  otherWrap: { alignSelf: "flex-start", alignItems: "flex-start" },
  sender: { fontSize: 11, color: colors.brand, fontWeight: "700", marginBottom: 3, marginLeft: 6 },
  bubble: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.lg },
  mine: { backgroundColor: colors.brand, borderBottomRightRadius: 4 },
  other: { backgroundColor: "#fff", borderBottomLeftRadius: 4 },
  bubbleText: { color: colors.onSurface, fontSize: 14 },
  time: { fontSize: 10, color: colors.muted, marginTop: 4, alignSelf: "flex-end" },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm, paddingHorizontal: spacing.md, paddingTop: 8, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: colors.divider },
  inputWrap: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 8, maxHeight: 100 },
  input: { color: colors.onSurface, fontSize: 15, minHeight: 24 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
});
