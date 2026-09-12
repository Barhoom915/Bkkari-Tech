"use client";

import { FormEvent, useState } from "react";

export default function AIChat({ embedded = false }: { embedded?: boolean }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([
    { role: "assistant", text: "أهلاً! أنا مساعد بكاري تيك 🤖 اسألني عن اللابتوبات، الخدمات الرقمية أو تصميم المواقع." },
  ]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages((current) => [...current, { role: "assistant", text: data.reply || "ما قدرت جاوب هلق، جرّب مرة ثانية." }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", text: "صار خطأ بسيط بالاتصال. جرّب مرة ثانية." }]);
    } finally {
      setLoading(false);
    }
  }

  if (embedded) {
    return (
      <div className="ai-chat-embedded" dir="rtl">
        <div className="ai-chat-head"><div><b>مساعد بكاري تيك</b><small>المساعد الذكي</small></div></div>
        <div className="ai-chat-messages">{messages.map((m, i) => <div key={i} className={`ai-msg ${m.role}`}>{m.text}</div>)}{loading && <div className="ai-msg assistant">عم فكّر... ✨</div>}</div>
        <form onSubmit={send} className="ai-chat-form"><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="اكتب سؤالك..."/><button type="submit" disabled={loading || !input.trim()}>➤</button></form>
      </div>
    );
  }

  return (
    <>
      {open && (
        <div className="ai-chat-panel" dir="rtl">
          <div className="ai-chat-head">
            <div><b>مساعد بكاري تيك</b><small>متصل الآن</small></div>
            <button onClick={() => setOpen(false)} aria-label="إغلاق">×</button>
          </div>
          <div className="ai-chat-messages">
            {messages.map((m, i) => <div key={i} className={`ai-msg ${m.role}`}>{m.text}</div>)}
            {loading && <div className="ai-msg assistant">عم فكّر... ✨</div>}
          </div>
          <form onSubmit={send} className="ai-chat-form">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="اكتب سؤالك..." />
            <button type="submit" disabled={loading || !input.trim()}>➤</button>
          </form>
        </div>
      )}
      <button className="ai-chat-fab" onClick={() => setOpen((v) => !v)} aria-label="محادثة مع الذكاء الاصطناعي">
        <span>✦</span><b>AI</b>
      </button>
    </>
  );
}
