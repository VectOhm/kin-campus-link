import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section, Badge, EmptyState } from "@/erp/components/Shell";
import { ScrollText } from "lucide-react";

export const Route = createFileRoute("/admin/logs")({
  component: LogsPage,
});

function LogsPage() {
  const { state } = useStore();
  return (
    <div>
      <PageHeader title="Activity Logs" subtitle={`${state.activityLogs.length} entries`} />
      <div className="p-6">
        <Section title="Recent Activity">
          {state.activityLogs.length === 0 ? (
            <EmptyState message="No activity yet. Make changes to populate the log." icon={ScrollText} />
          ) : (
            <table className="data-table w-full">
              <thead><tr><th>When</th><th>User</th><th>Role</th><th>Action</th><th>Entity</th></tr></thead>
              <tbody>
                {state.activityLogs.map((l) => (
                  <tr key={l.id}>
                    <td className="font-mono text-xs">{new Date(l.timestamp).toLocaleString()}</td>
                    <td>{l.userName}</td>
                    <td><Badge tone="muted">{l.role}</Badge></td>
                    <td>{l.action}</td>
                    <td className="font-mono text-xs">{l.entity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      </div>
    </div>
  );
}
