import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/erp/store/store";
import { NotificationsView } from "@/erp/components/NotificationsView";

export const Route = createFileRoute("/teacher/notifications")({ component: () => {
  const { state, currentUser } = useStore();
  const teacher = state.teachers.find((t) => t.id === currentUser?.teacherId);
  const allowedStudents = state.students.filter((s) => teacher?.classes.includes(s.classId)).map((s) => s.id);
  return <NotificationsView title="Notifications" senderRole="teacher" forUserId={currentUser?.id} audienceOptions={["class", "student"]} allowedClassIds={teacher?.classes} allowedStudentIds={allowedStudents} />;
}});
