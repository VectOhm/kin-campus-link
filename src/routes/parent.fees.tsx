import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section, Badge, Stat } from "@/erp/components/Shell";
import { toast } from "sonner";

export const Route = createFileRoute("/parent/fees")({
  component: () => {
    const { state, update, currentUser } = useStore();
    const student = state.students.find((s) => s.id === currentUser?.studentId);
    const [yearFilter, setYearFilter] = useState<string>("all");
    const [quarterFilter, setQuarterFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    if (!student) return null;
    const allFees = state.feePayments.filter((f) => f.studentId === student.id);
    const years = Array.from(new Set(allFees.map((f) => f.academicYear))).sort().reverse();
    const fees = allFees.filter((f) => {
      const matchYear = yearFilter === "all" || f.academicYear === yearFilter;
      const matchQ = quarterFilter === "all" || f.type === quarterFilter;
      const matchStatus = statusFilter === "all" || f.status === statusFilter;
      return matchYear && matchQ && matchStatus;
    });
    const pending = allFees.filter((f) => f.status === "pending");
    const paid = allFees.filter((f) => f.status === "paid");

    // Bus fee breakdown
    const route = state.busRoutes.find((b) => b.id === student.busRouteId);
    const stop = route?.stops.find((s) => s.id === student.busStopId) ?? route?.stops[0];
    const override = state.busFeeOverrides.find((o) => o.studentId === student.id);
    const distance = stop?.distanceKm ?? 0;
    const baseFare = route?.baseFare ?? 0;
    const perKm = route?.pricePerKm ?? 0;
    const computedBus = baseFare + perKm * distance;
    const monthlyBus = override?.amount ?? computedBus;

    function pay(id: string) {
      update(
        (s) => ({
          ...s,
          feePayments: s.feePayments.map((f) =>
            f.id === id
              ? {
                  ...f,
                  status: "paid",
                  paidOn: new Date().toISOString().split("T")[0],
                  receiptNo: `RC-${Date.now().toString().slice(-6)}`,
                }
              : f,
          ),
        }),
        { action: "paid fee", entity: id },
      );
      toast.success("Payment successful · Receipt generated");
    }

    return (
      <div>
        <PageHeader title="Fees" subtitle={`${student.name}`} />
        <div className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Stat
              label="Total Paid"
              value={`₹${paid.reduce((s, f) => s + f.amount, 0).toLocaleString()}`}
              tone="success"
            />
            <Stat
              label="Pending"
              value={`₹${pending.reduce((s, f) => s + f.amount, 0).toLocaleString()}`}
              tone="warning"
            />
            <Stat label="Receipts" value={paid.length} />
          </div>

          {route && (
            <Section title="Transport Fee Breakdown">
              <div className="grid gap-2 text-xs sm:grid-cols-2">
                <div className="flex justify-between border-b border-border py-1.5">
                  <span className="text-muted-foreground">Route</span>
                  <span className="font-medium">{route.name}</span>
                </div>
                <div className="flex justify-between border-b border-border py-1.5">
                  <span className="text-muted-foreground">Stop / Destination</span>
                  <span>{stop?.destination ?? stop?.name ?? "—"}</span>
                </div>
                <div className="flex justify-between border-b border-border py-1.5">
                  <span className="text-muted-foreground">Distance</span>
                  <span className="tabular-nums">{distance} km</span>
                </div>
                <div className="flex justify-between border-b border-border py-1.5">
                  <span className="text-muted-foreground">Base fare</span>
                  <span className="tabular-nums">₹{baseFare.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-border py-1.5">
                  <span className="text-muted-foreground">Per-km charge</span>
                  <span className="tabular-nums">
                    ₹{perKm} × {distance} km = ₹{(perKm * distance).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border py-1.5 font-semibold">
                  <span>Monthly bus fee</span>
                  <span className="tabular-nums text-info">₹{monthlyBus.toLocaleString()}</span>
                </div>
                {override && (
                  <div className="text-[10px] text-muted-foreground sm:col-span-2">
                    Custom override applied by admin.
                  </div>
                )}
              </div>
            </Section>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[11px] uppercase text-muted-foreground">Year</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs"
            >
              <option value="all">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <label className="text-[11px] uppercase text-muted-foreground">Quarter</label>
            <select
              value={quarterFilter}
              onChange={(e) => setQuarterFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs"
            >
              <option value="all">All</option>
              <option value="admission">Admission</option>
              <option value="Q1">Q1</option>
              <option value="Q2">Q2</option>
              <option value="Q3">Q3</option>
              <option value="Q4">Q4</option>
            </select>
            <label className="text-[11px] uppercase text-muted-foreground">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs"
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <Section title="Payment Schedule">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Receipt</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {fees.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <Badge tone="muted">{f.type}</Badge>
                    </td>
                    <td className="font-mono text-xs">{f.dueDate}</td>
                    <td className="tabular-nums">₹{f.amount.toLocaleString()}</td>
                    <td>
                      {f.status === "paid" ? (
                        <Badge tone="success">paid</Badge>
                      ) : (
                        <Badge tone="warning">pending</Badge>
                      )}
                    </td>
                    <td className="font-mono text-xs">{f.receiptNo ?? "—"}</td>
                    <td>
                      {f.status === "pending" && (
                        <button
                          onClick={() => pay(f.id)}
                          className="rounded bg-accent px-2 py-1 text-[11px] font-medium text-accent-foreground"
                        >
                          Pay now
                        </button>
                      )}
                    </td>
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
