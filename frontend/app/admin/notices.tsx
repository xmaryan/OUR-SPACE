import React, { useEffect, useState } from "react";
import { AdminCrud, FieldDef, FilterDef } from "@/src/admin-crud";
import { api } from "@/src/api";

const CATEGORIES = ["Announcements", "Exams", "Events", "Holidays", "Circulars", "Placements", "Achievements"];

export default function AdminNotices() {
  const [colleges, setColleges] = useState<any[]>([]);
  useEffect(() => { (async () => { const r = await api.get("/admin/list/colleges"); setColleges(r.data); })(); }, []);

  const fields: FieldDef[] = [
    { key: "title", label: "Title", type: "text" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "category", label: "Category", type: "select", options: CATEGORIES.map((c) => ({ value: c, label: c })) },
    { key: "author", label: "Author / Department", type: "text" },
    { key: "college_id", label: "College", type: "select", options: colleges.map((c) => ({ value: c.id, label: c.name })) },
  ];
  const filters: FilterDef[] = [
    { key: "college_id", label: "College", options: colleges.map((c) => ({ value: c.id, label: c.name })) },
  ];
  return (
    <AdminCrud
      title="Notices"
      subtitle="Post and manage college announcements. Notices are visible to all students of the selected college."
      listEndpoint="/admin/list/notices"
      createEndpoint="/admin/notices"
      itemEndpoint={(id) => `/admin/notices/${id}`}
      fields={fields}
      filters={filters}
      defaultValues={{ category: "Announcements", author: "Administration", college_id: colleges[0]?.id }}
      columns={[
        { key: "title", label: "Title" },
        { key: "category", label: "Category" },
        { key: "author", label: "Author" },
        { key: "date", label: "Date", render: (v) => v ? new Date(v).toLocaleDateString() : "" },
      ]}
    />
  );
}
