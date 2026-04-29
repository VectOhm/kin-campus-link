import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section, Badge } from "@/erp/components/Shell";

export const Route = createFileRoute("/parent/calendar")({
  component: () => {
    const { state } = useStore();
    const sorted = [...state.calendar].sort((a, b) => a.date.localeCompare(b.date));
    return (
      <div>
        <PageHeader title="Academic Calendar" />
        <div className="p-6">
          <Section title="Upcoming">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((e) => (
                  <tr key={e.id}>
                    <td className="font-mono text-xs">
                      {e.date}
                      {e.endDate && ` → ${e.endDate}`}
                    </td>
                    <td>
                      <Badge
                        tone={
                          e.type === "holiday" ? "info" : e.type === "exam" ? "warning" : "muted"
                        }
                      >
                        {e.type}
                      </Badge>
                    </td>
                    <td className="font-medium">{e.title}</td>
                    <td className="text-xs text-muted-foreground">{e.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      </div>
    );
  },
});
