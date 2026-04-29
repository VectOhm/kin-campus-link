import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section, Badge, EmptyState } from "@/erp/components/Shell";
import { Field, SelectField, TextareaField, Modal, FormActions } from "@/erp/components/Form";
import { Plus, BookOpen, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ChatBot } from "@/erp/components/ChatBot";

export const Route = createFileRoute("/teacher/homework")({ component: HomeworkPage });

function HomeworkPage() {
  const { state, update, currentUser } = useStore();
  const teacher = state.teachers.find((t) => t.id === currentUser?.teacherId);
  const [open, setOpen] = useState(false);
  const [showBot, setShowBot] = useState(false);
  if (!teacher) return null;
  const t = teacher;
  const list = state.homework.filter((h) => h.teacherId === t.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const myCsa = state.classSubjectAssignments.filter((a) => a.teacherId === t.id);

  function parseHomework(input: string): string {
    // Examples:
    // "assign to class 1-A subject Math: Chapter 3 - do questions 1-10 due 2026-05-01"
    // "homework class 5 math 'Algebra basics' due tomorrow"
    const lower = input.toLowerCase();

    // class — accept "class 1-A", "class 1", "1-A", "grade 5"
    let classId = "";
    const clsRe = /(?:class|grade)\s*(\d{1,2})(?:\s*[-]?\s*([a-z]))?/i;
    const clsMatch = input.match(clsRe);
    if (clsMatch) {
      const grade = Number(clsMatch[1]);
      const section = (clsMatch[2] ?? "A").toUpperCase();
      const cls = state.classes.find((c) => c.grade === grade && c.section === section);
      if (cls && t.classes.includes(cls.id)) classId = cls.id;
    }
    if (!classId) return "✗ Tell me which class. Try: 'class 5-A' or 'grade 3'.";

    // subject — match by name or code
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

    // due date — "due 2026-05-01", "due tomorrow", "due in 3 days", "due friday"
    let dueDate = new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0];
    const dueIso = input.match(/due\s+(\d{4}-\d{2}-\d{2})/i);
    if (dueIso) dueDate = dueIso[1];
    else if (/\btomorrow\b/i.test(input)) dueDate = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    else {
      const inDays = input.match(/due\s+in\s+(\d+)\s*days?/i);
      if (inDays) dueDate = new Date(Date.now() + 86400000 * Number(inDays[1])).toISOString().split("T")[0];
    }

    // title/description — text after ':' or after subject mention; quoted strings preferred
    let title = "";
    let description = "";
    const quoted = input.match(/['"]([^'"]+)['"]/);
    if (quoted) title = quoted[1];
    const colon = input.indexOf(":");
    if (colon !== -1) {
      const tail = input.slice(colon + 1).replace(/due[^.]*$/i, "").trim();
      if (!title) {
        const dashIdx = tail.indexOf(" - ");
        if (dashIdx !== -1) {
          title = tail.slice(0, dashIdx).trim();
          description = tail.slice(dashIdx + 3).trim();
        } else {
          title = tail;
        }
      } else {
        description = tail;
      }
    }
    if (!title) title = "Homework assignment";

    update(
      (s) => ({
        ...s,
        homework: [
          { id: `hw_${Date.now()}`, classId, subjectId, teacherId: t.id, title, description, dueDate, createdAt: new Date().toISOString() },
          ...s.homework,
        ],
      }),
      { action: "assigned homework (chat)", entity: title },
    );
    const cls = state.classes.find((c) => c.id === classId);
    const sub = state.subjects.find((s) => s.id === subjectId);
    return `✓ Assigned "${title}" to ${cls?.name} (${sub?.name}), due ${dueDate}.`;
  }

  return (
    <div>
      <PageHeader title="Homework" subtitle={`${list.length} assignments`}
        actions={
          <div className="flex gap-2">
            <button onClick={() => setShowBot((v) => !v)} className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
              <Sparkles className="h-3.5 w-3.5" /> {showBot ? "Hide" : "Chat"} assistant
            </button>
            <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"><Plus className="h-3.5 w-3.5" /> Assign</button>
          </div>
        }
      />
      <div className="space-y-4 p-6">
        {showBot && (
          <ChatBot
            title="Homework Assistant"
            placeholder="e.g. assign to class 5-A math: Chapter 3 — do Q1-10 due 2026-05-05"
            hints={[
              "assign to class 1-A english: Read chapter 2 due tomorrow",
              "homework class 5-A math 'Algebra basics' due in 3 days",
            ]}
            onSubmit={parseHomework}
          />
        )}
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
