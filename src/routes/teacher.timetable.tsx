import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/erp/store/store";
import { PageHeader } from "@/erp/components/Shell";
import { TimetableView } from "@/erp/components/TimetableView";

export const Route = createFileRoute("/teacher/timetable")({ component: () => {
  const { currentUser } = useStore();
  return <div><PageHeader title="My Timetable" /><div className="p-6"><TimetableView teacherId={currentUser?.teacherId} /></div></div>;
}});
