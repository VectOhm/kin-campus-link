import * as React from "react";
import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useStore } from "../store/store";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Wallet,
  Receipt,
  BookOpen,
  ClipboardList,
  Bus,
  Bell,
  CalendarDays,
  BarChart3,
  Settings,
  LogOut,
  School,
  ScrollText,
  MessageSquare,
  CalendarCheck2,
  Clock3,
  FileText,
  CreditCard,
  Award,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const adminNav: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/students", label: "Students", icon: Users },
  { to: "/admin/teachers", label: "Teachers", icon: GraduationCap },
  { to: "/admin/classes", label: "Classes", icon: School },
  { to: "/admin/fees", label: "Fees", icon: Wallet },
  { to: "/admin/expenses", label: "Expenses", icon: Receipt },
  { to: "/admin/transport", label: "Transport", icon: Bus },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/admin/timetable", label: "Timetable", icon: Clock3 },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/logs", label: "Activity Logs", icon: ScrollText },
];

const teacherNav: NavItem[] = [
  { to: "/teacher", label: "Dashboard", icon: LayoutDashboard },
  { to: "/teacher/classes", label: "My Classes", icon: School },
  { to: "/teacher/homework", label: "Homework", icon: BookOpen },
  { to: "/teacher/notes", label: "Notes", icon: FileText },
  { to: "/teacher/marks", label: "Marks", icon: ClipboardList },
  { to: "/teacher/attendance", label: "Attendance", icon: CalendarCheck2 },
  { to: "/teacher/timetable", label: "Timetable", icon: Clock3 },
  { to: "/teacher/notifications", label: "Notifications", icon: Bell },
  { to: "/teacher/messages", label: "Messages", icon: MessageSquare },
];

const parentNav: NavItem[] = [
  { to: "/parent", label: "Dashboard", icon: LayoutDashboard },
  { to: "/parent/fees", label: "Fees", icon: CreditCard },
  { to: "/parent/homework", label: "Homework", icon: BookOpen },
  { to: "/parent/notes", label: "Notes & Materials", icon: FileText },
  { to: "/parent/results", label: "Results", icon: Award },
  { to: "/parent/attendance", label: "Attendance", icon: CalendarCheck2 },
  { to: "/parent/timetable", label: "Timetable", icon: Clock3 },
  { to: "/parent/transport", label: "Transport", icon: Bus },
  { to: "/parent/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/parent/notifications", label: "Notifications", icon: Bell },
  { to: "/parent/messages", label: "Messages", icon: MessageSquare },
];

export function Shell() {
  const { currentUser, logout, unreadNotifications } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!currentUser) {
      navigate({ to: "/login" });
    }
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const nav =
    currentUser.role === "admin" ? adminNav : currentUser.role === "teacher" ? teacherNav : parentNav;

  const unread = unreadNotifications(currentUser.id);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <School className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-sidebar-foreground">Brightwood K-10</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {currentUser.role}
            </span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {nav.map((item) => {
            const active =
              location.pathname === item.to ||
              (item.to !== `/${currentUser.role}` && location.pathname.startsWith(item.to));
            const Icon = item.icon;
            const showBadge = item.label === "Notifications" && unread > 0;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group mb-0.5 flex items-center justify-between rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-3.5 w-3.5 opacity-70" />
                  {item.label}
                </span>
                {showBadge && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-2">
          <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
              {currentUser.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="truncate text-xs font-medium">{currentUser.name}</div>
              <div className="truncate text-[10px] text-muted-foreground">{currentUser.email}</div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate({ to: "/login" });
              }}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-12 items-center justify-between border-b border-border bg-card px-4 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
              <School className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold">Brightwood K-10</span>
          </div>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/login" });
            }}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card md:hidden">
          {nav.slice(0, 5).map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px]",
                  active ? "text-accent" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 overflow-x-hidden pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border bg-card px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-base font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const toneCls = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
    info: "text-info",
  }[tone];
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={cn("mt-1 text-2xl font-semibold tabular-nums", toneCls)}>{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function EmptyState({ message, icon: Icon }: { message: string; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
      {Icon && <Icon className="h-6 w-6 text-muted-foreground" />}
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function Section({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
        {actions}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "info" | "muted";
}) {
  const toneCls = {
    default: "bg-secondary text-secondary-foreground",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    danger: "bg-destructive/15 text-destructive",
    info: "bg-info/15 text-info",
    muted: "bg-muted text-muted-foreground",
  }[tone];
  return (
    <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium", toneCls)}>
      {children}
    </span>
  );
}
