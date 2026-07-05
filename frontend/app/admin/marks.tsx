import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "@/src/api";
import { colors, spacing, radius } from "@/src/theme";
import { Shimmer } from "@/src/shimmer";

const GRADES = ["A+", "A", "B+", "B", "C", "D", "F"];

export default function AdminMarks() {
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({});
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await api.get("/admin/students");
        const sub = await api.get("/admin/subjects");
        setStudents(s.data); setSubjects(sub.data);
        if (s.data[0]) setSelected(s.data[0].id);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => { if (selected) loadMarks(); }, [selected]);

  const loadMarks = async () => {
    if (!selected) return;
    try { const r = await api.get(`/admin/marks/${selected}`); setMarks(r.data); }
    catch {}
  };

  const openNew = () => {
    setEditing(null);
    setForm({ user_id: selected, subject_id: subjects[0]?.id, internal: 0, external: 0, total: 0, grade: "A" });
    setShowForm(true); setMsg(null);
  };
  const openEdit = (m: any) => { setEditing(m); setForm({ ...m }); setShowForm(true); setMsg(null); };

  const submit = async () => {
    setBusy(true); setMsg(null);
    try {
      const payload = { ...form, internal: parseInt(form.internal, 10), external: parseInt(form.external, 10), total: parseInt(form.total, 10) };
      if (editing) await api.put(`/admin/marks/${editing.id}`, payload);
      else await api.post("/admin/marks", payload);
      setShowForm(false); await loadMarks();
      setMsg({ ok: true, text: editing ? "Updated" : "Added" });
    } catch (e: any) { setMsg({ ok: false, text: e?.response?.data?.detail ?? "Save failed" }); }
    finally { setBusy(false); }
  };

  const remove = async (m: any) => {
    if (!confirm(`Delete marks for ${m.subject_name}?`)) return;
    try { await api.delete(`/admin/marks/${m.id}`); await loadMarks(); } catch {}
  };

  const stu = students.find((s) => s.id === selected);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
        <Text style={styles.h1}>Marks</Text>
        <Text style={styles.sub}>Manage per-student subject marks</Text>

        <Text style={styles.section}>Select student</Text>
        {loading ? <Shimmer style={{ height: 40 }} /> : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {students.map((s) => (
              <Pressable key={s.id} onPress={() => setSelected(s.id)} style={[styles.stuPill, selected === s.id && styles.stuPillOn]}>
                <Text style={[styles.stuPillText, selected === s.id && { color: "#fff" }]}>{s.full_name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {stu && (
          <View style={styles.stuBox}>
            <Text style={styles.stuName}>{stu.full_name}</Text>
            <Text style={styles.stuMeta}>@{stu.username} • {stu.roll_number} • Sem {stu.semester}</Text>
          </View>
        )}

        <View style={styles.topRow}>
          <Text style={styles.section2}>Subject-wise marks</Text>
          <Pressable onPress={openNew} style={styles.newBtn}>
            <MaterialCommunityIcons name="plus" size={14} color="#fff" />
            <Text style={styles.newBtnText}>Add mark</Text>
          </Pressable>
        </View>

        {msg && <View style={[styles.msg, { backgroundColor: msg.ok ? "#DCF6DC" : "#FDECEA" }]}>
          <Text style={{ color: msg.ok ? colors.success : colors.error, fontSize: 13 }}>{msg.text}</Text>
        </View>}

        {marks.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="chart-line" size={40} color={colors.muted} />
            <Text style={{ color: colors.muted }}>No marks for this student yet</Text>
          </View>
        ) : (
          <View style={styles.table}>
            <View style={[styles.row, styles.rowHead]}>
              <Text style={[styles.cell, styles.cellHead, { flex: 2 }]}>Subject</Text>
              <Text style={[styles.cell, styles.cellHead]}>Internal</Text>
              <Text style={[styles.cell, styles.cellHead]}>External</Text>
              <Text style={[styles.cell, styles.cellHead]}>Total</Text>
              <Text style={[styles.cell, styles.cellHead]}>Grade</Text>
              <Text style={[styles.cell, styles.cellHead, { flex: 0, width: 80, textAlign: "right" }]}>Actions</Text>
            </View>
            {marks.map((m) => (
              <View key={m.id} style={styles.row}>
                <Text style={[styles.cell, { flex: 2 }]}>{m.subject_name} <Text style={{ color: colors.muted, fontSize: 11 }}>({m.subject_code})</Text></Text>
                <Text style={styles.cell}>{m.internal}</Text>
                <Text style={styles.cell}>{m.external}</Text>
                <Text style={styles.cell}>{m.total}</Text>
                <Text style={[styles.cell, { fontWeight: "700", color: colors.brand }]}>{m.grade}</Text>
                <View style={[styles.cell, { flex: 0, width: 80, flexDirection: "row", justifyContent: "flex-end", gap: 8 }]}>
                  <Pressable onPress={() => openEdit(m)} hitSlop={8}><MaterialCommunityIcons name="pencil" size={16} color={colors.brand} /></Pressable>
                  <Pressable onPress={() => remove(m)} hitSlop={8}><MaterialCommunityIcons name="delete" size={16} color={colors.error} /></Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {showForm && (
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>{editing ? "Edit" : "Add"} mark</Text>
              <Pressable onPress={() => setShowForm(false)} hitSlop={8}>
                <MaterialCommunityIcons name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
              <Text style={styles.fLbl}>Subject</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 8 }}>
                {subjects.map((s) => (
                  <Pressable key={s.id} onPress={() => setForm((f: any) => ({ ...f, subject_id: s.id }))}
                    style={[styles.selPill, form.subject_id === s.id && styles.selPillOn]}>
                    <Text style={[styles.selPillText, form.subject_id === s.id && { color: "#fff" }]}>{s.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <NumField label="Internal marks" v={form.internal} on={(v: string) => setForm((f: any) => ({ ...f, internal: v }))} />
              <NumField label="External marks" v={form.external} on={(v: string) => setForm((f: any) => ({ ...f, external: v }))} />
              <NumField label="Total marks" v={form.total} on={(v: string) => setForm((f: any) => ({ ...f, total: v }))} />
              <Text style={styles.fLbl}>Grade</Text>
              <View style={styles.selectRow}>
                {GRADES.map((g) => (
                  <Pressable key={g} onPress={() => setForm((f: any) => ({ ...f, grade: g }))}
                    style={[styles.selPill, form.grade === g && styles.selPillOn]}>
                    <Text style={[styles.selPillText, form.grade === g && { color: "#fff", fontWeight: "700" }]}>{g}</Text>
                  </Pressable>
                ))}
              </View>
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

function NumField({ label, v, on }: any) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.fLbl}>{label}</Text>
      <TextInput value={String(v ?? "")} onChangeText={on} keyboardType="number-pad" placeholderTextColor={colors.muted} style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: "800", color: colors.onSurface },
  sub: { color: colors.muted, marginTop: 2, marginBottom: spacing.lg },
  section: { fontSize: 12, color: colors.muted, textTransform: "uppercase", fontWeight: "700", marginBottom: 8, marginTop: 4 },
  section2: { fontSize: 15, fontWeight: "700", color: colors.onSurface },
  stuPill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border },
  stuPillOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  stuPillText: { color: colors.onSurfaceSecondary, fontSize: 13 },
  stuBox: { backgroundColor: "#EDE7F6", padding: spacing.md, borderRadius: radius.md, marginTop: spacing.md },
  stuName: { fontWeight: "700", color: colors.onSurface, fontSize: 15 },
  stuMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.xl, marginBottom: spacing.sm },
  newBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.brand, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  newBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  msg: { padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md },
  empty: { alignItems: "center", padding: spacing.xxl, gap: spacing.sm },
  table: { backgroundColor: "#fff", borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: "row", paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider, alignItems: "center", gap: spacing.sm },
  rowHead: { backgroundColor: "#F5F1FA" },
  cell: { flex: 1, color: colors.onSurface, fontSize: 13 },
  cellHead: { fontWeight: "700", color: colors.brand, fontSize: 11, textTransform: "uppercase" },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: spacing.lg },
  modal: { backgroundColor: "#fff", borderRadius: radius.lg, width: "100%", maxWidth: 500, maxHeight: "90%" },
  modalHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.divider },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.onSurface },
  fLbl: { fontSize: 12, color: colors.muted, marginBottom: 6, textTransform: "uppercase", fontWeight: "600" },
  input: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, fontSize: 14, borderWidth: 1, borderColor: colors.border, color: colors.onSurface },
  selectRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  selPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border },
  selPillOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  selPillText: { color: colors.onSurfaceSecondary, fontSize: 12 },
  saveBtn: { backgroundColor: colors.brand, borderRadius: radius.pill, paddingVertical: 14, alignItems: "center", marginTop: spacing.md },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
