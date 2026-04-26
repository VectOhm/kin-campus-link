import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/erp/store/store";
import { PageHeader } from "@/erp/components/Shell";
import { TimetableView } from "@/erp/components/TimetableView";

export const Route = createFileRoute("/admin/timetable")({
  component: TimetablePage,
});

function TimetablePage() {
  const { state } = useStore();
  const [classId, setClassId] = useState(state.classes[0]?.id ?? "");
  return (
    <div>
      <PageHeader title="Timetable" subtitle="View timetable per class"
        actions={
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1.5 text-sm">
            {state.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        }
      />
      <div className="p-6"><TimetableView classId={classId} /></div>
    </div>
  );
}
