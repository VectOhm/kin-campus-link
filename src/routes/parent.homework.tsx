import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section, Badge, EmptyState } from "@/erp/components/Shell";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/parent/homework")({ component: () => {
  const { state, currentUser } = useStore();
  const student = state.students.find((s) => s.id === currentUser?.studentId);
  if (!student) return null;
  const list = state.homework.filter((h) => h.classId === student.classId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div>
      <PageHeader title="Homework" subtitle={`${list.length} assignments`} />
      <div className="p-6">
        {list.length === 0 ? <EmptyState message="No homework" icon={BookOpen} /> : (
          <Section title="All Assignments">
            <div className="space-y-2">{list.map((h) => {
              const sub = state.subjects.find((s) => s.id === h.subjectId);
              const t = state.teachers.find((x) => x.id === h.teacherId);
              return (
                <div key={h.id} className="rounded-md border border-border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><Badge tone="info">{sub?.name}</Badge><span className="text-sm font-medium">{h.title}</span></div>
                    <span className="text-[11px] text-muted-foreground">Due {h.dueDate}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{h.description}</p>
                  <div className="mt-1 text-[10px] text-muted-foreground">By {t?.name} · Posted {h.createdAt.split("T")[0]}</div>
                </div>
              );
            })}</div>
          </Section>
        )}
      </div>
    </div>
  );
}});
