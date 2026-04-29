import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section } from "@/erp/components/Shell";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher/marks")({ component: MarksPage });

function MarksPage() {
  const { state, update, currentUser } = useStore();
  const teacher = state.teachers.find((t) => t.id === currentUser?.teacherId);
  const myCsa = state.classSubjectAssignments.filter((a) => a.teacherId === teacher?.id);
  const [classId, setClassId] = useState(myCsa[0]?.classId ?? "");
  const subs = myCsa.filter((a) => a.classId === classId);
  const [subjectId, setSubjectId] = useState(subs[0]?.subjectId ?? "");
  const [examId, setExamId] = useState(state.exams[0]?.id ?? "");
  if (!teacher) return null;
  const students = state.students.filter((s) => s.classId === classId);

  function setMark(studentId: string, value: string) {
    const m = Number(value);
    update((s) => {
      const existing = s.marks.find(
        (x) => x.studentId === studentId && x.examId === examId && x.subjectId === subjectId,
      );
      const grade = m >= 90 ? "A+" : m >= 80 ? "A" : m >= 70 ? "B" : m >= 60 ? "C" : "D";
      if (existing) {
        return {
          ...s,
          marks: s.marks.map((x) => (x.id === existing.id ? { ...x, marks: m, grade } : x)),
        };
      }
      return {
        ...s,
        marks: [
          ...s.marks,
          {
            id: `mk_${Date.now()}_${studentId}`,
            studentId,
            examId,
            subjectId,
            marks: m,
            maxMarks: 100,
            grade,
          },
        ],
      };
    });
  }

  return (
    <div>
      <PageHeader title="Marks Entry" />
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap gap-2">
          <select
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              const s = myCsa.filter((a) => a.classId === e.target.value);
              setSubjectId(s[0]?.subjectId ?? "");
            }}
            className="rounded border border-input bg-background px-2 py-1.5 text-sm"
          >
            {Array.from(new Set(myCsa.map((a) => a.classId))).map((cid) => (
              <option key={cid} value={cid}>
                {state.classes.find((c) => c.id === cid)?.name}
              </option>
            ))}
          </select>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="rounded border border-input bg-background px-2 py-1.5 text-sm"
          >
            {subs.map((a) => (
              <option key={a.subjectId} value={a.subjectId}>
                {state.subjects.find((s) => s.id === a.subjectId)?.name}
              </option>
            ))}
          </select>
          <select
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
            className="rounded border border-input bg-background px-2 py-1.5 text-sm"
          >
            {state.exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => toast.success("Marks saved")}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          >
            Save
          </button>
        </div>
        <Section title="Enter Marks (out of 100)">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Roll</th>
                <th>Student</th>
                <th>Marks</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const m = state.marks.find(
                  (x) => x.studentId === s.id && x.examId === examId && x.subjectId === subjectId,
                );
                return (
                  <tr key={s.id}>
                    <td className="font-mono text-xs">{s.rollNo}</td>
                    <td>{s.name}</td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        defaultValue={m?.marks ?? ""}
                        onBlur={(e) => e.target.value && setMark(s.id, e.target.value)}
                        className="w-20 rounded border border-input bg-background px-2 py-1 text-sm tabular-nums"
                      />
                    </td>
                    <td className="font-mono text-xs">{m?.grade ?? "—"}</td>
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
