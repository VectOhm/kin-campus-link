import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section, EmptyState } from "@/erp/components/Shell";
import { Modal, SelectField, FormActions, Field } from "@/erp/components/Form";
import { Clock3, Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { TimetableSlot } from "@/erp/types";

export const Route = createFileRoute("/admin/timetable")({
  component: TimetablePage,
});

const DAYS: TimetableSlot["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const MAX_PERIODS = 8;

function TimetablePage() {
  const { state, update } = useStore();
  const [classId, setClassId] = useState(state.classes[0]?.id ?? "");
  const [editing, setEditing] = useState<{ slot?: TimetableSlot; day: TimetableSlot["day"]; period: number } | null>(null);

  const slots = state.timetable.filter((t) => t.classId === classId);
  const periodNumbers = Array.from(new Set([...slots.map((s) => s.period), 1, 2, 3, 4, 5, 6])).sort((a, b) => a - b);

  function deleteSlot(id: string) {
    update((s) => ({ ...s, timetable: s.timetable.filter((x) => x.id !== id) }), { action: "deleted slot", entity: id });
    toast.success("Slot removed");
  }

  return (
    <div>
      <PageHeader title="Timetable" subtitle="Click any cell to edit · system enforces no teacher double-booking"
        actions={
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1.5 text-sm">
            {state.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        }
      />
      <div className="space-y-3 p-6">
        {slots.length === 0 ? <EmptyState message="No slots yet — click + to add" icon={Clock3} /> : null}
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Period</th>
                {DAYS.map((d) => <th key={d}>{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {periodNumbers.map((p) => {
                const sample = slots.find((s) => s.period === p);
                return (
                  <tr key={p}>
                    <td className="font-medium">
                      <div>P{p}</div>
                      <div className="text-[10px] font-normal text-muted-foreground">{sample?.startTime ?? "—"} - {sample?.endTime ?? "—"}</div>
                    </td>
                    {DAYS.map((d) => {
                      const slot = slots.find((s) => s.day === d && s.period === p);
                      return (
                        <td key={d} className="group relative">
                          {slot ? (
                            <div>
                              <div className="text-xs font-medium">{state.subjects.find((x) => x.id === slot.subjectId)?.name}</div>
                              <div className="text-[10px] text-muted-foreground">{state.teachers.find((x) => x.id === slot.teacherId)?.name}</div>
                              <div className="absolute right-1 top-1 hidden gap-1 group-hover:flex">
                                <button onClick={() => setEditing({ slot, day: d, period: p })} className="rounded bg-card p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="h-3 w-3" /></button>
                                <button onClick={() => deleteSlot(slot.id)} className="rounded bg-card p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setEditing({ day: d, period: p })} className="flex w-full items-center justify-center gap-1 rounded p-1 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground">
                              <Plus className="h-3 w-3" /> add
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Section title="How collision detection works">
          <p className="text-xs text-muted-foreground">
            When you save a slot, the system checks every other class on the same day & period. If the chosen teacher is already
            scheduled to teach somewhere else at that time, the save is rejected. Time-range overlaps with existing slots in this
            class are also blocked.
          </p>
        </Section>
      </div>
      {editing && (
        <SlotModal
          classId={classId}
          day={editing.day}
          period={editing.period}
          existing={editing.slot}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function SlotModal({ classId, day, period, existing, onClose }: { classId: string; day: TimetableSlot["day"]; period: number; existing?: TimetableSlot; onClose: () => void }) {
  const { state, update } = useStore();
  const csa = state.classSubjectAssignments.filter((c) => c.classId === classId);
  const subjectOptions = state.subjects.filter((s) => csa.some((c) => c.subjectId === s.id));

  const [subjectId, setSubjectId] = useState(existing?.subjectId ?? subjectOptions[0]?.id ?? "");
  const [teacherId, setTeacherId] = useState(
    existing?.teacherId ?? csa.find((c) => c.subjectId === (existing?.subjectId ?? subjectOptions[0]?.id))?.teacherId ?? "",
  );
  const [startTime, setStartTime] = useState(existing?.startTime ?? "08:00");
  const [endTime, setEndTime] = useState(existing?.endTime ?? "08:45");

  // When subject changes, default teacher to assigned one
  function changeSubject(sid: string) {
    setSubjectId(sid);
    const a = csa.find((c) => c.subjectId === sid);
    if (a) setTeacherId(a.teacherId);
  }

  function timesOverlap(aS: string, aE: string, bS: string, bE: string) {
    return aS < bE && bS < aE;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subjectId || !teacherId) { toast.error("Subject and teacher required"); return; }
    if (startTime >= endTime) { toast.error("End time must be after start"); return; }

    // Collision: same teacher, same day, overlapping time, different slot
    const teacherClash = state.timetable.find((slot) =>
      slot.id !== existing?.id &&
      slot.teacherId === teacherId &&
      slot.day === day &&
      timesOverlap(slot.startTime, slot.endTime, startTime, endTime),
    );
    if (teacherClash) {
      const otherCls = state.classes.find((c) => c.id === teacherClash.classId);
      toast.error(`Conflict: teacher already in ${otherCls?.name} (${teacherClash.startTime}-${teacherClash.endTime})`);
      return;
    }

    // Same class, same day, overlapping time
    const classClash = state.timetable.find((slot) =>
      slot.id !== existing?.id &&
      slot.classId === classId &&
      slot.day === day &&
      timesOverlap(slot.startTime, slot.endTime, startTime, endTime),
    );
    if (classClash) {
      toast.error(`Conflict: this class already has a slot ${classClash.startTime}-${classClash.endTime}`);
      return;
    }

    if (existing) {
      update((s) => ({
        ...s,
        timetable: s.timetable.map((sl) => sl.id === existing.id ? { ...sl, subjectId, teacherId, startTime, endTime } : sl),
      }), { action: "edited timetable slot", entity: existing.id });
    } else {
      update((s) => ({
        ...s,
        timetable: [
          ...s.timetable,
          { id: `tt_${Date.now()}`, classId, day, period, subjectId, teacherId, startTime, endTime },
        ],
      }), { action: "added timetable slot", entity: `${day} P${period}` });
    }
    toast.success("Slot saved");
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={`${existing ? "Edit" : "Add"} slot · ${day} · Period ${period}`} subtitle="Collision check runs on save">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <SelectField label="Subject" value={subjectId} onChange={changeSubject}
          options={subjectOptions.length ? subjectOptions.map((s) => [s.id, s.name]) : [["", "No subjects assigned to this class"]]} />
        <SelectField label="Teacher" value={teacherId} onChange={setTeacherId}
          options={state.teachers.filter((t) => t.classes.includes(classId)).map((t) => [t.id, t.name] as [string, string])} />
        <Field label="Start" type="time" value={startTime} onChange={setStartTime} />
        <Field label="End" type="time" value={endTime} onChange={setEndTime} />
        <FormActions onCancel={onClose} submitLabel="Save slot" />
      </form>
    </Modal>
  );
}