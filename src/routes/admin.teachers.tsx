import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/erp/store/store";
import { PageHeader, Badge, EmptyState } from "@/erp/components/Shell";
import { Field, SelectField, Modal, FormActions } from "@/erp/components/Form";
import { Plus, Trash2, GraduationCap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/teachers")({
  component: TeachersPage,
});

function TeachersPage() {
  const { state, update } = useStore();
  const [open, setOpen] = useState(false);

  function remove(id: string) {
    if (!confirm("Remove teacher?")) return;
    update(
      (s) => ({
        ...s,
        teachers: s.teachers.filter((t) => t.id !== id),
        users: s.users.filter((u) => u.teacherId !== id),
        classSubjectAssignments: s.classSubjectAssignments.filter((c) => c.teacherId !== id),
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
                      <button onClick={() => remove(t.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && <AddTeacherModal onClose={() => setOpen(false)} />}
    </div>
  );
}

function AddTeacherModal({ onClose }: { onClose: () => void }) {
  const { state, update } = useStore();
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [subjects, setSubjects] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);

  function toggle(arr: string[], setter: (v: string[]) => void, val: string) {
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error("Name and email required");
      return;
    }
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
    <Modal open onClose={onClose} title="Add teacher" subtitle="Assign subjects and classes">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
        <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <div className="col-span-2">
          <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Subjects</label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {state.subjects.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(subjects, setSubjects, s.id)}
                className={`rounded-md border px-2 py-1 text-xs ${subjects.includes(s.id) ? "border-accent bg-accent text-accent-foreground" : "border-border hover:bg-muted"}`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
        <div className="col-span-2">
          <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Classes</label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {state.classes.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(classes, setClasses, c.id)}
                className={`rounded-md border px-2 py-1 text-xs ${classes.includes(c.id) ? "border-accent bg-accent text-accent-foreground" : "border-border hover:bg-muted"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <FormActions onCancel={onClose} submitLabel="Add teacher" />
      </form>
    </Modal>
  );
}
