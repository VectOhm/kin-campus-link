import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/erp/store/store";
import { NotificationsView } from "@/erp/components/NotificationsView";

export const Route = createFileRoute("/parent/notifications")({ component: () => {
  const { currentUser } = useStore();
  return <NotificationsView title="Notifications" senderRole="parent" forUserId={currentUser?.id} audienceOptions={["student"]} />;
}});
