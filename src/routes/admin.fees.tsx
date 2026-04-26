import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section, Badge, Stat } from "@/erp/components/Shell";

export const Route = createFileRoute("/admin/fees")({
  component: FeesPage,
});

function FeesPage() {
  const { state, update } = useStore();
  const [tab, setTab] = useState<"structure" | "payments">("structure");

  const collected = state.feePayments.filter((f) => f.status === "paid").reduce((s, f) => s + f.amount, 0);
  const pending = state.feePayments.filter((f) => f.status === "pending").reduce((s, f) => s + f.amount, 0);

  function updateFee(grade: number, field: "admissionFee" | "quarterlyFee", value: number) {
    update(
      (s) => ({
        ...s,
        feeStructures: s.feeStructures.map((f) => (f.grade === grade ? { ...f, [field]: value } : f)),
      }),
      { action: "updated fee structure", entity: `Grade ${grade}` },
    );
  }

  return (
    <div>
      <PageHeader title="Fees" subtitle="Structure and payment tracking" />
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Collected" value={`₹${collected.toLocaleString()}`} tone="success" />
          <Stat label="Pending" value={`₹${pending.toLocaleString()}`} tone="warning" />
          <Stat label="Paid" value={state.feePayments.filter((f) => f.status === "paid").length} />
          <Stat label="Overdue" value={state.feePayments.filter((f) => f.status === "pending").length} tone="danger" />
        </div>

        <div className="flex gap-1 rounded-md border border-border bg-muted p-1 w-fit">
          {[["structure", "Fee Structure"], ["payments", "All Payments"]].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k as any)}
              className={`rounded px-3 py-1 text-xs font-medium ${tab === k ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >{l}</button>
          ))}
        </div>

        {tab === "structure" ? (
          <Section title="Fee Structure by Grade">
            <table className="data-table w-full">
              <thead>
                <tr><th>Grade</th><th>Admission Fee (₹)</th><th>Quarterly Fee (₹)</th><th>Annual (₹)</th></tr>
              </thead>
              <tbody>
                {state.feeStructures.map((f) => (
                  <tr key={f.id}>
                    <td className="font-medium">Class {f.grade}</td>
                    <td>
                      <input
                        type="number"
                        value={f.admissionFee}
                        onChange={(e) => updateFee(f.grade, "admissionFee", Number(e.target.value))}
                        className="w-28 rounded border border-input bg-background px-2 py-1 text-sm tabular-nums"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={f.quarterlyFee}
                        onChange={(e) => updateFee(f.grade, "quarterlyFee", Number(e.target.value))}
                        className="w-28 rounded border border-input bg-background px-2 py-1 text-sm tabular-nums"
                      />
                    </td>
                    <td className="font-mono text-xs">₹{(f.admissionFee + f.quarterlyFee * 4).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        ) : (
          <Section title="All Payments">
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr><th>Receipt</th><th>Student</th><th>Class</th><th>Type</th><th>Amount</th><th>Status</th><th>Paid On</th></tr>
                </thead>
                <tbody>
                  {state.feePayments.slice(0, 100).map((p) => {
                    const st = state.students.find((s) => s.id === p.studentId);
                    const cls = state.classes.find((c) => c.id === st?.classId);
                    return (
                      <tr key={p.id}>
                        <td className="font-mono text-xs">{p.receiptNo ?? "—"}</td>
                        <td>{st?.name ?? "—"}</td>
                        <td>{cls?.name ?? "—"}</td>
                        <td><Badge tone="muted">{p.type}</Badge></td>
                        <td className="tabular-nums">₹{p.amount.toLocaleString()}</td>
                        <td>{p.status === "paid" ? <Badge tone="success">paid</Badge> : <Badge tone="warning">pending</Badge>}</td>
                        <td className="text-xs text-muted-foreground">{p.paidOn ?? p.dueDate}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
