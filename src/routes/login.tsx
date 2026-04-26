import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/erp/store/store";
import { School, GraduationCap, User as UserIcon, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const demos = [
  { role: "admin", email: "admin@school.edu", password: "admin", icon: ShieldCheck, label: "Admin", desc: "Full system access" },
  { role: "teacher", email: "teacher@school.edu", password: "teacher", icon: GraduationCap, label: "Teacher", desc: "Aarti Sharma — English/Hindi" },
  { role: "parent", email: "parent@school.edu", password: "parent", icon: UserIcon, label: "Parent", desc: "Linked to first student" },
];

function LoginPage() {
  const { login, currentUser } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@school.edu");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState("");

  if (currentUser) {
    setTimeout(() => navigate({ to: `/${currentUser.role}` as "/admin" }), 0);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const u = login(email, password);
    if (!u) {
      setError("Invalid email or password");
      return;
    }
    navigate({ to: `/${u.role}` as "/admin" });
  }

  function quick(d: (typeof demos)[number]) {
    setEmail(d.email);
    setPassword(d.password);
    const u = login(d.email, d.password);
    if (u) navigate({ to: `/${u.role}` as "/admin" });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: brand panel */}
      <div className="relative hidden flex-col justify-between bg-primary px-10 py-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <School className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Brightwood K-10</span>
        </div>
        <div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            One platform for the whole school.
          </h1>
          <p className="mt-3 max-w-md text-sm text-primary-foreground/70">
            Admissions, fees, homework, results, attendance, transport and notifications — for admins, teachers, students and parents.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 text-[11px]">
            {[
              ["10", "Classes"],
              ["40", "Students"],
              ["10", "Teachers"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-md border border-primary-foreground/10 p-3">
                <div className="text-xl font-semibold">{v}</div>
                <div className="text-primary-foreground/60">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-[11px] text-primary-foreground/50">
          Prototype build · Data persists in your browser only
        </div>
      </div>

      {/* Right: form */}
      <div className="flex flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <School className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">Brightwood K-10</span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">Use a demo account or your credentials.</p>

          <form onSubmit={submit} className="mt-6 space-y-3">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Sign in
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> One-click demo <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid gap-2">
            {demos.map((d) => {
              const Icon = d.icon;
              return (
                <button
                  key={d.role}
                  onClick={() => quick(d)}
                  className="group flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5 text-left hover:border-accent hover:bg-muted"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-accent-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{d.label}</div>
                    <div className="text-[11px] text-muted-foreground">{d.desc}</div>
                  </div>
                  <span className="kbd">enter</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
