import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section, Badge } from "@/erp/components/Shell";

export const Route = createFileRoute("/teacher/classes")({
  component: () => {
    const { state, currentUser } = useStore();
    const teacher = state.teachers.find((t) => t.id === currentUser?.teacherId);
    if (!teacher) return null;
    const classes = state.classes.filter((c) => teacher.classes.includes(c.id));
    return (
      <div>
        <PageHeader title="My Classes" />
        <div className="grid gap-3 p-6 md:grid-cols-2">
          {classes.map((c) => {
            const students = state.students.filter((s) => s.classId === c.id);
            const csa = state.classSubjectAssignments.filter(
              (a) => a.classId === c.id && a.teacherId === teacher.id,
            );
            return (
              <Section
                key={c.id}
                title={c.name}
                actions={<Badge tone="muted">{students.length} students</Badge>}
              >
                <div className="mb-2 flex flex-wrap gap-1">
                  {csa.map((a) => {
                    const sub = state.subjects.find((s) => s.id === a.subjectId);
                    return (
                      <Badge key={a.id} tone="info">
                        {sub?.name}
                      </Badge>
                    );
                  })}
                </div>
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th>Roll</th>
                      <th>Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.id}>
                        <td className="font-mono text-xs">{s.rollNo}</td>
                        <td>{s.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            );
          })}
        </div>
      </div>
    );
  },
});
