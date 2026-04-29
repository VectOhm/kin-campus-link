import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/erp/store/store";
import { PageHeader, Badge, EmptyState } from "@/erp/components/Shell";
import { Field, Modal, FormActions, MultiToggle } from "@/erp/components/Form";
import { Plus, Trash2, GraduationCap, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Teacher } from "@/erp/types";

export const Route = createFileRoute("/admin/teachers")({
  component: TeachersPage,
});

function TeachersPage() {
  const { state, update } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);

  function remove(id: string) {
    if (!confirm("Remove teacher? Their assignments and timetable slots will be cleared.")) return;
    update(
      (s) => ({
        ...s,
        teachers: s.teachers.filter((t) => t.id !== id),
        users: s.users.filter((u) => u.teacherId !== id),
        classSubjectAssignments: s.classSubjectAssignments.filter((c) => c.teacherId !== id),
        timetable: s.timetable.filter((t) => t.teacherId !== id),
        classes: s.classes.map((c) => (c.classTeacherId === id ? { ...c, classTeacherId: undefined } : c)),
      }),
      { action: "removed teacher", entity: id },
    );
    toast.success("Teacher removed");
  }

  return (
    <div>
      <PageHeader
        title="Teachers"
        subtitle={`${state.teachers.length} faculty members`}
        actions={
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" /> Add teacher
          </button>
        }
      />
      <div className="p-6">
        {state.teachers.length === 0 ? (
          <EmptyState message="No teachers yet" icon={GraduationCap} />
        ) : (
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Subjects</th>
                  <th>Classes</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {state.teachers.map((t) => (
                  <tr key={t.id}>
                    <td className="font-medium">{t.name}</td>
                    <td className="text-xs">{t.email}</td>
                    <td className="font-mono text-xs">{t.phone}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {t.subjects.map((sid) => {
                          const s = state.subjects.find((x) => x.id === sid);
                          return s ? <Badge key={sid} tone="info">{s.code}</Badge> : null;
                        })}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {t.classes.map((cid) => {
                          const c = state.classes.find((x) => x.id === cid);
                          return c ? <Badge key={cid} tone="muted">{c.grade}</Badge> : null;
                        })}
                      </div>
                    </td>
                    <td className="text-xs text-muted-foreground">{t.joiningDate}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => setEditing(t)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => remove(t.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Remove">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && <TeacherModal onClose={() => setOpen(false)} />}
      {editing && <TeacherModal teacher={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function TeacherModal({ teacher, onClose }: { teacher?: Teacher; onClose: () => void }) {
  const { state, update } = useStore();
  const isEdit = !!teacher;
  const [form, setForm] = useState({
    name: teacher?.name ?? "",
    email: teacher?.email ?? "",
    phone: teacher?.phone ?? "",
  });
  const [subjects, setSubjects] = useState<string[]>(teacher?.subjects ?? []);
  const [classes, setClasses] = useState<string[]>(teacher?.classes ?? []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error("Name and email required");
      return;
    }

    if (isEdit && teacher) {
      const tid = teacher.id;
      update(
        (s) => {
          // Build new valid (class,subject) combos for this teacher
          const newCombos = new Set<string>();
          classes.forEach((cid) => subjects.forEach((sid) => newCombos.add(`${cid}|${sid}`)));

          // Update teacher record
          const teachers = s.teachers.map((t) =>
            t.id === tid ? { ...t, name: form.name, email: form.email, phone: form.phone, subjects, classes } : t,
          );

          // Reconcile classSubjectAssignments:
          // - keep existing where combo still valid; remove teacher from classes/subjects no longer covered
          // - add new assignments for newly added combos (only if no other teacher already assigned)
          const remaining = s.classSubjectAssignments.filter((csa) => {
            if (csa.teacherId !== tid) return true;
            return newCombos.has(`${csa.classId}|${csa.subjectId}`);
          });
          const existingKeys = new Set(remaining.map((c) => `${c.classId}|${c.subjectId}`));
          const additions = Array.from(newCombos)
            .filter((k) => !existingKeys.has(k))
            .map((k) => {
              const [classId, subjectId] = k.split("|");
              return { id: `csa_${classId}_${subjectId}_${tid}`, classId, subjectId, teacherId: tid };
            });
          const classSubjectAssignments = [...remaining, ...additions];

          // Reconcile timetable slots: drop slots that no longer match a valid (class,subject,teacher=tid)
          const validKeys = new Set(classSubjectAssignments.map((c) => `${c.classId}|${c.subjectId}|${c.teacherId}`));
          const timetable = s.timetable.filter((slot) => {
            if (slot.teacherId !== tid) return true;
            return validKeys.has(`${slot.classId}|${slot.subjectId}|${tid}`);
          });

          // Update linked user
          const users = s.users.map((u) =>
            u.teacherId === tid ? { ...u, name: form.name, email: form.email } : u,
          );

          return { ...s, teachers, classSubjectAssignments, timetable, users };
        },
        { action: "edited teacher", entity: form.name },
      );
      toast.success("Teacher updated · classes & timetable reconciled");
      onClose();
      return;
    }

    // Create new
    const id = `tch_${Date.now()}`;
    update(
      (s) => ({
        ...s,
        teachers: [
          ...s.teachers,
          { id, name: form.name, email: form.email, phone: form.phone, subjects, classes, joiningDate: new Date().toISOString().split("T")[0] },
        ],
        users: [
          ...s.users,
          { id: `u_t_${id}`, email: form.email, password: "teacher", role: "teacher", name: form.name, teacherId: id },
        ],
        classSubjectAssignments: [
          ...s.classSubjectAssignments,
          ...classes.flatMap((cid) =>
            subjects
              .filter((sid) => !s.classSubjectAssignments.some((c) => c.classId === cid && c.subjectId === sid))
              .map((sid) => ({ id: `csa_${cid}_${sid}_${id}`, classId: cid, subjectId: sid, teacherId: id })),
          ),
        ],
      }),
      { action: "added teacher", entity: form.name },
    );
    toast.success("Teacher added");
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? `Edit ${teacher!.name}` : "Add teacher"} subtitle="Subjects & class assignments cascade to timetable">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
        <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <MultiToggle
          label="Subjects"
          values={state.subjects.map((s) => s.id)}
          selected={subjects}
          onChange={setSubjects}
          getLabel={(id) => state.subjects.find((s) => s.id === id)?.name ?? id}
        />
        <MultiToggle
          label="Classes"
          values={state.classes.map((c) => c.id)}
          selected={classes}
          onChange={setClasses}
          getLabel={(id) => state.classes.find((c) => c.id === id)?.name ?? id}
        />
        <FormActions onCancel={onClose} submitLabel={isEdit ? "Save changes" : "Add teacher"} />
      </form>
    </Modal>
  );
}