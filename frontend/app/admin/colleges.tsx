import React from "react";
import { AdminCrud, FieldDef } from "@/src/admin-crud";

export default function AdminColleges() {
  const fields: FieldDef[] = [
    { key: "name", label: "College name", type: "text" },
    { key: "short", label: "Short code (e.g. DU)", type: "text" },
  ];
  return (
    <AdminCrud
      title="Colleges"
      subtitle="Add and manage universities/colleges. New students will see these during registration."
      listEndpoint="/admin/list/colleges"
      createEndpoint="/admin/colleges"
      itemEndpoint={(id) => `/admin/colleges/${id}`}
      fields={fields}
      columns={[
        { key: "name", label: "Name" },
        { key: "short", label: "Short code" },
        { key: "id", label: "ID" },
      ]}
    />
  );
}
