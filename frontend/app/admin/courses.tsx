import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { AdminCrud, FieldDef, FilterDef } from "@/src/admin-crud";
import { api } from "@/src/api";

export default function AdminCourses() {
  const [colleges, setColleges] = useState<any[]>([]);
  useEffect(() => { (async () => { const r = await api.get("/admin/list/colleges"); setColleges(r.data); })(); }, []);
  if (!colleges.length) return <View style={{ padding: 24 }}><Text>Loading…</Text></View>;

  const fields: FieldDef[] = [
    { key: "name", label: "Course name (e.g. BCA, B.Tech CSE)", type: "text" },
    { key: "college_id", label: "College", type: "select", options: colleges.map((c) => ({ value: c.id, label: c.name })) },
    { key: "duration_years", label: "Duration (years)", type: "number" },
  ];
  const filters: FilterDef[] = [
    { key: "college_id", label: "College", options: colleges.map((c) => ({ value: c.id, label: c.name })) },
  ];
  const collegeName = (id: string) => colleges.find((c) => c.id === id)?.name ?? id;

  return (
    <AdminCrud
      title="Courses"
      subtitle="Add and manage courses offered at each college."
      listEndpoint="/admin/list/courses"
      createEndpoint="/admin/courses"
      itemEndpoint={(id) => `/admin/courses/${id}`}
      fields={fields}
      filters={filters}
      defaultValues={{ college_id: colleges[0]?.id, duration_years: 3 }}
      columns={[
        { key: "name", label: "Course" },
        { key: "college_id", label: "College", render: (v) => collegeName(v) },
        { key: "duration_years", label: "Duration (yrs)" },
      ]}
    />
  );
}
