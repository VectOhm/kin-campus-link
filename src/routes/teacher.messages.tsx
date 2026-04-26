import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/erp/store/store";
import { Messaging } from "@/erp/components/Messaging";

export const Route = createFileRoute("/teacher/messages")({ component: () => {
  const { state, currentUser } = useStore();
  const teacher = state.teachers.find((t) => t.id === currentUser?.teacherId);
  const studentIds = state.students.filter((s) => teacher?.classes.includes(s.classId));
  const contacts = studentIds.map((s) => {
    const u = state.users.find((u) => u.studentId === s.id);
    return { id: u?.id ?? "", name: s.parentName, meta: `Parent of ${s.name}` };
  }).filter((c) => c.id);
  return <Messaging contacts={contacts} />;
}});
