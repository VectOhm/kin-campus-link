import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section, Stat, Badge } from "@/erp/components/Shell";
import { Field, SelectField, Modal, FormActions } from "@/erp/components/Form";
import { Plus, Trash2, Search, Bot, Send, Wallet } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/expenses")({
  component: ExpensesPage,
});

const CATS = ["Salaries", "Utilities", "Maintenance", "Supplies", "Transport", "Events", "Other"];

function ExpensesPage() {
  const [tab, setTab] = useState<"expenses" | "salaries">("expenses");
  return (
    <div>
      <PageHeader title="Expenses & Payroll" subtitle="Track operational spend, run payroll with tax calculation" />
      <div className="space-y-4 p-6">
        <div className="flex gap-1 rounded-md border border-border bg-muted p-1 w-fit">
          {[["expenses", "Expenses"], ["salaries", "Staff Payroll"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k as typeof tab)}
              className={`rounded px-3 py-1 text-xs font-medium ${tab === k ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
              {l}
            </button>
          ))}
        </div>
        {tab === "expenses" ? <ExpensesPanel /> : <PayrollPanel />}
      </div>
    </div>
  );
}

function ExpensesPanel() {
  const { state, update } = useStore();
  const [open, setOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // filters
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [minA, setMinA] = useState("");
  const [maxA, setMaxA] = useState("");

  const total = state.expenses.reduce((s, e) => s + e.amount, 0);
  const today = new Date().toISOString().split("T")[0];
  const todayTotal = state.expenses.filter((e) => e.date === today).reduce((s, e) => s + e.amount, 0);
  const monthStart = new Date(); monthStart.setDate(1);
  const monthTotal = state.expenses.filter((e) => new Date(e.date) >= monthStart).reduce((s, e) => s + e.amount, 0);

  const filtered = state.expenses.filter((e) => {
    if (cat !== "all" && e.category !== cat) return false;
    if (from && e.date < from) return false;
    if (to && e.date > to) return false;
    if (minA && e.amount < Number(minA)) return false;
    if (maxA && e.amount > Number(maxA)) return false;
    if (q && !e.description.toLowerCase().includes(q.toLowerCase()) && !e.category.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const filteredTotal = filtered.reduce((s, e) => s + e.amount, 0);

  const byCategory = CATS.map((c) => ({
    cat: c,
    total: state.expenses.filter((e) => e.category === c).reduce((s, e) => s + e.amount, 0),
  })).filter((x) => x.total > 0);

  function remove(id: string) {
    update((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) }), { action: "removed expense", entity: id });
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Today" value={`₹${todayTotal.toLocaleString()}`} />
        <Stat label="This Month" value={`₹${monthTotal.toLocaleString()}`} tone="warning" />
        <Stat label="All-time" value={`₹${total.toLocaleString()}`} tone="danger" />
        <Stat label="Filtered" value={`₹${filteredTotal.toLocaleString()}`} tone="info" hint={`${filtered.length} entries`} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <input placeholder="Search description…" value={q} onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-3 text-sm" />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1.5 text-sm">
          <option value="all">All categories</option>
          {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1.5 text-sm" title="From" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1.5 text-sm" title="To" />
        <input type="number" placeholder="Min ₹" value={minA} onChange={(e) => setMinA(e.target.value)} className="w-24 rounded-md border border-input bg-background px-2 py-1.5 text-sm" />
        <input type="number" placeholder="Max ₹" value={maxA} onChange={(e) => setMaxA(e.target.value)} className="w-24 rounded-md border border-input bg-background px-2 py-1.5 text-sm" />
        <button onClick={() => { setQ(""); setCat("all"); setFrom(""); setTo(""); setMinA(""); setMaxA(""); }}
          className="rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted">Clear</button>
        <button onClick={() => setChatOpen(true)} className="ml-auto flex items-center gap-1.5 rounded-md border border-accent/50 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20">
          <Bot className="h-3.5 w-3.5" /> Chat add
        </button>
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-3.5 w-3.5" /> Add expense
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section title={`Expenses (${filtered.length})`}>
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th></th></tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 100).map((e) => (
                    <tr key={e.id}>
                      <td className="font-mono text-xs">{e.date}</td>
                      <td><Badge tone="muted">{e.category}</Badge></td>
                      <td>{e.description}</td>
                      <td className="tabular-nums">₹{e.amount.toLocaleString()}</td>
                      <td>
                        <button onClick={() => remove(e.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
        <Section title="By Category">
          <div className="space-y-2">
            {byCategory.map((b) => {
              const pct = (b.total / total) * 100;
              return (
                <div key={b.cat}>
                  <div className="flex justify-between text-xs">
                    <span>{b.cat}</span>
                    <span className="tabular-nums text-muted-foreground">₹{b.total.toLocaleString()}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      </div>

      {open && <AddExpense onClose={() => setOpen(false)} />}
      {chatOpen && <ExpenseChatBot onClose={() => setChatOpen(false)} />}
    </>
  );
}

function AddExpense({ onClose }: { onClose: () => void }) {
  const { update, currentUser } = useStore();
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    category: CATS[0],
    description: "",
    amount: "",
  });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description || !form.amount) { toast.error("All fields required"); return; }
    update(
      (s) => ({
        ...s,
        expenses: [
          { id: `exp_${Date.now()}`, date: form.date, category: form.category, description: form.description, amount: Number(form.amount), addedBy: currentUser?.name ?? "Admin" },
          ...s.expenses,
        ],
      }),
      { action: "added expense", entity: form.description },
    );
    toast.success("Expense added");
    onClose();
  }
  return (
    <Modal open onClose={onClose} title="Add expense">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <Field label="Date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
        <SelectField label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={CATS.map((c) => [c, c])} />
        <div className="col-span-2"><Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} /></div>
        <Field label="Amount (₹)" type="number" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} />
        <FormActions onCancel={onClose} submitLabel="Add" />
      </form>
    </Modal>
  );
}

/* ============ Chat bot for expenses ============ */

interface ChatMsg { id: string; from: "bot" | "user"; text: string; }

function parseExpense(text: string): { amount: number; category: string; description: string } | null {
  // Patterns: "add 550 for utilities", "550 utilities", "spent 1200 on supplies for printer ink"
  const t = text.toLowerCase().trim();
  const amtMatch = t.match(/(?:rs\.?|₹|inr)?\s*(\d{1,7})(?:\.\d+)?/);
  if (!amtMatch) return null;
  const amount = Number(amtMatch[1]);

  // detect category
  let category = "Other";
  for (const c of CATS) {
    if (t.includes(c.toLowerCase())) { category = c; break; }
  }
  // synonyms
  const syn: Record<string, string> = {
    "electricity": "Utilities", "water": "Utilities", "internet": "Utilities", "wifi": "Utilities", "bill": "Utilities",
    "repair": "Maintenance", "fix": "Maintenance", "paint": "Maintenance",
    "salary": "Salaries", "wage": "Salaries",
    "stationery": "Supplies", "books": "Supplies", "paper": "Supplies", "ink": "Supplies",
    "fuel": "Transport", "diesel": "Transport", "bus": "Transport", "petrol": "Transport",
    "function": "Events", "annual day": "Events", "sports day": "Events",
  };
  if (category === "Other") {
    for (const [k, v] of Object.entries(syn)) {
      if (t.includes(k)) { category = v; break; }
    }
  }

  // description: text after "for" or full text minus the amount
  let description = "";
  const forIdx = t.indexOf(" for ");
  const onIdx = t.indexOf(" on ");
  const cutIdx = forIdx !== -1 ? forIdx + 5 : onIdx !== -1 ? onIdx + 4 : -1;
  if (cutIdx !== -1) description = text.slice(cutIdx).trim();
  if (!description) description = `${category} expense`;

  return { amount, category, description };
}

function ExpenseChatBot({ onClose }: { onClose: () => void }) {
  const { update, currentUser } = useStore();
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { id: "m0", from: "bot", text: "Hi! Tell me what to add. Try: \"add 550 for utilities\" or \"spent 2300 on supplies\"." },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  function send() {
    const text = input.trim();
    if (!text) return;
    const userMsg: ChatMsg = { id: `m_${Date.now()}`, from: "user", text };
    setInput("");

    const parsed = parseExpense(text);
    let botText: string;
    if (!parsed) {
      botText = "I couldn't find an amount. Try: \"add 500 for electricity\".";
    } else {
      update(
        (s) => ({
          ...s,
          expenses: [
            {
              id: `exp_${Date.now()}`,
              date: new Date().toISOString().split("T")[0],
              category: parsed.category,
              description: parsed.description,
              amount: parsed.amount,
              addedBy: currentUser?.name ?? "Admin (chat)",
            },
            ...s.expenses,
          ],
        }),
        { action: "added expense via chat", entity: parsed.description },
      );
      botText = `✓ Added ₹${parsed.amount.toLocaleString()} under ${parsed.category} — "${parsed.description}". Anything else?`;
    }

    setMsgs((m) => [...m, userMsg, { id: `b_${Date.now()}`, from: "bot", text: botText }]);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  return (
    <Modal open onClose={onClose} title="Expense Chatbot" subtitle="Plain English → expense entry" maxWidth="max-w-md">
      <div className="flex h-[400px] flex-col">
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {msgs.map((m) => (
            <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg px-3 py-1.5 text-sm ${m.from === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                {m.text}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="mt-3 flex gap-2 border-t border-border pt-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(); } }}
            placeholder="add 550 for utilities…"
            className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            autoFocus
          />
          <button onClick={send} className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
            <Send className="h-3.5 w-3.5" /> Send
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ============ Payroll panel ============ */

function PayrollPanel() {
  const { state, update } = useStore();
  const months = useMemo(
    () => Array.from(new Set(state.salaries.map((s) => s.month))).sort().reverse(),
    [state.salaries],
  );
  const [month, setMonth] = useState(months[0] ?? "");
  const [editing, setEditing] = useState<string | null>(null);

  const monthSalaries = state.salaries.filter((s) => s.month === month);
  const totalNet = monthSalaries.reduce((s, x) => s + x.net, 0);
  const totalGross = monthSalaries.reduce((s, x) => s + (x.basic + x.allowances - x.deductions), 0);
  const totalTax = totalGross - totalNet;
  const paidCount = monthSalaries.filter((s) => s.status === "paid").length;

  function markPaid(id: string) {
    update((s) => ({
      ...s,
      salaries: s.salaries.map((sal) => sal.id === id ? { ...sal, status: "paid", paidOn: new Date().toISOString().split("T")[0] } : sal),
      // also create matching expense entry
      expenses: [
        {
          id: `exp_sal_${id}`,
          date: new Date().toISOString().split("T")[0],
          category: "Salaries",
          description: `Salary payout · ${state.teachers.find((t) => t.id === s.salaries.find((x) => x.id === id)?.teacherId)?.name ?? "Teacher"} · ${month}`,
          amount: s.salaries.find((x) => x.id === id)?.net ?? 0,
          addedBy: "Payroll",
        },
        ...s.expenses,
      ],
    }), { action: "paid salary", entity: id });
    toast.success("Marked paid · expense logged");
  }

  function generateNextMonth() {
    const d = new Date();
    const monthStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    if (state.salaries.some((s) => s.month === monthStr)) {
      toast.error("Salaries for this month already generated");
      return;
    }
    update((s) => ({
      ...s,
      salaries: [
        ...s.salaries,
        ...s.teachers.map((t, i) => {
          const basic = 35000 + i * 1500;
          const allowances = 5000;
          const deductions = 1000;
          const taxRate = 10;
          const gross = basic + allowances - deductions;
          const net = Math.round(gross * (1 - taxRate / 100));
          return { id: `sal_${t.id}_${monthStr}`, teacherId: t.id, month: monthStr, basic, allowances, deductions, taxRate, net, status: "pending" as const };
        }),
      ],
    }), { action: "generated payroll", entity: monthStr });
    setMonth(monthStr);
    toast.success(`Payroll generated for ${monthStr}`);
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Month" value={month || "—"} />
        <Stat label="Gross payroll" value={`₹${totalGross.toLocaleString()}`} />
        <Stat label="Tax withheld" value={`₹${totalTax.toLocaleString()}`} tone="warning" />
        <Stat label="Net paid" value={`₹${totalNet.toLocaleString()}`} tone="success" hint={`${paidCount}/${monthSalaries.length} paid`} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1.5 text-sm">
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <button onClick={generateNextMonth} className="ml-auto flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
          <Wallet className="h-3.5 w-3.5" /> Generate current month
        </button>
      </div>

      <Section title={`Staff Payroll · ${month}`}>
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr><th>Teacher</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Tax %</th><th>Net</th><th>Status</th><th>Paid On</th><th></th></tr>
            </thead>
            <tbody>
              {monthSalaries.map((s) => {
                const t = state.teachers.find((x) => x.id === s.teacherId);
                return (
                  <tr key={s.id}>
                    <td className="font-medium">{t?.name ?? "—"}</td>
                    <td className="tabular-nums">₹{s.basic.toLocaleString()}</td>
                    <td className="tabular-nums">₹{s.allowances.toLocaleString()}</td>
                    <td className="tabular-nums">₹{s.deductions.toLocaleString()}</td>
                    <td className="tabular-nums">{s.taxRate}%</td>
                    <td className="tabular-nums font-semibold">₹{s.net.toLocaleString()}</td>
                    <td>{s.status === "paid" ? <Badge tone="success">paid</Badge> : <Badge tone="warning">pending</Badge>}</td>
                    <td className="text-xs text-muted-foreground">{s.paidOn ?? "—"}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => setEditing(s.id)} className="rounded border border-border px-2 py-0.5 text-[11px] hover:bg-muted">Edit</button>
                        {s.status === "pending" && (
                          <button onClick={() => markPaid(s.id)} className="rounded bg-success px-2 py-0.5 text-[11px] font-medium text-success-foreground hover:bg-success/90">Pay</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {editing && <EditSalaryModal salaryId={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function EditSalaryModal({ salaryId, onClose }: { salaryId: string; onClose: () => void }) {
  const { state, update } = useStore();
  const sal = state.salaries.find((s) => s.id === salaryId)!;
  const [basic, setBasic] = useState(sal.basic);
  const [allowances, setAllowances] = useState(sal.allowances);
  const [deductions, setDeductions] = useState(sal.deductions);
  const [taxRate, setTaxRate] = useState(sal.taxRate);

  const gross = basic + allowances - deductions;
  const tax = Math.round(gross * (taxRate / 100));
  const net = gross - tax;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    update((s) => ({
      ...s,
      salaries: s.salaries.map((x) => x.id === salaryId ? { ...x, basic, allowances, deductions, taxRate, net } : x),
    }), { action: "edited salary", entity: salaryId });
    toast.success("Salary updated");
    onClose();
  }

  return (
    <Modal open onClose={onClose} title="Edit salary" subtitle={`${state.teachers.find((t) => t.id === sal.teacherId)?.name} · ${sal.month}`}>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <Field label="Basic (₹)" type="number" value={String(basic)} onChange={(v) => setBasic(Number(v))} />
        <Field label="Allowances (₹)" type="number" value={String(allowances)} onChange={(v) => setAllowances(Number(v))} />
        <Field label="Deductions (₹)" type="number" value={String(deductions)} onChange={(v) => setDeductions(Number(v))} />
        <Field label="Tax rate (%)" type="number" value={String(taxRate)} onChange={(v) => setTaxRate(Number(v))} />
        <div className="col-span-2 rounded-md border border-border bg-muted p-3 text-xs">
          <div className="flex justify-between"><span>Gross</span><span className="tabular-nums">₹{gross.toLocaleString()}</span></div>
          <div className="flex justify-between text-warning"><span>Tax ({taxRate}%)</span><span className="tabular-nums">−₹{tax.toLocaleString()}</span></div>
          <div className="mt-1 flex justify-between border-t border-border pt-1 font-semibold"><span>Net</span><span className="tabular-nums">₹{net.toLocaleString()}</span></div>
        </div>
        <FormActions onCancel={onClose} submitLabel="Save" />
      </form>
    </Modal>
  );
}