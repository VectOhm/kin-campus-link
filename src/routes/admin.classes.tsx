import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section, Badge } from "@/erp/components/Shell";
import { Modal, FormActions, SelectField } from "@/erp/components/Form";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import type { SchoolClass } from "@/erp/types";

export const Route = createFileRoute("/admin/classes")({
  component: ClassesPage,
});

function ClassesPage() {
  const { state } = useStore();
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  return (
    <div>
      <PageHeader title="Classes" subtitle="Subject-teacher assignments per class · click edit to change" />
      <div className="grid gap-3 p-6 md:grid-cols-2">
        {state.classes.map((c) => {
          const csa = state.classSubjectAssignments.filter((x) => x.classId === c.id);
          const ct = state.teachers.find((t) => t.id === c.classTeacherId);
          const studentCount = state.students.filter((s) => s.classId === c.id).length;
          return (
            <Section
              key={c.id}
              title={c.name}
              actions={
                <div className="flex items-center gap-2">
                  <Badge tone="muted">{studentCount} students</Badge>
                  <button onClick={() => setEditing(c)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="Edit">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              }
            >
              <div className="mb-3 text-xs text-muted-foreground">
                Class teacher: <span className="font-medium text-foreground">{ct?.name ?? "—"}</span>
              </div>
              <table className="data-table w-full">
                <thead>
                  <tr><th>Subject</th><th>Teacher</th></tr>
                </thead>
                <tbody>
                  {state.subjects.map((sub) => {
                    const a = csa.find((x) => x.subjectId === sub.id);
                    const t = a ? state.teachers.find((x) => x.id === a.teacherId) : null;
                    return (
                      <tr key={sub.id}>
                        <td>{sub.name}</td>
                        <td className="text-xs">{t?.name ?? <span className="text-muted-foreground">— unassigned —</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Section>
          );
        })}
      </div>
      {editing && <EditClassModal cls={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function EditClassModal({ cls, onClose }: { cls: SchoolClass; onClose: () => void }) {
  const { state, update } = useStore();
  const [classTeacherId, setClassTeacherId] = useState(cls.classTeacherId ?? "");
  const initial: Record<string, string> = {};
  state.subjects.forEach((s) => {
    const a = state.classSubjectAssignments.find((x) => x.classId === cls.id && x.subjectId === s.id);
    initial[s.id] = a?.teacherId ?? "";
  });
  const [assignments, setAssignments] = useState<Record<string, string>>(initial);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    update(
      (s) => {
        // Remove all existing assignments for this class then re-create from form
        const otherCsa = s.classSubjectAssignments.filter((c) => c.classId !== cls.id);
        const newCsa = state.subjects
          .filter((sub) => assignments[sub.id])
          .map((sub) => ({
            id: `csa_${cls.id}_${sub.id}_${assignments[sub.id]}`,
            classId: cls.id,
            subjectId: sub.id,
            teacherId: assignments[sub.id],
          }));

        // Update teachers' classes/subjects to include this class for any newly assigned teacher
        const teachers = s.teachers.map((t) => {
          const teachesHere = newCsa.some((c) => c.teacherId === t.id);
          let classes = t.classes;
          let subjects = t.subjects;
          if (teachesHere && !classes.includes(cls.id)) classes = [...classes, cls.id];
          // ensure their subjects include each subject they teach in this class
          newCsa.filter((c) => c.teacherId === t.id).forEach((c) => {
            if (!subjects.includes(c.subjectId)) subjects = [...subjects, c.subjectId];
          });
          return { ...t, classes, subjects };
        });

        // Reconcile timetable: drop slots whose (subject) no longer matches assigned teacher for this class
        const validKeys = new Set(newCsa.map((c) => `${c.subjectId}|${c.teacherId}`));
        const timetable = s.timetable.filter((slot) => {
          if (slot.classId !== cls.id) return true;
          return validKeys.has(`${slot.subjectId}|${slot.teacherId}`);
        });

        const classes = s.classes.map((c) => (c.id === cls.id ? { ...c, classTeacherId: classTeacherId || undefined } : c));

        return { ...s, classes, classSubjectAssignments: [...otherCsa, ...newCsa], teachers, timetable };
      },
      { action: "edited class", entity: cls.name },
    );
    toast.success(`${cls.name} updated`);
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={`Edit ${cls.name}`} subtitle="Assign one teacher per subject" maxWidth="max-w-2xl">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <SelectField
          label="Class Teacher"
          value={classTeacherId}
          onChange={setClassTeacherId}
          options={[["", "— None —"], ...state.teachers.map((t) => [t.id, t.name] as [string, string])]}
        />
        <div className="col-span-2 mt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Subject assignments</div>
        {state.subjects.map((sub) => (
          <SelectField
            key={sub.id}
            label={sub.name}
            value={assignments[sub.id]}
            onChange={(v) => setAssignments({ ...assignments, [sub.id]: v })}
            options={[["", "— Unassigned —"], ...state.teachers.map((t) => [t.id, t.name] as [string, string])]}
          />
        ))}
        <FormActions onCancel={onClose} submitLabel="Save assignments" />
      </form>
    </Modal>
  );
}