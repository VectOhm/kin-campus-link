import { useState } from "react";
import { useStore } from "../store/store";
import { PageHeader, Section, Badge, EmptyState } from "./Shell";
import { Field, SelectField, TextareaField, Modal, FormActions } from "./Form";
import { Plus, Bell } from "lucide-react";
import { toast } from "sonner";
import type { Notification, Role } from "../types";

type Audience = Notification["audience"];

interface Props {
  audienceOptions: Audience[];
  /** filter visible notifications for current user */
  forUserId?: string;
  /** which classes the sender can target (teachers only) */
  allowedClassIds?: string[];
  /** which students the sender can target (teachers only) */
  allowedStudentIds?: string[];
  senderRole: Role;
  title: string;
  /** if true, current user can only receive — no compose button */
  receiveOnly?: boolean;
}

export function NotificationsView({
  audienceOptions,
  forUserId,
  allowedClassIds,
  allowedStudentIds,
  senderRole,
  title,
  receiveOnly,
}: Props) {
  const { state, update, currentUser } = useStore();
  const [open, setOpen] = useState(false);

  const visible = state.notifications.filter((n) => {
    if (!forUserId) return true; // admin sees all
    if (n.audience === "school") return true;
    const u = currentUser;
    if (!u) return false;
    if (u.role === "parent" && u.studentId) {
      const st = state.students.find((s) => s.id === u.studentId);
      if (n.audience === "class" && st && n.classId === st.classId) return true;
      if (n.audience === "student" && n.studentId === u.studentId) return true;
    }
    if (u.role === "teacher" && u.teacherId) {
      const t = state.teachers.find((x) => x.id === u.teacherId);
      if (n.audience === "class" && t && n.classId && t.classes.includes(n.classId)) return true;
      if (n.audience === "teachers") return true;
      if (n.audience === "teacher" && n.teacherId === u.teacherId) return true;
    }
    return false;
  });

  function markAllRead() {
    if (!forUserId) return;
    update((s) => ({
      ...s,
      notifications: s.notifications.map((n) =>
        visible.some((v) => v.id === n.id) && !n.readBy.includes(forUserId)
          ? { ...n, readBy: [...n.readBy, forUserId] }
          : n,
      ),
    }));
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={`${visible.length} notifications`}
        actions={
          <div className="flex gap-2">
            {forUserId && (
              <button
                onClick={markAllRead}
                className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
              >
                Mark all read
              </button>
            )}
            {!receiveOnly && (
              <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5" /> Send notification
              </button>
            )}
          </div>
        }
      />
      <div className="p-6">
        {visible.length === 0 ? (
          <EmptyState message="No notifications" icon={Bell} />
        ) : (
          <div className="space-y-2">
            {visible.map((n) => {
              const isUnread = forUserId ? !n.readBy.includes(forUserId) : false;
              const cls = state.classes.find((c) => c.id === n.classId);
              const targetTeacher = state.teachers.find((t) => t.id === n.teacherId);
              return (
                <div
                  key={n.id}
                  className={`rounded-md border bg-card p-3 ${isUnread ? "border-accent" : "border-border"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        tone={
                          n.audience === "school"
                            ? "info"
                            : n.audience === "class"
                              ? "warning"
                              : "muted"
                        }
                      >
                        {n.audience}
                      </Badge>
                      {cls && <span className="text-[11px] text-muted-foreground">{cls.name}</span>}
                      {targetTeacher && (
                        <span className="text-[11px] text-muted-foreground">
                          → {targetTeacher.name}
                        </span>
                      )}
                      <span className="text-sm font-medium">{n.title}</span>
                      {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{n.message}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {open && (
        <SendModal
          onClose={() => setOpen(false)}
          audienceOptions={audienceOptions}
          allowedClassIds={allowedClassIds}
          allowedStudentIds={allowedStudentIds}
          senderRole={senderRole}
        />
      )}
    </div>
  );
}

function SendModal({
  onClose,
  audienceOptions,
  allowedClassIds,
  allowedStudentIds,
  senderRole,
}: {
  onClose: () => void;
  audienceOptions: Audience[];
  allowedClassIds?: string[];
  allowedStudentIds?: string[];
  senderRole: Role;
}) {
  const { state, update, currentUser } = useStore();
  const [audience, setAudience] = useState<Audience>(audienceOptions[0]);
  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const classes = allowedClassIds
    ? state.classes.filter((c) => allowedClassIds.includes(c.id))
    : state.classes;
  const students = allowedStudentIds
    ? state.students.filter((s) => allowedStudentIds.includes(s.id))
    : state.students;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !message) {
      toast.error("Title and message required");
      return;
    }
    if (audience === "class" && !classId) {
      toast.error("Pick a class");
      return;
    }
    if (audience === "student" && !studentId) {
      toast.error("Pick a student");
      return;
    }
    if (audience === "teacher" && !teacherId) {
      toast.error("Pick a teacher");
      return;
    }
    update(
      (s) => ({
        ...s,
        notifications: [
          {
            id: `nf_${Date.now()}`,
            title,
            message,
            audience,
            classId: audience === "class" ? classId : undefined,
            studentId: audience === "student" ? studentId : undefined,
            teacherId: audience === "teacher" ? teacherId : undefined,
            senderId: currentUser?.id ?? "u_admin",
            senderRole,
            createdAt: new Date().toISOString(),
            readBy: [],
          },
          ...s.notifications,
        ],
      }),
      { action: "sent notification", entity: title },
    );
    toast.success("Notification sent");
    onClose();
  }

  const audienceLabel: Record<Audience, string> = {
    school: "Whole school",
    class: "Specific class",
    student: "Individual student",
    teachers: "All teachers",
    teacher: "Individual teacher",
  };

  return (
    <Modal open onClose={onClose} title="Send notification">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <SelectField
          label="Audience"
          value={audience}
          onChange={(v) => setAudience(v as Audience)}
          options={audienceOptions.map((a) => [a, audienceLabel[a]])}
        />
        {audience === "class" && (
          <SelectField
            label="Class"
            value={classId}
            onChange={setClassId}
            options={[
              ["", "Select class"],
              ...classes.map((c) => [c.id, c.name] as [string, string]),
            ]}
          />
        )}
        {audience === "student" && (
          <SelectField
            label="Student"
            value={studentId}
            onChange={setStudentId}
            options={[
              ["", "Select student"],
              ...students.map((s) => [s.id, s.name] as [string, string]),
            ]}
          />
        )}
        {audience === "teacher" && (
          <SelectField
            label="Teacher"
            value={teacherId}
            onChange={setTeacherId}
            options={[
              ["", "Select teacher"],
              ...state.teachers.map((t) => [t.id, t.name] as [string, string]),
            ]}
          />
        )}
        <div className="col-span-2">
          <Field label="Title" value={title} onChange={setTitle} />
        </div>
        <div className="col-span-2">
          <TextareaField label="Message" value={message} onChange={setMessage} rows={4} />
        </div>
        <FormActions onCancel={onClose} submitLabel="Send" />
      </form>
    </Modal>
  );
}
