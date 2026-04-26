import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/erp/store/store";
import { PageHeader, Stat, Section, Badge, EmptyState } from "@/erp/components/Shell";
import { Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/teacher/")({ component: TeacherDash });

function TeacherDash() {
  const { state, currentUser } = useStore();
  const teacher = state.teachers.find((t) => t.id === currentUser?.teacherId);
  if (!teacher) return <div className="p-6 text-sm text-muted-foreground">No teacher profile linked.</div>;

  const myClasses = state.classes.filter((c) => teacher.classes.includes(c.id));
  const myHomework = state.homework.filter((h) => h.teacherId === teacher.id);
  const myStudents = state.students.filter((s) => teacher.classes.includes(s.classId));

  return (
    <div>
      <PageHeader title={`Welcome, ${teacher.name}`} subtitle={teacher.subjects.map((sid) => state.subjects.find((s) => s.id === sid)?.name).join(" · ")} />
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="My Classes" value={myClasses.length} />
          <Stat label="My Students" value={myStudents.length} />
          <Stat label="Homework Posted" value={myHomework.length} />
          <Stat label="Subjects" value={teacher.subjects.length} />
        </div>
        <Section title="My Classes">
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {myClasses.map((c) => (
              <Link key={c.id} to="/teacher/classes" className="rounded-md border border-border p-3 hover:border-accent">
                <div className="text-sm font-medium">{c.name}</div>
                <div className="text-[11px] text-muted-foreground">{state.students.filter((s) => s.classId === c.id).length} students</div>
              </Link>
            ))}
          </div>
        </Section>
        <Section title="Recent Homework">
          {myHomework.length === 0 ? <EmptyState message="No homework yet" icon={BookOpen} /> : (
            <ul className="space-y-2">
              {myHomework.slice(0, 5).map((h) => {
                const cls = state.classes.find((c) => c.id === h.classId);
                const sub = state.subjects.find((s) => s.id === h.subjectId);
                return (
                  <li key={h.id} className="border-b border-border pb-2 last:border-0">
                    <div className="flex items-center gap-2">
                      <Badge tone="info">{sub?.code}</Badge>
                      <Badge tone="muted">{cls?.name}</Badge>
                      <span className="text-sm font-medium">{h.title}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">Due {h.dueDate}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
