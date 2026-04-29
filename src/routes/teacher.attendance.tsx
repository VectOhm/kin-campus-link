import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section } from "@/erp/components/Shell";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher/attendance")({ component: AttendancePage });

function AttendancePage() {
  const { state, update, currentUser } = useStore();
  const teacher = state.teachers.find((t) => t.id === currentUser?.teacherId);
  const [classId, setClassId] = useState<string>(teacher?.classes[0] ?? "");
  const now = new Date();
  const [month, setMonth] = useState<string>(`${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`);
  const [totalDays, setTotalDays] = useState<number>(22);
  if (!teacher) return null;
  const students = state.students.filter((s) => s.classId === classId);
  const teacherId = teacher.id;

  function setPresent(studentId: string, present: number) {
    const p = Math.max(0, Math.min(totalDays, Math.round(present)));
    update((s) => {
      const existing = s.attendance.find((a) => a.studentId === studentId && a.month === month);
      if (existing) {
        return {
          ...s,
          attendance: s.attendance.map((a) =>
            a.id === existing.id ? { ...a, totalDays, presentDays: p, status: "present" as const } : a,
          ),
        };
      }
      return {
        ...s,
        attendance: [
          ...s.attendance,
          {
            id: `mat_${Date.now()}_${studentId}`,
            studentId,
            classId,
            date: `${month}-01`,
            month,
            totalDays,
            presentDays: p,
            status: "present" as const,
            markedBy: teacherId,
          },
        ],
      };
    });
  }

  function applyTotalToAll() {
    update((s) => ({
      ...s,
      attendance: s.attendance.map((a) => (a.month === month && a.classId === classId ? { ...a, totalDays } : a)),
    }));
    toast.success(`Set total to ${totalDays} for ${month}`);
  }

  return (
    <div>
      <PageHeader title="Monthly Attendance" subtitle="Enter total class days and present count per student"
        actions={<button onClick={() => toast.success("Attendance saved")} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Done</button>}
      />
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-end gap-2">
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="rounded border border-input bg-background px-2 py-1.5 text-sm">
            {teacher.classes.map((cid) => <option key={cid} value={cid}>{state.classes.find((c) => c.id === cid)?.name}</option>)}
          </select>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded border border-input bg-background px-2 py-1.5 text-sm" />
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            Total days
            <input type="number" min={1} max={31} value={totalDays} onChange={(e) => setTotalDays(Number(e.target.value) || 0)} className="w-16 rounded border border-input bg-background px-2 py-1 text-sm tabular-nums" />
          </label>
          <button onClick={applyTotalToAll} className="rounded border border-border px-2 py-1 text-[11px] hover:bg-muted">Apply total to all</button>
        </div>
        <Section title={`${state.classes.find((c) => c.id === classId)?.name} · ${month}`}>
          <table className="data-table w-full">
            <thead><tr><th>Roll</th><th>Student</th><th>Present</th><th>Total</th><th>%</th></tr></thead>
            <tbody>
              {students.map((s) => {
                const att = state.attendance.find((a) => a.studentId === s.id && a.month === month);
                const present = att?.presentDays ?? 0;
                const total = att?.totalDays ?? totalDays;
                const pct = total > 0 ? Math.round((present / total) * 100) : 0;
                return (
                  <tr key={s.id}>
                    <td className="font-mono text-xs">{s.rollNo}</td>
                    <td>{s.name}</td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        max={total}
                        defaultValue={att?.presentDays ?? ""}
                        onBlur={(e) => e.target.value !== "" && setPresent(s.id, Number(e.target.value))}
                        className="w-20 rounded border border-input bg-background px-2 py-1 text-sm tabular-nums"
                      />
                    </td>
                    <td className="font-mono text-xs">{total}</td>
                    <td className={`font-mono text-xs ${pct >= 75 ? "text-success" : pct >= 60 ? "text-warning" : "text-destructive"}`}>{att ? `${pct}%` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Section>
      </div>
    </div>
  );
}
