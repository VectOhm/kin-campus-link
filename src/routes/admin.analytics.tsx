import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section, Stat } from "@/erp/components/Shell";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { state } = useStore();
  const collected = state.feePayments.filter((f) => f.status === "paid").reduce((s, f) => s + f.amount, 0);
  const pending = state.feePayments.filter((f) => f.status === "pending").reduce((s, f) => s + f.amount, 0);
  const expenses = state.expenses.reduce((s, e) => s + e.amount, 0);

  // Performance per class
  const classPerf = state.classes.map((c) => {
    const sids = state.students.filter((s) => s.classId === c.id).map((s) => s.id);
    const ms = state.marks.filter((m) => sids.includes(m.studentId));
    const avg = ms.length ? Math.round(ms.reduce((s, m) => s + (m.marks / m.maxMarks) * 100, 0) / ms.length) : 0;
    return { name: c.name, avg, students: sids.length };
  });

  // Attendance per class
  const att = state.classes.map((c) => {
    const a = state.attendance.filter((x) => x.classId === c.id);
    const pct = a.length ? Math.round((a.filter((x) => x.status === "present").length / a.length) * 100) : 0;
    return { name: c.name, pct };
  });

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Performance, fees and operations" />
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Revenue" value={`₹${collected.toLocaleString()}`} tone="success" />
          <Stat label="Pending" value={`₹${pending.toLocaleString()}`} tone="warning" />
          <Stat label="Expenses" value={`₹${expenses.toLocaleString()}`} tone="danger" />
          <Stat label="Net" value={`₹${(collected - expenses).toLocaleString()}`} tone={collected - expenses >= 0 ? "success" : "danger"} />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <Section title="Class Performance (avg %)">
            <div className="space-y-2">
              {classPerf.map((c) => (
                <div key={c.name}>
                  <div className="flex justify-between text-xs"><span>{c.name}</span><span className="tabular-nums">{c.avg}%</span></div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-info" style={{ width: `${c.avg}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Section>
          <Section title="Class Attendance">
            <div className="space-y-2">
              {att.map((c) => (
                <div key={c.name}>
                  <div className="flex justify-between text-xs"><span>{c.name}</span><span className="tabular-nums">{c.pct}%</span></div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-success" style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
