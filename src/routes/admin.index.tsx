import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/erp/store/store";
import { PageHeader, Stat, Section, Badge } from "@/erp/components/Shell";
import { Users, GraduationCap, Wallet, Receipt, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { state } = useStore();

  const totalCollected = state.feePayments
    .filter((f) => f.status === "paid")
    .reduce((s, f) => s + f.amount, 0);
  const totalPending = state.feePayments
    .filter((f) => f.status === "pending")
    .reduce((s, f) => s + f.amount, 0);
  const totalExpenses = state.expenses.reduce((s, e) => s + e.amount, 0);
  const net = totalCollected - totalExpenses;

  const todayAttendance = state.attendance.filter(
    (a) => a.date === new Date().toISOString().split("T")[0],
  );
  const presentPct = todayAttendance.length
    ? Math.round((todayAttendance.filter((a) => a.status === "present").length / todayAttendance.length) * 100)
    : 0;

  const recentLogs = state.activityLogs.slice(0, 8);
  const recentNotifications = state.notifications.slice(0, 5);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of school operations" />

      <div className="grid gap-4 p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Students" value={state.students.length} hint={`Across ${state.classes.length} classes`} />
          <Stat label="Teachers" value={state.teachers.length} hint={`${state.subjects.length} subjects`} />
          <Stat label="Fees Collected" value={`₹${totalCollected.toLocaleString()}`} tone="success" hint="Current academic year" />
          <Stat label="Pending Dues" value={`₹${totalPending.toLocaleString()}`} tone="warning" hint={`${state.feePayments.filter((f) => f.status === "pending").length} payments`} />
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Total Expenses" value={`₹${totalExpenses.toLocaleString()}`} tone="danger" />
          <Stat label="Net Balance" value={`₹${net.toLocaleString()}`} tone={net >= 0 ? "success" : "danger"} />
          <Stat label="Attendance Today" value={`${presentPct}%`} tone="info" hint={`${todayAttendance.length} marked`} />
          <Stat label="Bus Routes" value={state.busRoutes.length} hint={`${state.busRoutes.reduce((s, r) => s + r.stops.length, 0)} stops`} />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <Section title="Recent Activity">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet. Make a change to populate the log.</p>
            ) : (
              <ul className="space-y-2">
                {recentLogs.map((l) => (
                  <li key={l.id} className="flex items-start justify-between gap-3 border-b border-border pb-2 last:border-0">
                    <div>
                      <div className="text-sm">
                        <span className="font-medium">{l.userName}</span>{" "}
                        <span className="text-muted-foreground">{l.action}</span>{" "}
                        <span className="font-medium">{l.entity}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(l.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <Badge tone="muted">{l.role}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Latest Notifications">
            {recentNotifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notifications.</p>
            ) : (
              <ul className="space-y-2">
                {recentNotifications.map((n) => (
                  <li key={n.id} className="border-b border-border pb-2 last:border-0">
                    <div className="flex items-center gap-2">
                      <Badge tone={n.audience === "school" ? "info" : n.audience === "class" ? "warning" : "muted"}>
                        {n.audience}
                      </Badge>
                      <span className="text-sm font-medium">{n.title}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{n.message}</div>
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
