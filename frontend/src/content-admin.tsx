import React, { useEffect, useMemo, useState } from "react";
import { View, Text } from "react-native";
import { AdminCrud, FieldDef, FilterDef } from "@/src/admin-crud";
import { api } from "@/src/api";

// Reusable admin content page used by Materials / PYQs / Assignments.
type Kind = "materials" | "pyqs" | "assignments";

const CONFIG: Record<Kind, { title: string; sub: string; listPath: string; createPath: string; itemPath: (id: string) => string; extraFields: FieldDef[]; extraCols: any[] }> = {
  materials: {
    title: "Study Material",
    sub: "Add PDFs, notes, and reference material per subject",
    listPath: "/admin/list/materials",
    createPath: "/admin/materials",
    itemPath: (id) => `/admin/materials/${id}`,
    extraFields: [],
    extraCols: [],
  },
  pyqs: {
    title: "Previous Year Questions",
    sub: "Upload PYQ papers with year",
    listPath: "/admin/list/pyqs",
    createPath: "/admin/pyqs",
    itemPath: (id) => `/admin/pyqs/${id}`,
    extraFields: [{ key: "year", label: "Year (e.g. 2024)", type: "number" }],
    extraCols: [{ key: "year", label: "Year" }],
  },
  assignments: {
    title: "Assignments",
    sub: "Post assignments and their due dates",
    listPath: "/admin/list/assignments",
    createPath: "/admin/assignments",
    itemPath: (id) => `/admin/assignments/${id}`,
    extraFields: [{ key: "due_date", label: "Due date (YYYY-MM-DD)", type: "text" }],
    extraCols: [{ key: "due_date", label: "Due", render: (v: any) => v ? new Date(v).toLocaleDateString() : "" }],
  },
};

export function ContentAdminPage({ kind }: { kind: Kind }) {
  const cfg = CONFIG[kind];
  const [colleges, setColleges] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [cl, co, su] = await Promise.all([
        api.get("/admin/list/colleges"),
        api.get("/admin/list/courses"),
        api.get("/admin/subjects"),
      ]);
      setColleges(cl.data); setCourses(co.data); setSubjects(su.data);
    })();
  }, []);

  const filters: FilterDef[] = useMemo(() => [
    { key: "college_id", label: "College", options: colleges.map((c) => ({ value: c.id, label: c.name })) },
    { key: "course_id", label: "Course", options: courses.map((c) => ({ value: c.id, label: c.name + (colleges.find(cl => cl.id === c.college_id) ? ` (${colleges.find(cl => cl.id === c.college_id)?.short})` : "") })) },
    { key: "semester", label: "Semester", options: [1,2,3,4,5,6,7,8].map((n) => ({ value: String(n), label: `Sem ${n}` })) },
  ], [colleges, courses]);

  const fields: FieldDef[] = [
    { key: "title", label: "Title", type: "text" },
    { key: "college_id", label: "College", type: "select", options: colleges.map((c) => ({ value: c.id, label: c.name })) },
    { key: "course_id", label: "Course", type: "select", options: courses.map((c) => ({ value: c.id, label: c.name })) },
    { key: "semester", label: "Semester", type: "number" },
    { key: "subject_id", label: "Subject", type: "select", options: subjects.map((s) => ({ value: s.id, label: `${s.name} (Sem ${s.semester})` })) },
    ...cfg.extraFields,
    { key: "url", label: "PDF URL (Google Drive or public link)", type: "url" },
  ];

  if (!colleges.length) return <View style={{ padding: 24 }}><Text>Loading…</Text></View>;

  return (
    <AdminCrud
      title={cfg.title}
      subtitle={cfg.sub}
      listEndpoint={cfg.listPath}
      createEndpoint={cfg.createPath}
      itemEndpoint={cfg.itemPath}
      fields={fields}
      filters={filters}
      defaultValues={{ college_id: colleges[0]?.id, course_id: courses[0]?.id, subject_id: subjects[0]?.id, semester: 3 }}
      columns={[
        { key: "title", label: "Title" },
        { key: "subject_name", label: "Subject" },
        { key: "semester", label: "Sem" },
        ...cfg.extraCols,
      ]}
    />
  );
}
