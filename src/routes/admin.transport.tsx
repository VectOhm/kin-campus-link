import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section, Badge } from "@/erp/components/Shell";
import { Field, Modal, FormActions } from "@/erp/components/Form";
import { Plus, Trash2, Bus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/transport")({
  component: TransportPage,
});

function TransportPage() {
  const { state, update } = useStore();
  const [openRoute, setOpenRoute] = useState(false);
  const [stopFor, setStopFor] = useState<string | null>(null);

  function removeRoute(id: string) {
    if (!confirm("Remove route?")) return;
    update(
      (s) => ({
        ...s,
        busRoutes: s.busRoutes.filter((b) => b.id !== id),
        students: s.students.map((st) => (st.busRouteId === id ? { ...st, busRouteId: undefined } : st)),
      }),
      { action: "removed bus route", entity: id },
    );
  }

  return (
    <div>
      <PageHeader
        title="Transport"
        subtitle={`${state.busRoutes.length} routes · ${state.busRoutes.reduce((s, b) => s + b.stops.length, 0)} stops`}
        actions={
          <button onClick={() => setOpenRoute(true)} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" /> New route
          </button>
        }
      />
      <div className="grid gap-3 p-6 md:grid-cols-2">
        {state.busRoutes.map((r) => {
          const assigned = state.students.filter((s) => s.busRouteId === r.id);
          return (
            <Section
              key={r.id}
              title={r.name}
              actions={
                <div className="flex items-center gap-2">
                  <Badge tone="info">{assigned.length} students</Badge>
                  <button onClick={() => removeRoute(r.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              }
            >
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Bus: </span><span className="font-mono">{r.busNumber}</span></div>
                <div><span className="text-muted-foreground">Driver: </span>{r.driverName}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Phone: </span><span className="font-mono">{r.driverPhone}</span></div>
              </div>
              <div className="mt-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Stops</h4>
                  <button onClick={() => setStopFor(r.id)} className="text-[11px] text-accent hover:underline">+ Add stop</button>
                </div>
                <table className="data-table w-full">
                  <thead><tr><th>Stop</th><th>Pickup</th><th>Drop</th></tr></thead>
                  <tbody>
                    {r.stops.map((s) => (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td className="font-mono text-xs">{s.pickupTime}</td>
                        <td className="font-mono text-xs">{s.dropTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          );
        })}
      </div>

      <Section title="Student Route Assignments">
        <div className="px-6 pb-6">
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="data-table w-full">
              <thead><tr><th>Student</th><th>Class</th><th>Route</th></tr></thead>
              <tbody>
                {state.students.map((s) => {
                  const cls = state.classes.find((c) => c.id === s.classId);
                  return (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{cls?.name}</td>
                      <td>
                        <select
                          value={s.busRouteId ?? ""}
                          onChange={(e) =>
                            update(
                              (st) => ({
                                ...st,
                                students: st.students.map((x) => (x.id === s.id ? { ...x, busRouteId: e.target.value || undefined } : x)),
                              }),
                              { action: "updated bus assignment", entity: s.name },
                            )
                          }
                          className="rounded border border-input bg-background px-2 py-1 text-xs"
                        >
                          <option value="">— None —</option>
                          {state.busRoutes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {openRoute && <AddRoute onClose={() => setOpenRoute(false)} />}
      {stopFor && <AddStop routeId={stopFor} onClose={() => setStopFor(null)} />}
    </div>
  );
}

function AddRoute({ onClose }: { onClose: () => void }) {
  const { update } = useStore();
  const [form, setForm] = useState({ name: "", driverName: "", driverPhone: "", busNumber: "" });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) { toast.error("Name required"); return; }
    update(
      (s) => ({ ...s, busRoutes: [...s.busRoutes, { id: `br_${Date.now()}`, ...form, stops: [] }] }),
      { action: "created route", entity: form.name },
    );
    toast.success("Route created");
    onClose();
  }
  return (
    <Modal open onClose={onClose} title="New bus route">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Route name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} /></div>
        <Field label="Driver" value={form.driverName} onChange={(v) => setForm({ ...form, driverName: v })} />
        <Field label="Driver phone" value={form.driverPhone} onChange={(v) => setForm({ ...form, driverPhone: v })} />
        <Field label="Bus number" value={form.busNumber} onChange={(v) => setForm({ ...form, busNumber: v })} />
        <FormActions onCancel={onClose} submitLabel="Create" />
      </form>
    </Modal>
  );
}

function AddStop({ routeId, onClose }: { routeId: string; onClose: () => void }) {
  const { update } = useStore();
  const [form, setForm] = useState({ name: "", pickupTime: "07:00", dropTime: "15:30" });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    update(
      (s) => ({
        ...s,
        busRoutes: s.busRoutes.map((r) =>
          r.id === routeId ? { ...r, stops: [...r.stops, { id: `bs_${Date.now()}`, ...form }] } : r,
        ),
      }),
      { action: "added stop", entity: form.name },
    );
    onClose();
  }
  return (
    <Modal open onClose={onClose} title="Add stop">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Stop name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} /></div>
        <Field label="Pickup" type="time" value={form.pickupTime} onChange={(v) => setForm({ ...form, pickupTime: v })} />
        <Field label="Drop" type="time" value={form.dropTime} onChange={(v) => setForm({ ...form, dropTime: v })} />
        <FormActions onCancel={onClose} submitLabel="Add" />
      </form>
    </Modal>
  );
}
