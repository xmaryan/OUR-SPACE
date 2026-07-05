import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { AdminCrud, FieldDef } from "@/src/admin-crud";
import { api } from "@/src/api";

export default function AdminMaterials() {
  const [subjects, setSubjects] = useState<any[]>([]);
  useEffect(() => { (async () => { try { const r = await api.get("/admin/subjects"); setSubjects(r.data); } catch {} })(); }, []);
  if (!subjects.length) return <View style={{ padding: 24 }}><Text>Loading subjects…</Text></View>;

  const fields: FieldDef[] = [
    { key: "title", label: "Title", type: "text" },
    { key: "subject_id", label: "Subject", type: "select",
      options: subjects.map((s) => ({ value: s.id, label: `${s.name} (Sem ${s.semester})` })) },
    { key: "url", label: "PDF URL (Google Drive or any public link)", type: "url" },
    { key: "semester", label: "Semester", type: "number" },
  ];
  return (
    <AdminCrud
      title="Study Material"
      subtitle="Add PDFs, notes, and reference material"
      listEndpoint="/study/material"
      createEndpoint="/admin/materials"
      itemEndpoint={(id) => `/admin/materials/${id}`}
      fields={fields}
      defaultValues={{ subject_id: subjects[0]?.id, semester: 3 }}
      columns={[
        { key: "title", label: "Title" },
        { key: "subject_name", label: "Subject" },
        { key: "semester", label: "Sem" },
        { key: "url", label: "URL", render: (v) => v ? v.slice(0, 40) + "…" : "" },
      ]}
    />
  );
}
