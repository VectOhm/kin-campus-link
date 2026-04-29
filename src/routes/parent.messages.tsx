import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/erp/store/store";
import { Messaging, type MessagingGroup } from "@/erp/components/Messaging";

export const Route = createFileRoute("/parent/messages")({
  component: () => {
    const { state, currentUser } = useStore();
    if (!currentUser) return null;
    const groups: MessagingGroup[] = state.chatGroups
      .filter((g) => g.studentUserIds.includes(currentUser.id))
      .map((g) => {
        const cls = state.classes.find((c) => c.id === g.classId);
        const teacherNames = g.teacherUserIds
          .map((uid) => state.users.find((u) => u.id === uid)?.name)
          .filter(Boolean)
          .slice(0, 2)
          .join(", ");
        return {
          id: g.id,
          name: g.name,
          meta: `${cls?.name} · ${teacherNames}`,
          memberCount: g.teacherUserIds.length + g.studentUserIds.length,
        };
      });
    return <Messaging groups={groups} />;
  },
});
