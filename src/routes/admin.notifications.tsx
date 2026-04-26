import { createFileRoute } from "@tanstack/react-router";
import { NotificationsView } from "@/erp/components/NotificationsView";

export const Route = createFileRoute("/admin/notifications")({
  component: () => <NotificationsView title="Notifications" audienceOptions={["school", "class", "student"]} senderRole="admin" />,
});
