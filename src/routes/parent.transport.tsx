import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section, EmptyState } from "@/erp/components/Shell";
import { Bus } from "lucide-react";

export const Route = createFileRoute("/parent/transport")({
  component: () => {
    const { state, currentUser } = useStore();
    const student = state.students.find((s) => s.id === currentUser?.studentId);
    const route = state.busRoutes.find((b) => b.id === student?.busRouteId);
    return (
      <div>
        <PageHeader title="Transport" />
        <div className="p-6">
          {!route ? (
            <EmptyState message="No bus route assigned. Contact admin to assign one." icon={Bus} />
          ) : (
            <Section title={route.name}>
              <div className="mb-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Bus: </span>
                  <span className="font-mono">{route.busNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Driver: </span>
                  {route.driverName}
                </div>
                <div>
                  <span className="text-muted-foreground">Phone: </span>
                  <span className="font-mono">{route.driverPhone}</span>
                </div>
              </div>
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Stop</th>
                    <th>Pickup</th>
                    <th>Drop</th>
                  </tr>
                </thead>
                <tbody>
                  {route.stops.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td className="font-mono text-xs">{s.pickupTime}</td>
                      <td className="font-mono text-xs">{s.dropTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}
        </div>
      </div>
    );
  },
});
