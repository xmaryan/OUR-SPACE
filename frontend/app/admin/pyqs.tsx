import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { AdminCrud, FieldDef } from "@/src/admin-crud";
import { api } from "@/src/api";

export default function AdminPYQs() {
  const [subjects, setSubjects] = useState<any[]>([]);
  useEffect(() => { (async () => { try { const r = await api.get("/admin/subjects"); setSubjects(r.data); } catch {} })(); }, []);
  if (!subjects.length) return <View style={{ padding: 24 }}><Text>Loading subjects…</Text></View>;

  const fields: FieldDef[] = [
    { key: "title", label: "Title", type: "text" },
    { key: "subject_id", label: "Subject", type: "select",
      options: subjects.map((s) => ({ value: s.id, label: `${s.name} (Sem ${s.semester})` })) },
    { key: "year", label: "Year (e.g. 2024)", type: "number" },
    { key: "url", label: "PDF URL", type: "url" },
  ];
  return (
    <AdminCrud
      title="Previous Year Questions"
      subtitle="Manage PYQ paper collection"
      listEndpoint="/study/pyqs"
      createEndpoint="/admin/pyqs"
      itemEndpoint={(id) => `/admin/pyqs/${id}`}
      fields={fields}
      defaultValues={{ subject_id: subjects[0]?.id, year: new Date().getFullYear() }}
      columns={[
        { key: "title", label: "Title" },
        { key: "subject_name", label: "Subject" },
        { key: "year", label: "Year" },
      ]}
    />
  );
}
