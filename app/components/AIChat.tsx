"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type ChatMessage = { role: "user" | "assistant"; text: string };

const WELCOME_MESSAGE =
  "أهلاً! أنا مساعد NOVATEK 🤖 اسألني عن اللابتوبات والخدمات، أو عن البرمجة والمشاكل التقنية.";

export default function AIChat({ embedded = false }: { embedded?: boolean }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: WELCOME_MESSAGE },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, open]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const next: ChatMessage[] = [...messages, { role: "user", text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-25) }),
      });

      let data: { reply?: string } = {};
      try {
        data = await res.json();
      } catch {
        // The API may return a non-JSON error page; show a safe message below.
      }

      const reply =
        typeof data.reply === "string" && data.reply.trim()
          ? data.reply.trim()
          : !res.ok
            ? "تعذّر إكمال الطلب حالياً. جرّب بعد قليل."
            : "ما وصلني رد واضح من المساعد. جرّب صياغة السؤال بطريقة ثانية.";

      setMessages((current) => [...current, { role: "assistant", text: reply }]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "ما قدرت اتصل بالمساعد. تأكد من اتصال الإنترنت وجرّب مرة ثانية.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const chatMessages = (
    <>
      <div className="ai-chat-messages" aria-live="polite" aria-relevant="additions text">
        {messages.map((m, i) => (
          <div key={i} className={`ai-msg ${m.role}`}>{m.text}</div>
        ))}
        {loading && (
          <div className="ai-msg assistant" role="status">
            عم حضّر الجواب...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={send} className="ai-chat-form">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="اكتب سؤالك..."
          aria-label="اكتب سؤالك للمساعد الذكي"
          maxLength={4000}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} aria-label="إرسال السؤال">
          ➤
        </button>
      </form>
    </>
  );

  if (embedded) {
    return (
      <div className="ai-chat-embedded" dir="rtl">
        <div className="ai-chat-head">
          <div><b>مساعد NOVATEK</b><small>للمساعدة والبرمجة والأسئلة التقنية</small></div>
        </div>
        {chatMessages}
      </div>
    );
  }

  return (
    <>
      {open && (
        <div className="ai-chat-panel" dir="rtl">
          <div className="ai-chat-head">
            <div><b>مساعد NOVATEK</b><small>للمساعدة والبرمجة والأسئلة التقنية</small></div>
            <button onClick={() => setOpen(false)} aria-label="إغلاق المحادثة">×</button>
          </div>
          {chatMessages}
        </div>
      )}
      <button
        className="ai-chat-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "إغلاق محادثة الذكاء الاصطناعي" : "محادثة مع الذكاء الاصطناعي"}
        aria-expanded={open}
      >
        <span>🤖</span>
      </button>
    </>
  );
}
