import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section, Badge } from "@/erp/components/Shell";

export const Route = createFileRoute("/admin/classes")({
  component: ClassesPage,
});

function ClassesPage() {
  const { state } = useStore();
  return (
    <div>
      <PageHeader title="Classes" subtitle="Subject-teacher assignments per class" />
      <div className="grid gap-3 p-6 md:grid-cols-2">
        {state.classes.map((c) => {
          const csa = state.classSubjectAssignments.filter((x) => x.classId === c.id);
          const ct = state.teachers.find((t) => t.id === c.classTeacherId);
          const studentCount = state.students.filter((s) => s.classId === c.id).length;
          return (
            <Section
              key={c.id}
              title={c.name}
              actions={<Badge tone="muted">{studentCount} students</Badge>}
            >
              <div className="mb-3 text-xs text-muted-foreground">
                Class teacher: <span className="font-medium text-foreground">{ct?.name ?? "—"}</span>
              </div>
              <table className="data-table w-full">
                <thead>
                  <tr><th>Subject</th><th>Teacher</th></tr>
                </thead>
                <tbody>
                  {csa.length === 0 ? (
                    <tr><td colSpan={2} className="text-center text-xs text-muted-foreground">No assignments</td></tr>
                  ) : (
                    csa.map((a) => {
                      const sub = state.subjects.find((s) => s.id === a.subjectId);
                      const t = state.teachers.find((x) => x.id === a.teacherId);
                      return (
                        <tr key={a.id}>
                          <td>{sub?.name}</td>
                          <td className="text-xs">{t?.name}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </Section>
          );
        })}
      </div>
    </div>
  );
}
