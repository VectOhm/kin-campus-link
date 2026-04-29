import * as React from "react";
import type { ERPState, User, ActivityLog, Role } from "../types";
import { buildSeed } from "./seed";

const STORAGE_KEY = "erp_state_v2";
const SESSION_KEY = "erp_session_v1";

type Updater = (s: ERPState) => ERPState;

interface StoreContext {
  state: ERPState;
  update: (fn: Updater, log?: { action: string; entity: string }) => void;
  reset: () => void;
  currentUser: User | null;
  login: (email: string, password: string) => User | null;
  logout: () => void;
  unreadNotifications: (userId: string) => number;
}

const Ctx = React.createContext<StoreContext | null>(null);

function loadState(): ERPState {
  if (typeof window === "undefined") return buildSeed();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const fresh = buildSeed();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  return fresh;
}

function loadSession(state: ERPState): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const id = JSON.parse(raw) as string;
    return state.users.find((u) => u.id === id) ?? null;
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ERPState>(() => buildSeed());
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const s = loadState();
    setState(s);
    setCurrentUser(loadSession(s));
    setHydrated(true);
  }, []);

  const persist = React.useCallback((s: ERPState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {}
  }, []);

  const update = React.useCallback<StoreContext["update"]>(
    (fn, log) => {
      setState((prev) => {
        let next = fn(prev);
        if (log && currentUser) {
          const entry: ActivityLog = {
            id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            userId: currentUser.id,
            userName: currentUser.name,
            role: currentUser.role,
            action: log.action,
            entity: log.entity,
            timestamp: new Date().toISOString(),
          };
          next = { ...next, activityLogs: [entry, ...next.activityLogs].slice(0, 500) };
        }
        persist(next);
        return next;
      });
    },
    [currentUser, persist],
  );

  const login = React.useCallback<StoreContext["login"]>(
    (email, password) => {
      const u = state.users.find(
        (x) => x.email.toLowerCase() === email.toLowerCase() && x.password === password,
      );
      if (u) {
        setCurrentUser(u);
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify(u.id));
        } catch {}
      }
      return u ?? null;
    },
    [state.users],
  );

  const logout = React.useCallback(() => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {}
  }, []);

  const reset = React.useCallback(() => {
    const fresh = buildSeed();
    setState(fresh);
    persist(fresh);
  }, [persist]);

  const unreadNotifications = React.useCallback(
    (userId: string) => {
      const u = state.users.find((x) => x.id === userId);
      if (!u) return 0;
      return state.notifications.filter((n) => {
        if (n.readBy.includes(userId)) return false;
        if (n.audience === "school") return true;
        if (u.role === "parent" && u.studentId) {
          const st = state.students.find((s) => s.id === u.studentId);
          if (n.audience === "class" && st && n.classId === st.classId) return true;
          if (n.audience === "student" && n.studentId === u.studentId) return true;
        }
        if (u.role === "teacher" && u.teacherId) {
          const t = state.teachers.find((x) => x.id === u.teacherId);
          if (n.audience === "class" && t && n.classId && t.classes.includes(n.classId)) return true;
        }
        if (u.role === "admin") return true;
        return false;
      }).length;
    },
    [state],
  );

  const value = React.useMemo<StoreContext>(
    () => ({ state, update, reset, currentUser, login, logout, unreadNotifications }),
    [state, update, reset, currentUser, login, logout, unreadNotifications],
  );

  // avoid SSR/CSR mismatch by deferring children until hydrated
  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = React.useContext(Ctx);
  if (!c) throw new Error("useStore must be used inside StoreProvider");
  return c;
}

export function useRequireRole(roles: Role[]): User {
  const { currentUser } = useStore();
  if (!currentUser || !roles.includes(currentUser.role)) {
    throw new Error("Unauthorized");
  }
  return currentUser;
}
