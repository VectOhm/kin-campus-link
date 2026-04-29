import { useState, useRef, useEffect } from "react";
import { Send, Bot, User as UserIcon } from "lucide-react";

export interface ChatMessage {
  role: "user" | "bot";
  text: string;
  ts: number;
}

export interface ChatBotProps {
  title: string;
  placeholder: string;
  hints: string[];
  /** Process user input. Return bot reply text. Return string starting with "✗" or "Error" to indicate failure. */
  onSubmit: (input: string) => string | Promise<string>;
}

export function ChatBot({ title, placeholder, hints, onSubmit }: ChatBotProps) {
  const [history, setHistory] = useState<ChatMessage[]>([
    { role: "bot", text: `Hi! I'm your ${title.toLowerCase()} assistant. ${hints[0] ?? ""}`, ts: Date.now() },
  ]);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history]);

  async function send() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    setHistory((h) => [...h, { role: "user", text, ts: Date.now() }]);
    const reply = await onSubmit(text);
    setHistory((h) => [...h, { role: "bot", text: reply, ts: Date.now() }]);
  }

  return (
    <div className="flex h-[420px] flex-col rounded-md border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Bot className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
        {history.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "bot" && <Bot className="mt-1 h-3.5 w-3.5 shrink-0 text-accent" />}
            <div className={`max-w-[80%] whitespace-pre-line rounded-md px-3 py-2 text-xs ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {m.text}
            </div>
            {m.role === "user" && <UserIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          </div>
        ))}
      </div>
      {hints.length > 0 && (
        <div className="flex flex-wrap gap-1 border-t border-border px-3 py-1.5">
          {hints.map((h, i) => (
            <button
              key={i}
              onClick={() => setDraft(h)}
              className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
            >
              {h}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2 border-t border-border p-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={placeholder}
          className="flex-1 rounded border border-input bg-background px-2 py-1.5 text-sm"
        />
        <button onClick={send} className="flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
          <Send className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}