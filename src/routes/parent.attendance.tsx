import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section, Stat, Badge } from "@/erp/components/Shell";

export const Route = createFileRoute("/parent/attendance")({
  component: () => {
    const { state, currentUser } = useStore();
    const student = state.students.find((s) => s.id === currentUser?.studentId);
    if (!student) return null;
    const att = state.attendance
      .filter((a) => a.studentId === student.id)
      .sort((a, b) => b.date.localeCompare(a.date));
    const present = att.filter((a) => a.status === "present").length;
    const absent = att.filter((a) => a.status === "absent").length;
    const late = att.filter((a) => a.status === "late").length;
    const pct = att.length ? Math.round((present / att.length) * 100) : 0;
    return (
      <div>
        <PageHeader title="Attendance" />
        <div className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Attendance" value={`${pct}%`} tone="info" />
            <Stat label="Present" value={present} tone="success" />
            <Stat label="Absent" value={absent} tone="danger" />
            <Stat label="Late" value={late} tone="warning" />
          </div>
          <Section title="Daily Log">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {att.map((a) => (
                  <tr key={a.id}>
                    <td className="font-mono text-xs">{a.date}</td>
                    <td>
                      <Badge
                        tone={
                          a.status === "present"
                            ? "success"
                            : a.status === "absent"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {a.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      </div>
    );
  },
});
