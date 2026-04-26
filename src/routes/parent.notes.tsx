import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section, Badge, EmptyState } from "@/erp/components/Shell";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/parent/notes")({ component: () => {
  const { state, currentUser } = useStore();
  const student = state.students.find((s) => s.id === currentUser?.studentId);
  if (!student) return null;
  const list = state.notes.filter((n) => n.classId === student.classId);
  return (
    <div>
      <PageHeader title="Notes & Materials" />
      <div className="p-6">
        {list.length === 0 ? <EmptyState message="No notes uploaded yet" icon={FileText} /> : (
          <Section title="Study Materials">
            <div className="grid gap-2 md:grid-cols-2">{list.map((n) => {
              const sub = state.subjects.find((s) => s.id === n.subjectId);
              return (
                <div key={n.id} className="rounded-md border border-border bg-card p-3">
                  <div className="flex items-center gap-2"><Badge tone="info">{sub?.code}</Badge><h4 className="text-sm font-medium">{n.title}</h4></div>
                  <p className="mt-1 text-xs text-muted-foreground whitespace-pre-line">{n.content}</p>
                </div>
              );
            })}</div>
          </Section>
        )}
      </div>
    </div>
  );
}});
