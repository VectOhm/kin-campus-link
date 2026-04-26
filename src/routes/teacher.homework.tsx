import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section, Badge, EmptyState } from "@/erp/components/Shell";
import { Field, SelectField, TextareaField, Modal, FormActions } from "@/erp/components/Form";
import { Plus, BookOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher/homework")({ component: HomeworkPage });

function HomeworkPage() {
  const { state, update, currentUser } = useStore();
  const teacher = state.teachers.find((t) => t.id === currentUser?.teacherId);
  const [open, setOpen] = useState(false);
  if (!teacher) return null;
  const list = state.homework.filter((h) => h.teacherId === teacher.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div>
      <PageHeader title="Homework" subtitle={`${list.length} assignments`}
        actions={<button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"><Plus className="h-3.5 w-3.5" /> Assign</button>}
      />
      <div className="p-6">
        {list.length === 0 ? <EmptyState message="No homework assigned yet" icon={BookOpen} /> : (
          <Section title="All Assignments">
            <table className="data-table w-full">
              <thead><tr><th>Posted</th><th>Class</th><th>Subject</th><th>Title</th><th>Due</th><th></th></tr></thead>
              <tbody>
                {list.map((h) => {
                  const cls = state.classes.find((c) => c.id === h.classId);
                  const sub = state.subjects.find((s) => s.id === h.subjectId);
                  return (
                    <tr key={h.id}>
                      <td className="font-mono text-xs">{h.createdAt.split("T")[0]}</td>
                      <td><Badge tone="muted">{cls?.name}</Badge></td>
                      <td><Badge tone="info">{sub?.code}</Badge></td>
                      <td><div className="font-medium">{h.title}</div><div className="text-[11px] text-muted-foreground">{h.description}</div></td>
                      <td className="font-mono text-xs">{h.dueDate}</td>
                      <td><button onClick={() => update((s) => ({ ...s, homework: s.homework.filter((x) => x.id !== h.id) }), { action: "removed homework", entity: h.title })} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Section>
        )}
      </div>
      {open && <AssignModal onClose={() => setOpen(false)} />}
    </div>
  );
}

function AssignModal({ onClose }: { onClose: () => void }) {
  const { state, update, currentUser } = useStore();
  const teacher = state.teachers.find((t) => t.id === currentUser?.teacherId)!;
  const myCsa = state.classSubjectAssignments.filter((a) => a.teacherId === teacher.id);
  const [classId, setClassId] = useState(myCsa[0]?.classId ?? "");
  const subjectsForClass = myCsa.filter((a) => a.classId === classId);
  const [subjectId, setSubjectId] = useState(subjectsForClass[0]?.subjectId ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !classId || !subjectId) { toast.error("Fill all fields"); return; }
    update(
      (s) => ({ ...s, homework: [{ id: `hw_${Date.now()}`, classId, subjectId, teacherId: teacher.id, title, description, dueDate, createdAt: new Date().toISOString() }, ...s.homework] }),
      { action: "assigned homework", entity: title },
    );
    toast.success("Homework assigned");
    onClose();
  }

  return (
    <Modal open onClose={onClose} title="Assign homework">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <SelectField label="Class" value={classId} onChange={(v) => { setClassId(v); const s = myCsa.filter((a) => a.classId === v); setSubjectId(s[0]?.subjectId ?? ""); }} options={Array.from(new Set(myCsa.map((a) => a.classId))).map((cid) => [cid, state.classes.find((c) => c.id === cid)?.name ?? ""])} />
        <SelectField label="Subject" value={subjectId} onChange={setSubjectId} options={subjectsForClass.map((a) => [a.subjectId, state.subjects.find((s) => s.id === a.subjectId)?.name ?? ""])} />
        <div className="col-span-2"><Field label="Title" value={title} onChange={setTitle} /></div>
        <div className="col-span-2"><TextareaField label="Description" value={description} onChange={setDescription} /></div>
        <Field label="Due date" type="date" value={dueDate} onChange={setDueDate} />
        <FormActions onCancel={onClose} submitLabel="Assign" />
      </form>
    </Modal>
  );
}
