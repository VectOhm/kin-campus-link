import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section, Badge, Stat } from "@/erp/components/Shell";
import { toast } from "sonner";

export const Route = createFileRoute("/parent/fees")({ component: () => {
  const { state, update, currentUser } = useStore();
  const student = state.students.find((s) => s.id === currentUser?.studentId);
  if (!student) return null;
  const fees = state.feePayments.filter((f) => f.studentId === student.id);
  const pending = fees.filter((f) => f.status === "pending");
  const paid = fees.filter((f) => f.status === "paid");

  function pay(id: string) {
    update((s) => ({ ...s, feePayments: s.feePayments.map((f) => f.id === id ? { ...f, status: "paid", paidOn: new Date().toISOString().split("T")[0], receiptNo: `RC-${Date.now().toString().slice(-6)}` } : f) }), { action: "paid fee", entity: id });
    toast.success("Payment successful · Receipt generated");
  }

  return (
    <div>
      <PageHeader title="Fees" subtitle={`${student.name}`} />
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Stat label="Total Paid" value={`₹${paid.reduce((s, f) => s + f.amount, 0).toLocaleString()}`} tone="success" />
          <Stat label="Pending" value={`₹${pending.reduce((s, f) => s + f.amount, 0).toLocaleString()}`} tone="warning" />
          <Stat label="Receipts" value={paid.length} />
        </div>
        <Section title="Payment Schedule">
          <table className="data-table w-full">
            <thead><tr><th>Type</th><th>Due Date</th><th>Amount</th><th>Status</th><th>Receipt</th><th></th></tr></thead>
            <tbody>{fees.map((f) => (
              <tr key={f.id}>
                <td><Badge tone="muted">{f.type}</Badge></td>
                <td className="font-mono text-xs">{f.dueDate}</td>
                <td className="tabular-nums">₹{f.amount.toLocaleString()}</td>
                <td>{f.status === "paid" ? <Badge tone="success">paid</Badge> : <Badge tone="warning">pending</Badge>}</td>
                <td className="font-mono text-xs">{f.receiptNo ?? "—"}</td>
                <td>{f.status === "pending" && <button onClick={() => pay(f.id)} className="rounded bg-accent px-2 py-1 text-[11px] font-medium text-accent-foreground">Pay now</button>}</td>
              </tr>
            ))}</tbody>
          </table>
        </Section>
      </div>
    </div>
  );
}});
