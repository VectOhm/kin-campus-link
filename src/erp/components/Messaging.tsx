import { useState } from "react";
import { useStore } from "../store/store";
import { PageHeader, EmptyState } from "./Shell";
import { MessageSquare, Send } from "lucide-react";

export function Messaging({ contacts }: { contacts: { id: string; name: string; meta?: string }[] }) {
  const { state, update, currentUser } = useStore();
  const [activeId, setActiveId] = useState(contacts[0]?.id ?? "");

  const thread = state.messages.filter(
    (m) => (m.fromId === currentUser?.id && m.toId === activeId) || (m.fromId === activeId && m.toId === currentUser?.id),
  ).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const [draft, setDraft] = useState("");
  function send() {
    if (!draft.trim() || !activeId || !currentUser) return;
    const to = contacts.find((c) => c.id === activeId);
    update((s) => ({ ...s, messages: [...s.messages, { id: `msg_${Date.now()}`, fromId: currentUser.id, toId: activeId, fromName: currentUser.name, toName: to?.name ?? "", body: draft, createdAt: new Date().toISOString(), read: false }] }));
    setDraft("");
  }

  return (
    <div>
      <PageHeader title="Messages" />
      <div className="grid gap-3 p-6 md:grid-cols-[240px_1fr]">
        <div className="rounded-md border border-border bg-card">
          <div className="border-b border-border px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Contacts</div>
          {contacts.length === 0 ? <EmptyState message="No contacts" icon={MessageSquare} /> : (
            <ul>
              {contacts.map((c) => (
                <li key={c.id}>
                  <button onClick={() => setActiveId(c.id)} className={`w-full px-3 py-2 text-left text-sm hover:bg-muted ${activeId === c.id ? "bg-muted" : ""}`}>
                    <div className="font-medium">{c.name}</div>
                    {c.meta && <div className="text-[10px] text-muted-foreground">{c.meta}</div>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex h-[60vh] flex-col rounded-md border border-border bg-card">
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {thread.length === 0 ? <p className="text-center text-xs text-muted-foreground">No messages yet</p> : thread.map((m) => (
              <div key={m.id} className={`flex ${m.fromId === currentUser?.id ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-md px-3 py-2 text-xs ${m.fromId === currentUser?.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <div>{m.body}</div>
                  <div className={`mt-1 text-[10px] ${m.fromId === currentUser?.id ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{new Date(m.createdAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border p-2 flex gap-2">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a message..." className="flex-1 rounded border border-input bg-background px-2 py-1.5 text-sm" />
            <button onClick={send} className="flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"><Send className="h-3 w-3" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
