import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section, Badge, EmptyState } from "@/erp/components/Shell";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/parent/notes")({
  component: () => {
    const { state, currentUser } = useStore();
    const student = state.students.find((s) => s.id === currentUser?.studentId);
    const [subjectFilter, setSubjectFilter] = useState<string>("all");
    const [q, setQ] = useState("");
    if (!student) return null;
    const all = state.notes.filter((n) => n.classId === student.classId);
    const subjectsAvail = Array.from(new Set(all.map((n) => n.subjectId)));
    const list = all.filter((n) => {
      const matchSub = subjectFilter === "all" || n.subjectId === subjectFilter;
      const matchQ =
        !q ||
        n.title.toLowerCase().includes(q.toLowerCase()) ||
        n.content.toLowerCase().includes(q.toLowerCase());
      return matchSub && matchQ;
    });
    return (
      <div>
        <PageHeader title="Notes & Materials" />
        <div className="space-y-3 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <input
              placeholder="Search notes..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="flex-1 min-w-[180px] rounded-md border border-input bg-background px-2.5 py-1.5 text-sm"
            />
            <label className="text-[11px] uppercase text-muted-foreground">Subject</label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            >
              <option value="all">All subjects</option>
              {subjectsAvail.map((sid) => {
                const s = state.subjects.find((x) => x.id === sid);
                return s ? (
                  <option key={sid} value={sid}>
                    {s.name}
                  </option>
                ) : null;
              })}
            </select>
          </div>
          {list.length === 0 ? (
            <EmptyState message="No notes uploaded yet" icon={FileText} />
          ) : (
            <Section title="Study Materials">
              <div className="grid gap-2 md:grid-cols-2">
                {list.map((n) => {
                  const sub = state.subjects.find((s) => s.id === n.subjectId);
                  return (
                    <div key={n.id} className="rounded-md border border-border bg-card p-3">
                      <div className="flex items-center gap-2">
                        <Badge tone="info">{sub?.code}</Badge>
                        <h4 className="text-sm font-medium">{n.title}</h4>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground whitespace-pre-line">
                        {n.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}
        </div>
      </div>
    );
  },
});
