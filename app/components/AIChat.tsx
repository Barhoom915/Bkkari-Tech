"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type ChatMessage = { role: "user" | "assistant"; text: string };

const WELCOME_MESSAGE =
  "أهلاً فيك بـ NOVATEK 👋\nأنا هون ساعدك تختار الجهاز أو الخدمة المناسبة إلك. اختار سؤال جاهز أو اكتبلي شو محتاج.";

const SUGGESTED_QUESTIONS = [
  { label: "💻 لابتوب حسب ميزانيتي", question: "ساعدني اختار لابتوب مناسب حسب ميزانيتي واستخدامي." },
  { label: "🎮 لابتوب للألعاب", question: "شو الخيارات المناسبة للألعاب من أجهزة NOVATEK المتوفرة؟" },
  { label: "⚖️ قارنلي جهازين", question: "بدي قارن بين لابتوبين، شو المعلومات اللي لازم أعطيك ياها؟" },
  { label: "🧑‍💻 للدراسة والشغل", question: "بدي لابتوب للدراسة والشغل، ساعدني اختار المناسب." },
  { label: "🎁 شحن ألعاب وتطبيقات", question: "شو خدمات شحن الألعاب والتطبيقات المتوفرة عند NOVATEK؟" },
  { label: "🌐 تصميم موقع", question: "بدي اعرف عن خدمة تصميم وبرمجة المواقع عند NOVATEK." },
  { label: "🛒 كيف بطلب؟", question: "كيف بقدر أطلب من NOVATEK؟ وشو معلومات الطلب المطلوبة؟" },
];

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

  async function sendMessage(rawText: string) {
    const text = rawText.trim();
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

  async function send(e: FormEvent) {
    e.preventDefault();
    await sendMessage(input);
    setInput("");
  }

  const chatMessages = (
    <>
      {messages.length === 1 && !loading && (
        <section className="ai-chat-suggestions" aria-label="أسئلة مقترحة">
          <div className="ai-chat-suggestions-title">
            <span>خلّينا نبلّش</span>
            <small>اختار سؤال وخلّي الباقي علينا</small>
          </div>
          <div className="ai-chat-suggestion-list">
            {SUGGESTED_QUESTIONS.map((item) => (
              <button
                type="button"
                className="ai-chat-suggestion"
                key={item.label}
                onClick={() => void sendMessage(item.question)}
                disabled={loading}
              >
                {item.label}<span aria-hidden="true">←</span>
              </button>
            ))}
          </div>
        </section>
      )}
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
          <div><b>مساعد NOVATEK</b><small>مساعدة بمنتجات وخدمات NOVATEK</small></div>
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
            <div><b>مساعد NOVATEK</b><small>مساعدة بمنتجات وخدمات NOVATEK</small></div>
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
