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
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  if (!teacher) return null;
  const students = state.students.filter((s) => s.classId === classId);
  const teacherId = teacher.id;

  function setStatus(studentId: string, status: "present" | "absent" | "late") {
    update((s) => {
      const existing = s.attendance.find((a) => a.studentId === studentId && a.date === date);
      if (existing) return { ...s, attendance: s.attendance.map((a) => a.id === existing.id ? { ...a, status } : a) };
      return { ...s, attendance: [...s.attendance, { id: `at_${Date.now()}_${studentId}`, studentId, classId, date, status, markedBy: teacherId }] };
    });
  }

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Mark daily attendance"
        actions={<button onClick={() => toast.success("Attendance saved")} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Done</button>}
      />
      <div className="space-y-4 p-6">
        <div className="flex gap-2">
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="rounded border border-input bg-background px-2 py-1.5 text-sm">
            {teacher.classes.map((cid) => <option key={cid} value={cid}>{state.classes.find((c) => c.id === cid)?.name}</option>)}
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded border border-input bg-background px-2 py-1.5 text-sm" />
        </div>
        <Section title={`${state.classes.find((c) => c.id === classId)?.name} · ${date}`}>
          <table className="data-table w-full">
            <thead><tr><th>Roll</th><th>Student</th><th>Status</th></tr></thead>
            <tbody>
              {students.map((s) => {
                const att = state.attendance.find((a) => a.studentId === s.id && a.date === date);
                return (
                  <tr key={s.id}>
                    <td className="font-mono text-xs">{s.rollNo}</td>
                    <td>{s.name}</td>
                    <td>
                      <div className="flex gap-1">
                        {(["present", "absent", "late"] as const).map((st) => (
                          <button key={st} onClick={() => setStatus(s.id, st)}
                            className={`rounded px-2 py-1 text-[11px] font-medium capitalize ${att?.status === st ? (st === "present" ? "bg-success text-success-foreground" : st === "absent" ? "bg-destructive text-destructive-foreground" : "bg-warning text-warning-foreground") : "border border-border hover:bg-muted"}`}>
                            {st}
                          </button>
                        ))}
                      </div>
                    </td>
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
