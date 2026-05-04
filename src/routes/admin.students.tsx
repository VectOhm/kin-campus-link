import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/erp/store/store";
import { PageHeader, Badge, EmptyState } from "@/erp/components/Shell";
import { Plus, Trash2, Search, Users, LayoutGrid, List, Upload } from "lucide-react";
import { toast } from "sonner";

export function Avatar({
  src,
  name,
  size = 40,
}: {
  src?: string;
  name: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="inline-flex items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-[10px] font-semibold text-muted-foreground"
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.32) }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        initials
      )}
    </div>
  );
}

export const Route = createFileRoute("/admin/students")({
  component: StudentsPage,
});

function StudentsPage() {
  const { state, update } = useStore();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"table" | "cards">("cards");
  const [q, setQ] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [busFilter, setBusFilter] = useState<string>("all");
  const [feeFilter, setFeeFilter] = useState<"all" | "paid" | "pending">("all");
  const [gender, setGender] = useState<"all" | "male" | "female">("all");
  const [admittedFrom, setAdmittedFrom] = useState("");
  const [admittedTo, setAdmittedTo] = useState("");

  const filtered = state.students.filter((s) => {
    const matchClass = classFilter === "all" || s.classId === classFilter;
    const matchQ =
      !q ||
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(q.toLowerCase()) ||
      s.parentName.toLowerCase().includes(q.toLowerCase());
    const matchBus =
      busFilter === "all" || (busFilter === "none" ? !s.busRouteId : s.busRouteId === busFilter);
    const matchFee =
      feeFilter === "all" ||
      (feeFilter === "pending"
        ? state.feePayments.some((p) => p.studentId === s.id && p.status === "pending")
        : state.feePayments.filter((p) => p.studentId === s.id).every((p) => p.status === "paid"));
    // Gender heuristic from first name list (simple check)
    const isFemale = s.gender === "female";
    const matchGender = gender === "all" || (gender === "female" ? isFemale : !isFemale);
    const matchAdmFrom = !admittedFrom || s.admissionDate >= admittedFrom;
    const matchAdmTo = !admittedTo || s.admissionDate <= admittedTo;
    return (
      matchClass && matchQ && matchBus && matchFee && matchGender && matchAdmFrom && matchAdmTo
    );
  });

  function remove(id: string) {
    if (!confirm("Remove this student?")) return;
    update(
      (s) => ({
        ...s,
        students: s.students.filter((x) => x.id !== id),
        users: s.users.filter((u) => u.studentId !== id),
        feePayments: s.feePayments.filter((f) => f.studentId !== id),
        marks: s.marks.filter((m) => m.studentId !== id),
        attendance: s.attendance.filter((a) => a.studentId !== id),
      }),
      { action: "removed student", entity: id },
    );
    toast.success("Student removed");
  }

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle={`${state.students.length} enrolled`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-border bg-card p-0.5">
              <button
                onClick={() => setView("cards")}
                className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] ${view === "cards" ? "bg-muted" : ""}`}
                title="Card view"
              >
                <LayoutGrid className="h-3 w-3" /> Cards
              </button>
              <button
                onClick={() => setView("table")}
                className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] ${view === "table" ? "bg-muted" : ""}`}
                title="Table view"
              >
                <List className="h-3 w-3" /> Table
              </button>
            </div>
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" /> Add student
            </button>
          </div>
        }
      />
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              placeholder="Search name, roll no, parent..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-3 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All classes</option>
            {state.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={busFilter}
            onChange={(e) => setBusFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          >
            <option value="all">Any transport</option>
            <option value="none">No bus</option>
            {state.busRoutes.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <select
            value={feeFilter}
            onChange={(e) => setFeeFilter(e.target.value as typeof feeFilter)}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          >
            <option value="all">Any fee status</option>
            <option value="paid">All cleared</option>
            <option value="pending">Has pending</option>
          </select>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as typeof gender)}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          >
            <option value="all">Any gender</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
          <input
            type="date"
            value={admittedFrom}
            onChange={(e) => setAdmittedFrom(e.target.value)}
            title="Admitted from"
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
          <input
            type="date"
            value={admittedTo}
            onChange={(e) => setAdmittedTo(e.target.value)}
            title="Admitted to"
            className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
          <button
            onClick={() => {
              setQ("");
              setClassFilter("all");
              setBusFilter("all");
              setFeeFilter("all");
              setGender("all");
              setAdmittedFrom("");
              setAdmittedTo("");
            }}
            className="rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
          >
            Clear
          </button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState message="No students match your filters." icon={Users} />
        ) : view === "table" ? (
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Roll</th>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Parent</th>
                  <th>Phone</th>
                  <th>Bus</th>
                  <th>Admission</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const cls = state.classes.find((c) => c.id === s.classId);
                  const route = state.busRoutes.find((b) => b.id === s.busRouteId);
                  return (
                    <tr key={s.id}>
                      <td>
                        <Avatar src={s.photoUrl} name={s.name} size={32} />
                      </td>
                      <td className="font-mono text-xs">{s.rollNo}</td>
                      <td className="font-medium">{s.name}</td>
                      <td>{cls?.name}</td>
                      <td>{s.parentName}</td>
                      <td className="font-mono text-xs">{s.parentPhone}</td>
                      <td>
                        {route ? (
                          <Badge tone="info">{route.name.split("—")[0]}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="text-xs text-muted-foreground">{s.admissionDate}</td>
                      <td>
                        <button
                          onClick={() => remove(s.id)}
                          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((s) => {
              const cls = state.classes.find((c) => c.id === s.classId);
              const route = state.busRoutes.find((b) => b.id === s.busRouteId);
              const pendingFees = state.feePayments.filter(
                (f) => f.studentId === s.id && f.status === "pending",
              ).length;
              return (
                <div
                  key={s.id}
                  className="group relative rounded-lg border border-border bg-card p-3 hover:border-accent transition-colors"
                >
                  <button
                    onClick={() => remove(s.id)}
                    className="absolute right-2 top-2 rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <div className="flex flex-col items-center text-center">
                    <Avatar src={s.photoUrl} name={s.name} size={64} />
                    <div className="mt-2 text-sm font-semibold leading-tight">{s.name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {s.rollNo} · {cls?.name}
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Parent</span>
                      <span className="truncate font-medium">{s.parentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-mono">{s.parentPhone.slice(-10)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bus</span>
                      <span>{route ? route.name.split("—")[0] : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fees</span>
                      {pendingFees ? (
                        <Badge tone="warning">{pendingFees} pending</Badge>
                      ) : (
                        <Badge tone="success">cleared</Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {open && <AddStudentModal onClose={() => setOpen(false)} />}
    </div>
  );
}

function AddStudentModal({ onClose }: { onClose: () => void }) {
  const { state, update } = useStore();
  const [form, setForm] = useState({
    name: "",
    rollNo: "",
    classId: state.classes[0]?.id ?? "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    dob: "",
    address: "",
    busRouteId: "",
    photoUrl: "",
    gender: "male" as "male" | "female",
  });

  type FormType = typeof form;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.parentName || !form.parentEmail) {
      toast.error("Fill name, parent name and email");
      return;
    }
    const id = `std_${Date.now()}`;
    const cls = state.classes.find((c) => c.id === form.classId)!;
    const fs = state.feeStructures.find((f) => f.grade === cls.grade)!;
    const yr = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    const seed = encodeURIComponent(form.name + id);
    const fallbackPhoto = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    update(
      (s) => ({
        ...s,
        students: [
          ...s.students,
          {
            id,
            rollNo:
              form.rollNo ||
              `${cls.grade}${(s.students.filter((x) => x.classId === cls.id).length + 1).toString().padStart(2, "0")}`,
            name: form.name,
            classId: form.classId,
            parentName: form.parentName,
            parentPhone: form.parentPhone,
            parentEmail: form.parentEmail,
            dob: form.dob,
            address: form.address,
            admissionDate: new Date().toISOString().split("T")[0],
            busRouteId: form.busRouteId || undefined,
            photoUrl: form.photoUrl || fallbackPhoto,
            gender: form.gender,
            documents: [],
          },
        ],
        users: [
          ...s.users,
          {
            id: `u_p_${id}`,
            email: form.parentEmail,
            password: "parent",
            role: "parent",
            name: form.parentName,
            studentId: id,
          },
        ],
        feePayments: [
          ...s.feePayments,
          {
            id: `fp_${id}_adm`,
            studentId: id,
            type: "admission",
            amount: fs.admissionFee,
            status: "pending",
            dueDate: new Date().toISOString().split("T")[0],
            academicYear: yr,
          },
          ...(["Q1", "Q2", "Q3", "Q4"] as const).map((q, qi) => ({
            id: `fp_${id}_${q}`,
            studentId: id,
            type: q,
            amount: fs.quarterlyFee,
            status: "pending" as const,
            dueDate: new Date(new Date().setMonth(new Date().getMonth() + qi * 3))
              .toISOString()
              .split("T")[0],
            academicYear: yr,
          })),
        ],
      }),
      { action: "added student", entity: form.name },
    );
    toast.success(`${form.name} admitted to ${cls.name}`);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-border bg-card shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold">New admission</h3>
          <p className="text-xs text-muted-foreground">
            Creates student, parent login and fee schedule
          </p>
        </div>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3 p-5">
          {[
            ["Student name", "name", "text"],
            ["Roll no (optional)", "rollNo", "text"],
            ["Parent name", "parentName", "text"],
            ["Parent phone", "parentPhone", "tel"],
            ["Parent email", "parentEmail", "email"],
            ["DOB", "dob", "date"],
          ].map(([label, key, type]) => (
            <Field
              key={key}
              label={label}
              type={type}
              value={(form as unknown as Record<string, string>)[key]}
              onChange={(v) => setForm({ ...form, [key]: v })}
            />
          ))}
          <SelectField
            label="Gender"
            value={form.gender}
            onChange={(v) => setForm({ ...form, gender: v as "male" | "female" })}
            options={[
              ["male", "Male"],
              ["female", "Female"],
            ]}
          />
          <SelectField
            label="Class"
            value={form.classId}
            onChange={(v) => setForm({ ...form, classId: v })}
            options={state.classes.map((c) => [c.id, c.name])}
          />
          <SelectField
            label="Bus Route"
            value={form.busRouteId}
            onChange={(v) => setForm({ ...form, busRouteId: v })}
            options={[
              ["", "None"],
              ...state.busRoutes.map((b) => [b.id, b.name] as [string, string]),
            ]}
          />
          <div className="col-span-2">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Photo
            </label>
            <div className="mt-1 flex items-center gap-3">
              <Avatar src={form.photoUrl} name={form.name || "?"} size={56} />
              <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted">
                <Upload className="h-3 w-3" /> Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () =>
                      setForm((f) => ({ ...f, photoUrl: reader.result as string }));
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              <span className="text-[10px] text-muted-foreground">
                Leave blank for auto-generated avatar
              </span>
            </div>
          </div>
          <div className="col-span-2">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Address
            </label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-xs hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Admit student
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Field({
  label,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div>
      <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
