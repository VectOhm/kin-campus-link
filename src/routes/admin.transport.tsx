import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section, Badge } from "@/erp/components/Shell";
import { Field, Modal, FormActions } from "@/erp/components/Form";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { BusRoute, BusStop } from "@/erp/types";

export const Route = createFileRoute("/admin/transport")({
  component: TransportPage,
});

/** Compute monthly bus fare for a student based on their assigned route + nearest stop distance */
export function computeBusFare(route: BusRoute | undefined, stop?: BusStop): number {
  if (!route) return 0;
  const base = route.baseFare ?? 0;
  const perKm = route.pricePerKm ?? 0;
  const distance = stop?.distanceKm ?? Math.max(...route.stops.map((s) => s.distanceKm ?? 0), 0);
  return Math.round(base + perKm * distance);
}

function TransportPage() {
  const { state, update } = useStore();
  const [openRoute, setOpenRoute] = useState(false);
  const [editRoute, setEditRoute] = useState<BusRoute | null>(null);
  const [stopFor, setStopFor] = useState<{ routeId: string; stop?: BusStop } | null>(null);

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

  function removeStop(routeId: string, stopId: string) {
    update((s) => ({
      ...s,
      busRoutes: s.busRoutes.map((r) => r.id === routeId ? { ...r, stops: r.stops.filter((x) => x.id !== stopId) } : r),
    }), { action: "removed stop", entity: stopId });
  }

  return (
    <div>
      <PageHeader
        title="Transport"
        subtitle={`${state.busRoutes.length} routes · base fare + ₹/km × distance = monthly bus fee`}
        actions={
          <button onClick={() => setOpenRoute(true)} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" /> New route
          </button>
        }
      />
      <div className="space-y-4 p-6">
        <div className="grid gap-3 md:grid-cols-2">
          {state.busRoutes.map((r) => {
            const assigned = state.students.filter((s) => s.busRouteId === r.id);
            return (
              <Section
                key={r.id}
                title={r.name}
                actions={
                  <div className="flex items-center gap-2">
                    <Badge tone="info">{assigned.length} students</Badge>
                    <button onClick={() => setEditRoute(r)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => removeRoute(r.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                }
              >
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Bus: </span><span className="font-mono">{r.busNumber}</span></div>
                  <div><span className="text-muted-foreground">Driver: </span>{r.driverName}</div>
                  <div><span className="text-muted-foreground">Phone: </span><span className="font-mono">{r.driverPhone}</span></div>
                  <div><span className="text-muted-foreground">Pricing: </span>₹{r.baseFare ?? 0} + ₹{r.pricePerKm ?? 0}/km</div>
                </div>
                <div className="mt-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Stops · destinations</h4>
                    <button onClick={() => setStopFor({ routeId: r.id })} className="text-[11px] text-accent hover:underline">+ Add stop</button>
                  </div>
                  <table className="data-table w-full">
                    <thead><tr><th>Stop</th><th>Destination</th><th>Distance</th><th>Pickup</th><th>Drop</th><th>Fare</th><th></th></tr></thead>
                    <tbody>
                      {r.stops.map((s) => (
                        <tr key={s.id}>
                          <td>{s.name}</td>
                          <td className="text-xs text-muted-foreground">{s.destination ?? "—"}</td>
                          <td className="font-mono text-xs">{s.distanceKm ?? 0} km</td>
                          <td className="font-mono text-xs">{s.pickupTime}</td>
                          <td className="font-mono text-xs">{s.dropTime}</td>
                          <td className="tabular-nums text-xs">₹{computeBusFare(r, s).toLocaleString()}</td>
                          <td>
                            <div className="flex gap-0.5">
                              <button onClick={() => setStopFor({ routeId: r.id, stop: s })} className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="h-3 w-3" /></button>
                              <button onClick={() => removeStop(r.id, s.id)} className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                            </div>
                          </td>
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
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="data-table w-full">
              <thead><tr><th>Student</th><th>Class</th><th>Route</th><th>Stop</th><th>Monthly Fare</th></tr></thead>
              <tbody>
                {state.students.map((s) => {
                  const cls = state.classes.find((c) => c.id === s.classId);
                  const route = state.busRoutes.find((b) => b.id === s.busRouteId);
                  const stop = route?.stops[0];
                  const fare = computeBusFare(route, stop);
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
                      <td className="text-xs text-muted-foreground">{stop?.name ?? "—"}</td>
                      <td className="tabular-nums text-xs">{route ? `₹${fare.toLocaleString()}` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      {openRoute && <RouteModal onClose={() => setOpenRoute(false)} />}
      {editRoute && <RouteModal route={editRoute} onClose={() => setEditRoute(null)} />}
      {stopFor && <StopModal routeId={stopFor.routeId} stop={stopFor.stop} onClose={() => setStopFor(null)} />}
    </div>
  );
}

function RouteModal({ route, onClose }: { route?: BusRoute; onClose: () => void }) {
  const { update } = useStore();
  const isEdit = !!route;
  const [form, setForm] = useState({
    name: route?.name ?? "",
    driverName: route?.driverName ?? "",
    driverPhone: route?.driverPhone ?? "",
    busNumber: route?.busNumber ?? "",
    baseFare: String(route?.baseFare ?? 800),
    pricePerKm: String(route?.pricePerKm ?? 25),
  });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) { toast.error("Name required"); return; }
    const payload = {
      name: form.name,
      driverName: form.driverName,
      driverPhone: form.driverPhone,
      busNumber: form.busNumber,
      baseFare: Number(form.baseFare) || 0,
      pricePerKm: Number(form.pricePerKm) || 0,
    };
    if (isEdit && route) {
      update((s) => ({ ...s, busRoutes: s.busRoutes.map((r) => r.id === route.id ? { ...r, ...payload } : r) }), { action: "edited route", entity: form.name });
      toast.success("Route updated");
    } else {
      update((s) => ({ ...s, busRoutes: [...s.busRoutes, { id: `br_${Date.now()}`, ...payload, stops: [] }] }), { action: "created route", entity: form.name });
      toast.success("Route created");
    }
    onClose();
  }
  return (
    <Modal open onClose={onClose} title={isEdit ? `Edit ${route!.name}` : "New bus route"}>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Route name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} /></div>
        <Field label="Driver" value={form.driverName} onChange={(v) => setForm({ ...form, driverName: v })} />
        <Field label="Driver phone" value={form.driverPhone} onChange={(v) => setForm({ ...form, driverPhone: v })} />
        <Field label="Bus number" value={form.busNumber} onChange={(v) => setForm({ ...form, busNumber: v })} />
        <Field label="Base fare (₹/month)" type="number" value={form.baseFare} onChange={(v) => setForm({ ...form, baseFare: v })} />
        <Field label="Price per km (₹)" type="number" value={form.pricePerKm} onChange={(v) => setForm({ ...form, pricePerKm: v })} />
        <FormActions onCancel={onClose} submitLabel={isEdit ? "Save" : "Create"} />
      </form>
    </Modal>
  );
}

function StopModal({ routeId, stop, onClose }: { routeId: string; stop?: BusStop; onClose: () => void }) {
  const { update } = useStore();
  const isEdit = !!stop;
  const [form, setForm] = useState({
    name: stop?.name ?? "",
    destination: stop?.destination ?? "",
    distanceKm: String(stop?.distanceKm ?? 5),
    pickupTime: stop?.pickupTime ?? "07:00",
    dropTime: stop?.dropTime ?? "15:30",
  });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    const payload: BusStop = {
      id: stop?.id ?? `bs_${Date.now()}`,
      name: form.name,
      destination: form.destination,
      distanceKm: Number(form.distanceKm) || 0,
      pickupTime: form.pickupTime,
      dropTime: form.dropTime,
    };
    update(
      (s) => ({
        ...s,
        busRoutes: s.busRoutes.map((r) =>
          r.id === routeId
            ? { ...r, stops: isEdit ? r.stops.map((x) => x.id === stop!.id ? payload : x) : [...r.stops, payload] }
            : r,
        ),
      }),
      { action: isEdit ? "edited stop" : "added stop", entity: form.name },
    );
    onClose();
  }
  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit stop" : "Add stop"}>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <Field label="Stop name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Field label="Destination/Area" value={form.destination} onChange={(v) => setForm({ ...form, destination: v })} />
        <Field label="Distance from school (km)" type="number" value={form.distanceKm} onChange={(v) => setForm({ ...form, distanceKm: v })} />
        <div />
        <Field label="Pickup" type="time" value={form.pickupTime} onChange={(v) => setForm({ ...form, pickupTime: v })} />
        <Field label="Drop" type="time" value={form.dropTime} onChange={(v) => setForm({ ...form, dropTime: v })} />
        <FormActions onCancel={onClose} submitLabel={isEdit ? "Save" : "Add"} />
      </form>
    </Modal>
  );
}