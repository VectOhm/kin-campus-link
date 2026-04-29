import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/erp/store/store";
import { PageHeader, Stat, Section, Badge, EmptyState } from "@/erp/components/Shell";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/parent/")({ component: ParentDash });

function ParentDash() {
  const { state, currentUser } = useStore();
  const student = state.students.find((s) => s.id === currentUser?.studentId);
  if (!student) return <div className="p-6 text-sm text-muted-foreground">No student linked.</div>;
  const cls = state.classes.find((c) => c.id === student.classId);
  const fees = state.feePayments.filter((f) => f.studentId === student.id);
  const pending = fees.filter((f) => f.status === "pending");
  const homework = state.homework.filter((h) => h.classId === student.classId).slice(0, 5);
  const att = state.attendance.filter((a) => a.studentId === student.id);
  const attPct = att.length
    ? Math.round((att.filter((a) => a.status === "present").length / att.length) * 100)
    : 0;

  return (
    <div>
      <PageHeader title={student.name} subtitle={`${cls?.name} · Roll ${student.rollNo}`} />
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat
            label="Pending Dues"
            value={`₹${pending.reduce((s, f) => s + f.amount, 0).toLocaleString()}`}
            tone={pending.length ? "warning" : "success"}
            hint={`${pending.length} payments`}
          />
          <Stat label="Attendance" value={`${attPct}%`} tone="info" hint={`${att.length} days`} />
          <Stat label="Active Homework" value={homework.length} />
          <Stat
            label="Bus Route"
            value={
              state.busRoutes.find((b) => b.id === student.busRouteId)?.name.split("—")[0] ?? "—"
            }
          />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <Section
            title="Recent Homework"
            actions={
              <Link to="/parent/homework" className="text-[11px] text-accent hover:underline">
                View all
              </Link>
            }
          >
            {homework.length === 0 ? (
              <EmptyState message="No homework" icon={BookOpen} />
            ) : (
              <ul className="space-y-2">
                {homework.map((h) => {
                  const sub = state.subjects.find((s) => s.id === h.subjectId);
                  return (
                    <li key={h.id} className="border-b border-border pb-2 last:border-0">
                      <div className="flex items-center gap-2">
                        <Badge tone="info">{sub?.code}</Badge>
                        <span className="text-sm font-medium">{h.title}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">Due {h.dueDate}</div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
          <Section
            title="Pending Fees"
            actions={
              <Link to="/parent/fees" className="text-[11px] text-accent hover:underline">
                Pay now
              </Link>
            }
          >
            {pending.length === 0 ? (
              <p className="text-sm text-success">All fees paid 🎉</p>
            ) : (
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Due</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Badge tone="muted">{p.type}</Badge>
                      </td>
                      <td className="text-xs">{p.dueDate}</td>
                      <td className="tabular-nums">₹{p.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
