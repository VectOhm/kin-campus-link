import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section, Badge, Stat } from "@/erp/components/Shell";
import { Search } from "lucide-react";

export const Route = createFileRoute("/admin/fees")({
  component: FeesPage,
});

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;

function FeesPage() {
  const { state, update } = useStore();
  const [tab, setTab] = useState<"structure" | "students" | "payments">("students");

  // filters
  const allYears = useMemo(
    () =>
      Array.from(new Set(state.feePayments.map((f) => f.academicYear)))
        .sort()
        .reverse(),
    [state.feePayments],
  );
  const [year, setYear] = useState(allYears[0] ?? "");
  const [quarter, setQuarter] = useState<"all" | (typeof QUARTERS)[number] | "admission">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">("all");
  const [classFilter, setClassFilter] = useState("all");
  const [q, setQ] = useState("");

  const collected = state.feePayments
    .filter((f) => f.status === "paid")
    .reduce((s, f) => s + f.amount, 0);
  const pending = state.feePayments
    .filter((f) => f.status === "pending")
    .reduce((s, f) => s + f.amount, 0);

  function updateFee(grade: number, field: "admissionFee" | "quarterlyFee", value: number) {
    update(
      (s) => ({
        ...s,
        feeStructures: s.feeStructures.map((f) =>
          f.grade === grade ? { ...f, [field]: value } : f,
        ),
      }),
      { action: "updated fee structure", entity: `Grade ${grade}` },
    );
  }

  function togglePaid(paymentId: string) {
    update(
      (s) => ({
        ...s,
        feePayments: s.feePayments.map((p) =>
          p.id === paymentId
            ? p.status === "paid"
              ? { ...p, status: "pending", paidOn: undefined, receiptNo: undefined }
              : {
                  ...p,
                  status: "paid",
                  paidOn: new Date().toISOString().split("T")[0],
                  receiptNo: p.receiptNo ?? `RC-${Date.now().toString().slice(-6)}`,
                }
            : p,
        ),
      }),
      { action: "toggled payment", entity: paymentId },
    );
  }

  // Filtered payments list
  const filteredPayments = state.feePayments.filter((p) => {
    if (year && p.academicYear !== year) return false;
    if (quarter !== "all" && p.type !== quarter) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    const st = state.students.find((s) => s.id === p.studentId);
    if (!st) return false;
    if (classFilter !== "all" && st.classId !== classFilter) return false;
    if (
      q &&
      !st.name.toLowerCase().includes(q.toLowerCase()) &&
      !st.rollNo.toLowerCase().includes(q.toLowerCase())
    )
      return false;
    return true;
  });

  // Per-student quarterly grid
  const studentsForGrid = state.students
    .filter((s) => classFilter === "all" || s.classId === classFilter)
    .filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q.toLowerCase()) ||
        s.rollNo.toLowerCase().includes(q.toLowerCase()),
    );

  return (
    <div>
      <PageHeader
        title="Fees"
        subtitle="Structure, per-student quarterly status and full payment ledger"
      />
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Collected" value={`₹${collected.toLocaleString()}`} tone="success" />
          <Stat label="Pending" value={`₹${pending.toLocaleString()}`} tone="warning" />
          <Stat
            label="Paid records"
            value={state.feePayments.filter((f) => f.status === "paid").length}
          />
          <Stat
            label="Pending records"
            value={state.feePayments.filter((f) => f.status === "pending").length}
            tone="danger"
          />
        </div>

        <div className="flex gap-1 rounded-md border border-border bg-muted p-1 w-fit">
          {[
            ["students", "By Student"],
            ["payments", "All Payments"],
            ["structure", "Fee Structure"],
          ].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k as typeof tab)}
              className={`rounded px-3 py-1 text-xs font-medium ${tab === k ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              {l}
            </button>
          ))}
        </div>

        {tab !== "structure" && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px] flex-1">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                placeholder="Search student or roll no…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-3 text-sm"
              />
            </div>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            >
              {allYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              value={quarter}
              onChange={(e) => setQuarter(e.target.value as typeof quarter)}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            >
              <option value="all">All quarters</option>
              {QUARTERS.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
              <option value="admission">Admission</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            >
              <option value="all">All status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending / Not paid</option>
            </select>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            >
              <option value="all">All classes</option>
              {state.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {tab === "structure" && (
          <Section title="Fee Structure by Grade">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Grade</th>
                  <th>Admission Fee (₹)</th>
                  <th>Quarterly Fee (₹)</th>
                  <th>Annual (₹)</th>
                </tr>
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
                    <td className="font-mono text-xs">
                      ₹{(f.admissionFee + f.quarterlyFee * 4).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {tab === "students" && (
          <Section title="Per-Student Quarterly Status">
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Roll</th>
                    <th>Student</th>
                    <th>Class</th>
                    {QUARTERS.map((q) => (
                      <th key={q}>{q}</th>
                    ))}
                    <th>Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsForGrid.map((s) => {
                    const cls = state.classes.find((c) => c.id === s.classId);
                    const studentPays = state.feePayments.filter(
                      (p) => p.studentId === s.id && (!year || p.academicYear === year),
                    );
                    const pending = studentPays
                      .filter((p) => p.status === "pending")
                      .reduce((sum, p) => sum + p.amount, 0);
                    return (
                      <tr key={s.id}>
                        <td className="font-mono text-xs">{s.rollNo}</td>
                        <td className="font-medium">{s.name}</td>
                        <td className="text-xs">{cls?.name}</td>
                        {QUARTERS.map((qk) => {
                          const p = studentPays.find((x) => x.type === qk);
                          if (!p)
                            return (
                              <td key={qk} className="text-muted-foreground">
                                —
                              </td>
                            );
                          if (statusFilter !== "all" && p.status !== statusFilter)
                            return (
                              <td key={qk} className="text-muted-foreground/40">
                                ·
                              </td>
                            );
                          return (
                            <td key={qk}>
                              <button
                                onClick={() => togglePaid(p.id)}
                                title={`Click to mark ${p.status === "paid" ? "pending" : "paid"}`}
                              >
                                {p.status === "paid" ? (
                                  <Badge tone="success">paid</Badge>
                                ) : (
                                  <Badge tone="warning">pending</Badge>
                                )}
                              </button>
                            </td>
                          );
                        })}
                        <td className="tabular-nums text-xs">
                          {pending > 0 ? (
                            <span className="text-destructive">₹{pending.toLocaleString()}</span>
                          ) : (
                            <span className="text-success">₹0</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {tab === "payments" && (
          <Section title={`Payments (${filteredPayments.length})`}>
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Receipt</th>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Year</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.slice(0, 200).map((p) => {
                    const st = state.students.find((s) => s.id === p.studentId);
                    const cls = state.classes.find((c) => c.id === st?.classId);
                    return (
                      <tr key={p.id}>
                        <td className="font-mono text-xs">{p.receiptNo ?? "—"}</td>
                        <td>{st?.name ?? "—"}</td>
                        <td className="text-xs">{cls?.name ?? "—"}</td>
                        <td>
                          <Badge tone="muted">{p.type}</Badge>
                        </td>
                        <td className="tabular-nums">₹{p.amount.toLocaleString()}</td>
                        <td>
                          <button onClick={() => togglePaid(p.id)}>
                            {p.status === "paid" ? (
                              <Badge tone="success">paid</Badge>
                            ) : (
                              <Badge tone="warning">pending</Badge>
                            )}
                          </button>
                        </td>
                        <td className="text-xs">{p.academicYear}</td>
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
