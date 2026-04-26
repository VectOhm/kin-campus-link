import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/erp/store/store";
import { PageHeader } from "@/erp/components/Shell";
import { TimetableView } from "@/erp/components/TimetableView";

export const Route = createFileRoute("/parent/timetable")({ component: () => {
  const { state, currentUser } = useStore();
  const student = state.students.find((s) => s.id === currentUser?.studentId);
  return <div><PageHeader title="Class Timetable" /><div className="p-6"><TimetableView classId={student?.classId} /></div></div>;
}});
