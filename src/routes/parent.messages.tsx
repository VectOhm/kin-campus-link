import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/erp/store/store";
import { Messaging } from "@/erp/components/Messaging";

export const Route = createFileRoute("/parent/messages")({ component: () => {
  const { state, currentUser } = useStore();
  const student = state.students.find((s) => s.id === currentUser?.studentId);
  const teacherIds = state.classSubjectAssignments.filter((a) => a.classId === student?.classId).map((a) => a.teacherId);
  const contacts = Array.from(new Set(teacherIds)).map((tid) => {
    const t = state.teachers.find((x) => x.id === tid);
    const u = state.users.find((u) => u.teacherId === tid);
    return { id: u?.id ?? "", name: t?.name ?? "", meta: t?.subjects.map((sid) => state.subjects.find((x) => x.id === sid)?.code).join(", ") };
  }).filter((c) => c.id);
  return <Messaging contacts={contacts} />;
}});
