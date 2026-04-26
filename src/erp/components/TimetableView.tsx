import { useStore } from "../store/store";
import { Badge, EmptyState } from "./Shell";
import { Clock3 } from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

export function TimetableView({ classId, teacherId }: { classId?: string; teacherId?: string }) {
  const { state } = useStore();
  const slots = state.timetable.filter((t) => (classId ? t.classId === classId : true) && (teacherId ? t.teacherId === teacherId : true));
  if (slots.length === 0) return <EmptyState message="No timetable available" icon={Clock3} />;

  const periods = Array.from(new Set(slots.map((s) => s.period))).sort((a, b) => a - b);

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <table className="data-table w-full">
        <thead>
          <tr>
            <th>Period</th>
            {DAYS.map((d) => <th key={d}>{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {periods.map((p) => {
            const sample = slots.find((s) => s.period === p);
            return (
              <tr key={p}>
                <td className="font-medium">
                  <div>P{p}</div>
                  <div className="text-[10px] font-normal text-muted-foreground">{sample?.startTime} - {sample?.endTime}</div>
                </td>
                {DAYS.map((d) => {
                  const slot = slots.find((s) => s.day === d && s.period === p);
                  if (!slot) return <td key={d} className="text-muted-foreground">—</td>;
                  const sub = state.subjects.find((x) => x.id === slot.subjectId);
                  const cls = state.classes.find((x) => x.id === slot.classId);
                  const t = state.teachers.find((x) => x.id === slot.teacherId);
                  return (
                    <td key={d}>
                      <div className="text-xs font-medium">{sub?.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {classId ? t?.name : teacherId ? cls?.name : `${t?.name} · ${cls?.name}`}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
