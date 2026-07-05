import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "@/src/api";
import { colors, spacing, radius } from "@/src/theme";
import { Shimmer } from "./shimmer";

export type FieldDef =
  | { key: string; label: string; type: "text" | "textarea" | "url" | "number" | "date" }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[] };

export type FilterDef = {
  key: string;
  label: string;
  allLabel?: string;
  options: { value: string; label: string }[];
};

type Props = {
  title: string;
  subtitle: string;
  listEndpoint: string;
  createEndpoint: string;
  itemEndpoint: (id: string) => string;
  fields: FieldDef[];
  columns: { key: string; label: string; render?: (v: any, item: any) => string }[];
  defaultValues?: Record<string, any>;
  filters?: FilterDef[];  // shown as pill selectors above the table
};

export function AdminCrud({ title, subtitle, listEndpoint, createEndpoint, itemEndpoint,
  fields, columns, defaultValues = {}, filters = [] }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [filterState, setFilterState] = useState<Record<string, string>>({});

  const queryString = useMemo(() => {
    const parts: string[] = [];
    Object.entries(filterState).forEach(([k, v]) => { if (v) parts.push(`${k}=${encodeURIComponent(v)}`); });
    return parts.length ? "?" + parts.join("&") : "";
  }, [filterState]);

  const load = async () => {
    setLoading(true);
    try { const r = await api.get(listEndpoint + queryString); setItems(r.data); }
    catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [listEndpoint, queryString]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...defaultValues, ...filterState });
    setShowForm(true); setMsg(null);
  };
  const openEdit = (it: any) => { setEditing(it); setForm({ ...defaultValues, ...it }); setShowForm(true); setMsg(null); };

  const submit = async () => {
    setBusy(true); setMsg(null);
    try {
      const payload: any = { ...form };
      fields.forEach((f) => {
        if (f.type === "number" && payload[f.key] !== undefined && payload[f.key] !== "") {
          payload[f.key] = parseInt(String(payload[f.key]), 10);
        }
      });
      if (editing) await api.put(itemEndpoint(editing.id), payload);
      else await api.post(createEndpoint, payload);
      setMsg({ ok: true, text: editing ? "Updated" : "Created" });
      setShowForm(false);
      await load();
    } catch (e: any) {
      setMsg({ ok: false, text: e?.response?.data?.detail ?? "Save failed" });
    } finally { setBusy(false); }
  };

  const remove = async (it: any) => {
    if (!confirm(`Delete "${it.title ?? it.name ?? it.id}"?`)) return;
    try { await api.delete(itemEndpoint(it.id)); await load(); }
    catch (e: any) { setMsg({ ok: false, text: e?.response?.data?.detail ?? "Delete failed" }); }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.h1}>{title}</Text>
            <Text style={styles.sub}>{subtitle}</Text>
          </View>
          <Pressable onPress={openNew} style={styles.newBtn}>
            <MaterialCommunityIcons name="plus" size={16} color="#fff" />
            <Text style={styles.newBtnText}>Add new</Text>
          </Pressable>
        </View>

        {filters.length > 0 && (
          <View style={styles.filterBox}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm }}>
              <MaterialCommunityIcons name="filter-variant" size={18} color={colors.brand} />
              <Text style={styles.filterHead}>Filters</Text>
              {Object.values(filterState).some(Boolean) && (
                <Pressable onPress={() => setFilterState({})} hitSlop={8}>
                  <Text style={styles.clearLink}>Clear all</Text>
                </Pressable>
              )}
            </View>
            {filters.map((f) => (
              <View key={f.key} style={{ marginBottom: spacing.sm }}>
                <Text style={styles.filterLbl}>{f.label}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  <Pressable onPress={() => setFilterState((s) => ({ ...s, [f.key]: "" }))}
                    style={[styles.fPill, !filterState[f.key] && styles.fPillOn]}>
                    <Text style={[styles.fPillText, !filterState[f.key] && { color: "#fff" }]}>{f.allLabel ?? "All"}</Text>
                  </Pressable>
                  {f.options.map((o) => {
                    const on = filterState[f.key] === o.value;
                    return (
                      <Pressable key={o.value} onPress={() => setFilterState((s) => ({ ...s, [f.key]: o.value }))}
                        style={[styles.fPill, on && styles.fPillOn]}>
                        <Text style={[styles.fPillText, on && { color: "#fff" }]}>{o.label}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ))}
          </View>
        )}

        {msg && <View style={[styles.msg, { backgroundColor: msg.ok ? "#DCF6DC" : "#FDECEA" }]}>
          <Text style={{ color: msg.ok ? colors.success : colors.error, fontSize: 13 }}>{msg.text}</Text>
        </View>}

        {loading ? (
          <>{Array.from({ length: 4 }).map((_, i) => <Shimmer key={i} style={{ height: 60, marginBottom: 8 }} />)}</>
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="folder-open-outline" size={48} color={colors.muted} />
            <Text style={{ color: colors.muted }}>No items match. Click "Add new" to create one.</Text>
          </View>
        ) : (
          <View style={styles.table}>
            <View style={[styles.row, styles.rowHead]}>
              {columns.map((c) => <Text key={c.key} style={[styles.cell, styles.cellHead]}>{c.label}</Text>)}
              <Text style={[styles.cell, styles.cellHead, { flex: 0, width: 100, textAlign: "right" }]}>Actions</Text>
            </View>
            {items.map((it) => (
              <View key={it.id} style={styles.row}>
                {columns.map((c) => (
                  <Text key={c.key} style={styles.cell} numberOfLines={2}>
                    {c.render ? c.render(it[c.key], it) : String(it[c.key] ?? "")}
                  </Text>
                ))}
                <View style={[styles.cell, { flex: 0, width: 100, flexDirection: "row", justifyContent: "flex-end", gap: 8 }]}>
                  <Pressable onPress={() => openEdit(it)} hitSlop={8}>
                    <MaterialCommunityIcons name="pencil" size={18} color={colors.brand} />
                  </Pressable>
                  <Pressable onPress={() => remove(it)} hitSlop={8}>
                    <MaterialCommunityIcons name="delete" size={18} color={colors.error} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {showForm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>{editing ? "Edit" : "New"} {title.replace(/s$/, "")}</Text>
              <Pressable onPress={() => setShowForm(false)} hitSlop={8}>
                <MaterialCommunityIcons name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
              {fields.map((f) => (
                <View key={f.key} style={{ marginBottom: spacing.md }}>
                  <Text style={styles.fLbl}>{f.label}</Text>
                  {f.type === "select" ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 4 }}>
                      {f.options.map((o) => {
                        const on = form[f.key] === o.value;
                        return (
                          <Pressable key={o.value} onPress={() => setForm((s) => ({ ...s, [f.key]: o.value }))}
                            style={[styles.selPill, on && styles.selPillOn]}>
                            <Text style={[styles.selPillText, on && { color: "#fff" }]}>{o.label}</Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  ) : (
                    <TextInput
                      value={form[f.key] !== undefined ? String(form[f.key]) : ""}
                      onChangeText={(v) => setForm((s) => ({ ...s, [f.key]: v }))}
                      placeholder={f.type === "url" ? "https://..." : f.label}
                      placeholderTextColor={colors.muted}
                      multiline={f.type === "textarea"}
                      keyboardType={f.type === "number" ? "number-pad" : "default"}
                      style={[styles.input, f.type === "textarea" && { height: 100, textAlignVertical: "top" }]}
                    />
                  )}
                </View>
              ))}
              <Pressable onPress={submit} style={styles.saveBtn} disabled={busy}>
                <Text style={styles.saveBtnText}>{busy ? "Saving..." : "Save"}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg },
  h1: { fontSize: 26, fontWeight: "800", color: colors.onSurface },
  sub: { color: colors.muted, marginTop: 2 },
  newBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.brand, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 10 },
  newBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  filterBox: { backgroundColor: "#fff", borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  filterHead: { fontWeight: "700", color: colors.brand, fontSize: 13 },
  clearLink: { marginLeft: "auto", color: colors.error, fontSize: 12, fontWeight: "600" },
  filterLbl: { fontSize: 11, color: colors.muted, marginBottom: 6, textTransform: "uppercase", fontWeight: "700" },
  fPill: { flexShrink: 0, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border },
  fPillOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  fPillText: { color: colors.onSurfaceSecondary, fontSize: 12 },
  msg: { padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md },
  table: { backgroundColor: "#fff", borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: "row", paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider, gap: spacing.md, alignItems: "center" },
  rowHead: { backgroundColor: "#F5F1FA" },
  cell: { flex: 1, color: colors.onSurface, fontSize: 13 },
  cellHead: { fontWeight: "700", color: colors.brand, fontSize: 12, textTransform: "uppercase" },
  empty: { alignItems: "center", padding: spacing.xxl, gap: spacing.sm },
  modalOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: spacing.lg },
  modal: { backgroundColor: "#fff", borderRadius: radius.lg, width: "100%", maxWidth: 560, maxHeight: "90%" },
  modalHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.divider },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.onSurface },
  fLbl: { fontSize: 12, color: colors.muted, marginBottom: 6, textTransform: "uppercase", fontWeight: "600" },
  input: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, color: colors.onSurface, fontSize: 14, borderWidth: 1, borderColor: colors.border },
  selPill: { flexShrink: 0, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border },
  selPillOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  selPillText: { color: colors.onSurfaceSecondary, fontSize: 12 },
  saveBtn: { backgroundColor: colors.brand, borderRadius: radius.pill, paddingVertical: 14, alignItems: "center", marginTop: spacing.md },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
