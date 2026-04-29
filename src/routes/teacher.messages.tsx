import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/erp/store/store";
import { Messaging, type MessagingGroup } from "@/erp/components/Messaging";

export const Route = createFileRoute("/teacher/messages")({
  component: () => {
    const { state, currentUser } = useStore();
    if (!currentUser) return null;
    const groups: MessagingGroup[] = state.chatGroups
      .filter((g) => g.teacherUserIds.includes(currentUser.id))
      .map((g) => {
        const cls = state.classes.find((c) => c.id === g.classId);
        return {
          id: g.id,
          name: g.name,
          meta: cls?.name,
          memberCount: g.teacherUserIds.length + g.studentUserIds.length,
        };
      });
    return <Messaging groups={groups} />;
  },
});
