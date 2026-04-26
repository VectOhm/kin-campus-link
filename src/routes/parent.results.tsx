import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section, Badge, Stat } from "@/erp/components/Shell";

export const Route = createFileRoute("/parent/results")({ component: () => {
  const { state, currentUser } = useStore();
  const student = state.students.find((s) => s.id === currentUser?.studentId);
  if (!student) return null;
  const myMarks = state.marks.filter((m) => m.studentId === student.id);
  const overall = myMarks.length ? Math.round(myMarks.reduce((s, m) => s + (m.marks / m.maxMarks) * 100, 0) / myMarks.length) : 0;

  return (
    <div>
      <PageHeader title="Results" subtitle={student.name} />
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Stat label="Overall Average" value={`${overall}%`} tone="info" />
          <Stat label="Subjects Graded" value={new Set(myMarks.map((m) => m.subjectId)).size} />
          <Stat label="Exams" value={new Set(myMarks.map((m) => m.examId)).size} />
        </div>
        {state.exams.map((ex) => {
          const ms = myMarks.filter((m) => m.examId === ex.id);
          if (ms.length === 0) return null;
          const avg = Math.round(ms.reduce((s, m) => s + (m.marks / m.maxMarks) * 100, 0) / ms.length);
          return (
            <Section key={ex.id} title={`${ex.name} · ${ex.term}`} actions={<Badge tone="info">Avg {avg}%</Badge>}>
              <table className="data-table w-full">
                <thead><tr><th>Subject</th><th>Marks</th><th>Out of</th><th>Grade</th></tr></thead>
                <tbody>{ms.map((m) => {
                  const sub = state.subjects.find((s) => s.id === m.subjectId);
                  return <tr key={m.id}><td>{sub?.name}</td><td className="tabular-nums">{m.marks}</td><td className="tabular-nums text-muted-foreground">{m.maxMarks}</td><td><Badge tone="info">{m.grade}</Badge></td></tr>;
                })}</tbody>
              </table>
            </Section>
          );
        })}
      </div>
    </div>
  );
}});
