import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section, Badge, EmptyState } from "@/erp/components/Shell";
import { Field, SelectField, TextareaField, Modal, FormActions } from "@/erp/components/Form";
import { Plus, FileText, Trash2 } from "lucide-react";

export const Route = createFileRoute("/teacher/notes")({ component: NotesPage });

function NotesPage() {
  const { state, update, currentUser } = useStore();
  const teacher = state.teachers.find((t) => t.id === currentUser?.teacherId);
  const [open, setOpen] = useState(false);
  if (!teacher) return null;
  const list = state.notes.filter((n) => n.teacherId === teacher.id);
  return (
    <div>
      <PageHeader title="Notes & Materials" subtitle={`${list.length} uploaded`}
        actions={<button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"><Plus className="h-3.5 w-3.5" /> Upload</button>}
      />
      <div className="p-6">
        {list.length === 0 ? <EmptyState message="No notes uploaded yet" icon={FileText} /> : (
          <Section title="My Notes">
            <div className="grid gap-2 md:grid-cols-2">
              {list.map((n) => {
                const cls = state.classes.find((c) => c.id === n.classId);
                const sub = state.subjects.find((s) => s.id === n.subjectId);
                return (
                  <div key={n.id} className="rounded-md border border-border bg-card p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge tone="info">{sub?.code}</Badge>
                        <Badge tone="muted">{cls?.name}</Badge>
                      </div>
                      <button onClick={() => update((s) => ({ ...s, notes: s.notes.filter((x) => x.id !== n.id) }), { action: "removed note", entity: n.title })} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                    <h4 className="mt-2 text-sm font-medium">{n.title}</h4>
                    <p className="mt-1 text-xs text-muted-foreground whitespace-pre-line">{n.content}</p>
                  </div>
                );
              })}
            </div>
          </Section>
        )}
      </div>
      {open && <NoteModal onClose={() => setOpen(false)} />}
    </div>
  );
}

function NoteModal({ onClose }: { onClose: () => void }) {
  const { state, update, currentUser } = useStore();
  const teacher = state.teachers.find((t) => t.id === currentUser?.teacherId)!;
  const myCsa = state.classSubjectAssignments.filter((a) => a.teacherId === teacher.id);
  const [classId, setClassId] = useState(myCsa[0]?.classId ?? "");
  const subs = myCsa.filter((a) => a.classId === classId);
  const [subjectId, setSubjectId] = useState(subs[0]?.subjectId ?? "");
  const [title, setTitle] = useState(""); const [content, setContent] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;
    update((s) => ({ ...s, notes: [{ id: `nt_${Date.now()}`, teacherId: teacher.id, classId, subjectId, title, content, createdAt: new Date().toISOString() }, ...s.notes] }), { action: "uploaded note", entity: title });
    onClose();
  }
  return (
    <Modal open onClose={onClose} title="Upload note">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <SelectField label="Class" value={classId} onChange={(v) => { setClassId(v); const s = myCsa.filter((a) => a.classId === v); setSubjectId(s[0]?.subjectId ?? ""); }} options={Array.from(new Set(myCsa.map((a) => a.classId))).map((cid) => [cid, state.classes.find((c) => c.id === cid)?.name ?? ""])} />
        <SelectField label="Subject" value={subjectId} onChange={setSubjectId} options={subs.map((a) => [a.subjectId, state.subjects.find((s) => s.id === a.subjectId)?.name ?? ""])} />
        <div className="col-span-2"><Field label="Title" value={title} onChange={setTitle} /></div>
        <div className="col-span-2"><TextareaField label="Content" value={content} onChange={setContent} rows={6} /></div>
        <FormActions onCancel={onClose} submitLabel="Upload" />
      </form>
    </Modal>
  );
}
