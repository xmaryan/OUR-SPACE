import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { AdminCrud, FieldDef } from "@/src/admin-crud";
import { api } from "@/src/api";

export default function AdminAssignments() {
  const [subjects, setSubjects] = useState<any[]>([]);
  useEffect(() => { (async () => { try { const r = await api.get("/admin/subjects"); setSubjects(r.data); } catch {} })(); }, []);
  if (!subjects.length) return <View style={{ padding: 24 }}><Text>Loading subjects…</Text></View>;

  const fields: FieldDef[] = [
    { key: "title", label: "Assignment title", type: "text" },
    { key: "subject_id", label: "Subject", type: "select",
      options: subjects.map((s) => ({ value: s.id, label: `${s.name} (Sem ${s.semester})` })) },
    { key: "due_date", label: "Due date (YYYY-MM-DD)", type: "text" },
    { key: "url", label: "Assignment PDF / brief URL", type: "url" },
  ];
  return (
    <AdminCrud
      title="Assignments"
      subtitle="Post assignments and their due dates"
      listEndpoint="/study/assignments"
      createEndpoint="/admin/assignments"
      itemEndpoint={(id) => `/admin/assignments/${id}`}
      fields={fields}
      defaultValues={{ subject_id: subjects[0]?.id }}
      columns={[
        { key: "title", label: "Title" },
        { key: "subject_name", label: "Subject" },
        { key: "due_date", label: "Due", render: (v) => v ? new Date(v).toLocaleDateString() : "" },
      ]}
    />
  );
}
