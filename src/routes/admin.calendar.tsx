import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/erp/store/store";
import { PageHeader, Section, Badge } from "@/erp/components/Shell";
import { Field, SelectField, Modal, FormActions, TextareaField } from "@/erp/components/Form";
import { Plus, Trash2 } from "lucide-react";
import type { CalendarEvent } from "@/erp/types";

export const Route = createFileRoute("/admin/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  const { state, update } = useStore();
  const [open, setOpen] = useState(false);

  const sorted = [...state.calendar].sort((a, b) => a.date.localeCompare(b.date));

  function remove(id: string) {
    update((s) => ({ ...s, calendar: s.calendar.filter((c) => c.id !== id) }), { action: "removed event", entity: id });
  }

  return (
    <div>
      <PageHeader title="Academic Calendar" subtitle="Holidays, exams and events"
        actions={
          <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" /> New event
          </button>
        }
      />
      <div className="p-6">
        <Section title="All Events">
          <table className="data-table w-full">
            <thead><tr><th>Date</th><th>Type</th><th>Title</th><th>Description</th><th></th></tr></thead>
            <tbody>
              {sorted.map((e) => (
                <tr key={e.id}>
                  <td className="font-mono text-xs">{e.date}{e.endDate && ` → ${e.endDate}`}</td>
                  <td><Badge tone={e.type === "holiday" ? "info" : e.type === "exam" ? "warning" : "muted"}>{e.type}</Badge></td>
                  <td className="font-medium">{e.title}</td>
                  <td className="text-xs text-muted-foreground">{e.description}</td>
                  <td><button onClick={() => remove(e.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      </div>
      {open && <AddEvent onClose={() => setOpen(false)} />}
    </div>
  );
}

function AddEvent({ onClose }: { onClose: () => void }) {
  const { update } = useStore();
  const [form, setForm] = useState<{ title: string; type: CalendarEvent["type"]; date: string; endDate: string; description: string }>({
    title: "", type: "event", date: new Date().toISOString().split("T")[0], endDate: "", description: "",
  });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    update(
      (s) => ({ ...s, calendar: [...s.calendar, { id: `cal_${Date.now()}`, title: form.title, type: form.type, date: form.date, endDate: form.endDate || undefined, description: form.description }] }),
      { action: "added event", entity: form.title },
    );
    onClose();
  }
  return (
    <Modal open onClose={onClose} title="New event">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} /></div>
        <SelectField label="Type" value={form.type} onChange={(v) => setForm({ ...form, type: v as CalendarEvent["type"] })} options={[["event", "Event"], ["holiday", "Holiday"], ["exam", "Exam"]]} />
        <Field label="Date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
        <Field label="End date (optional)" type="date" value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} />
        <div className="col-span-2"><TextareaField label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} /></div>
        <FormActions onCancel={onClose} submitLabel="Add" />
      </form>
    </Modal>
  );
}
