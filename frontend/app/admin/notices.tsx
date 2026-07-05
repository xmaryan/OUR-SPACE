import React, { useEffect, useState } from "react";
import { AdminCrud, FieldDef } from "@/src/admin-crud";
import { api } from "@/src/api";

const CATEGORIES = ["Announcements", "Exams", "Events", "Holidays", "Circulars", "Placements", "Achievements"];

export default function AdminNotices() {
  const fields: FieldDef[] = [
    { key: "title", label: "Title", type: "text" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "category", label: "Category", type: "select", options: CATEGORIES.map((c) => ({ value: c, label: c })) },
    { key: "author", label: "Author / Department", type: "text" },
  ];
  return (
    <AdminCrud
      title="Notices"
      subtitle="Post and manage college announcements"
      listEndpoint="/notices"
      createEndpoint="/admin/notices"
      itemEndpoint={(id) => `/admin/notices/${id}`}
      fields={fields}
      defaultValues={{ category: "Announcements", author: "Administration" }}
      columns={[
        { key: "title", label: "Title" },
        { key: "category", label: "Category" },
        { key: "author", label: "Author" },
        { key: "date", label: "Date", render: (v) => v ? new Date(v).toLocaleDateString() : "" },
      ]}
    />
  );
}
