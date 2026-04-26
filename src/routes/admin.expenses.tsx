import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section, Stat, Badge } from "@/erp/components/Shell";
import { Field, SelectField, Modal, FormActions } from "@/erp/components/Form";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/expenses")({
  component: ExpensesPage,
});

const CATS = ["Salaries", "Utilities", "Maintenance", "Supplies", "Transport", "Events", "Other"];

function ExpensesPage() {
  const { state, update } = useStore();
  const [open, setOpen] = useState(false);

  const total = state.expenses.reduce((s, e) => s + e.amount, 0);
  const today = new Date().toISOString().split("T")[0];
  const todayTotal = state.expenses.filter((e) => e.date === today).reduce((s, e) => s + e.amount, 0);
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthTotal = state.expenses.filter((e) => new Date(e.date) >= monthStart).reduce((s, e) => s + e.amount, 0);

  const byCategory = CATS.map((c) => ({
    cat: c,
    total: state.expenses.filter((e) => e.category === c).reduce((s, e) => s + e.amount, 0),
  })).filter((x) => x.total > 0);

  function remove(id: string) {
    update((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) }), { action: "removed expense", entity: id });
  }

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle="Daily expense tracking and summaries"
        actions={
          <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" /> Add expense
          </button>
        }
      />
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Today" value={`₹${todayTotal.toLocaleString()}`} />
          <Stat label="This Month" value={`₹${monthTotal.toLocaleString()}`} tone="warning" />
          <Stat label="All-time" value={`₹${total.toLocaleString()}`} tone="danger" />
          <Stat label="Entries" value={state.expenses.length} />
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Section title="Recent Expenses">
              <div className="overflow-x-auto">
                <table className="data-table w-full">
                  <thead>
                    <tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th></th></tr>
                  </thead>
                  <tbody>
                    {state.expenses.slice(0, 30).map((e) => (
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
      </div>

      {open && <AddExpense onClose={() => setOpen(false)} />}
    </div>
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
