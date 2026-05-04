import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section, Stat, Badge } from "@/erp/components/Shell";

export const Route = createFileRoute("/parent/attendance")({
  component: () => {
    const { state, currentUser } = useStore();
    const student = state.students.find((s) => s.id === currentUser?.studentId);
    const [yearFilter, setYearFilter] = useState<string>("all");
    if (!student) return null;

    const monthly = state.attendance
      .filter(
        (a) =>
          a.studentId === student.id &&
          a.month &&
          a.totalDays !== undefined &&
          a.presentDays !== undefined,
      )
      .sort((a, b) => (b.month ?? "").localeCompare(a.month ?? ""));

    const years = Array.from(new Set(monthly.map((m) => m.month!.split("-")[0]))).sort().reverse();
    const visible =
      yearFilter === "all" ? monthly : monthly.filter((m) => m.month?.startsWith(yearFilter));

    const totalPresent = visible.reduce((s, m) => s + (m.presentDays ?? 0), 0);
    const totalDays = visible.reduce((s, m) => s + (m.totalDays ?? 0), 0);
    const overallPct = totalDays ? Math.round((totalPresent / totalDays) * 100) : 0;

    const monthLabel = (ym: string) => {
      const [y, m] = ym.split("-");
      return new Date(Number(y), Number(m) - 1).toLocaleString(undefined, {
        month: "long",
        year: "numeric",
      });
    };

    return (
      <div>
        <PageHeader title="Attendance" subtitle="Monthly summary" />
        <div className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Overall %" value={`${overallPct}%`} tone="info" />
            <Stat label="Present Days" value={totalPresent} tone="success" />
            <Stat label="Total Days" value={totalDays} />
            <Stat label="Months Tracked" value={visible.length} />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] uppercase text-muted-foreground">Year</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs"
            >
              <option value="all">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <Section title="Monthly Log">
            {visible.length === 0 ? (
              <p className="text-xs text-muted-foreground">No attendance records yet.</p>
            ) : (
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Present</th>
                    <th>Total Days</th>
                    <th>Absent</th>
                    <th>Percentage</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((m) => {
                    const pct = m.totalDays
                      ? Math.round(((m.presentDays ?? 0) / m.totalDays) * 100)
                      : 0;
                    const absent = (m.totalDays ?? 0) - (m.presentDays ?? 0);
                    const tone = pct >= 90 ? "success" : pct >= 75 ? "info" : "warning";
                    return (
                      <tr key={m.id}>
                        <td className="font-medium">{monthLabel(m.month!)}</td>
                        <td className="tabular-nums text-success">{m.presentDays}</td>
                        <td className="tabular-nums">{m.totalDays}</td>
                        <td className="tabular-nums text-destructive">{absent}</td>
                        <td className="tabular-nums">{pct}%</td>
                        <td>
                          <Badge tone={tone}>
                            {pct >= 90 ? "Excellent" : pct >= 75 ? "Good" : "Low"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Section>
        </div>
      </div>
    );
  },
});
