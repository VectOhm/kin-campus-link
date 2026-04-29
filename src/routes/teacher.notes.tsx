import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section, Badge, EmptyState } from "@/erp/components/Shell";
import { Field, SelectField, TextareaField, Modal, FormActions } from "@/erp/components/Form";
import { Plus, FileText, Trash2, Sparkles } from "lucide-react";
import { ChatBot } from "@/erp/components/ChatBot";

export const Route = createFileRoute("/teacher/notes")({ component: NotesPage });

function NotesPage() {
  const { state, update, currentUser } = useStore();
  const teacher = state.teachers.find((t) => t.id === currentUser?.teacherId);
  const [open, setOpen] = useState(false);
  const [showBot, setShowBot] = useState(false);
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterClass, setFilterClass] = useState<string>("all");
  if (!teacher) return null;
  const t = teacher;
  const myCsa = state.classSubjectAssignments.filter((a) => a.teacherId === t.id);
  const list = state.notes
    .filter((n) => n.teacherId === t.id)
    .filter((n) => filterSubject === "all" || n.subjectId === filterSubject)
    .filter((n) => filterClass === "all" || n.classId === filterClass);

  function parseNote(input: string): string {
    const lower = input.toLowerCase();
    let classId = "";
    const clsMatch = input.match(/(?:class|grade)\s*(\d{1,2})(?:\s*[-]?\s*([a-z]))?/i);
    if (clsMatch) {
      const grade = Number(clsMatch[1]);
      const section = (clsMatch[2] ?? "A").toUpperCase();
      const cls = state.classes.find((c) => c.grade === grade && c.section === section);
      if (cls && t.classes.includes(cls.id)) classId = cls.id;
    }
    if (!classId) return "✗ Which class? Try: 'class 5-A'.";
    let subjectId = "";
    for (const sub of state.subjects) {
      if (lower.includes(sub.name.toLowerCase()) || lower.includes(sub.code.toLowerCase())) {
        if (t.subjects.includes(sub.id) && myCsa.some((a) => a.classId === classId && a.subjectId === sub.id)) {
          subjectId = sub.id;
          break;
        }
      }
    }
    if (!subjectId) return "✗ Which subject? You teach: " + t.subjects.map((sid) => state.subjects.find((s) => s.id === sid)?.name).join(", ");
    let title = "";
    let content = "";
    const quoted = input.match(/['"]([^'"]+)['"]/);
    if (quoted) title = quoted[1];
    const colon = input.indexOf(":");
    if (colon !== -1) {
      const tail = input.slice(colon + 1).trim();
      if (!title) {
        const dash = tail.indexOf(" - ");
        if (dash !== -1) {
          title = tail.slice(0, dash).trim();
          content = tail.slice(dash + 3).trim();
        } else {
          title = tail;
        }
      } else {
        content = tail;
      }
    }
    if (!title) title = "Study material";
    update(
      (s) => ({
        ...s,
        notes: [
          { id: `nt_${Date.now()}`, teacherId: t.id, classId, subjectId, title, content, createdAt: new Date().toISOString() },
          ...s.notes,
        ],
      }),
      { action: "uploaded note (chat)", entity: title },
    );
    const cls = state.classes.find((c) => c.id === classId);
    const sub = state.subjects.find((s) => s.id === subjectId);
    return `✓ Uploaded "${title}" to ${cls?.name} (${sub?.name}).`;
  }

  const myClassIds = Array.from(new Set(myCsa.map((a) => a.classId)));
  const mySubjectIds = Array.from(new Set(myCsa.map((a) => a.subjectId)));

  return (
    <div>
      <PageHeader title="Notes & Materials" subtitle={`${list.length} uploaded`}
        actions={
          <div className="flex gap-2">
            <button onClick={() => setShowBot((v) => !v)} className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
              <Sparkles className="h-3.5 w-3.5" /> {showBot ? "Hide" : "Chat"} assistant
            </button>
            <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"><Plus className="h-3.5 w-3.5" /> Upload</button>
          </div>
        }
      />
      <div className="space-y-4 p-6">
        {showBot && (
          <ChatBot
            title="Notes Assistant"
            placeholder="e.g. upload to class 5-A math: Algebra notes - x + y formulas"
            hints={[
              "class 5-A math: Algebra notes - quick formulas",
              "class 1-A english 'Reading list'",
            ]}
            onSubmit={parseNote}
          />
        )}
        <div className="flex flex-wrap gap-2">
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="rounded border border-input bg-background px-2 py-1.5 text-xs">
            <option value="all">All classes</option>
            {myClassIds.map((cid) => <option key={cid} value={cid}>{state.classes.find((c) => c.id === cid)?.name}</option>)}
          </select>
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="rounded border border-input bg-background px-2 py-1.5 text-xs">
            <option value="all">All subjects</option>
            {mySubjectIds.map((sid) => <option key={sid} value={sid}>{state.subjects.find((s) => s.id === sid)?.name}</option>)}
          </select>
        </div>
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
