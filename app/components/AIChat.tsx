"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Product = {
  id: number;
  name: string;
  brand: string | null;
  price: number;
  cpu: string | null;
  ram: string | null;
  storage: string | null;
  gpu: string | null;
  images: string[] | null;
};
type ChatMessage = { role: "user" | "assistant"; text: string; products?: Product[] };
type ChatSession = { id: string; title: string; updatedAt: number; messages: ChatMessage[] };

const WELCOME_MESSAGE =
  "أهلاً فيك بـ NOVATEK 👋\nأنا مساعد المتجر، فيني ساعدك تختار لابتوب أو تتعرّف على خدماتنا. شو حابب تلاقي اليوم؟";

const SUGGESTED_QUESTIONS = [
  { label: "لابتوب حسب ميزانيتي", question: "ساعدني اختار لابتوب مناسب حسب ميزانيتي واستخدامي." },
  { label: "لابتوب للألعاب", question: "فرجيني لابتوبات مناسبة للألعاب من أجهزة NOVATEK المتوفرة." },
  { label: "خدمات المتجر", question: "شو خدمات NOVATEK وكيف فيني أطلب؟" },
];

const HISTORY_KEY = "novatek-ai-chat-history-v1";

function makeSession(messages: ChatMessage[]): ChatSession {
  const firstQuestion = messages.find((m) => m.role === "user")?.text || "محادثة جديدة";
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: firstQuestion.length > 38 ? `${firstQuestion.slice(0, 38)}…` : firstQuestion,
    updatedAt: Date.now(),
    messages,
  };
}

export default function AIChat({ embedded = false }: { embedded?: boolean }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: WELCOME_MESSAGE },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setHistory(parsed.filter((s) => Array.isArray(s.messages)).slice(0, 30));
      }
    } catch {
      // Chat still works if local storage is unavailable.
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, open, expanded, historyOpen]);

  function saveSession(nextMessages: ChatMessage[]) {
    if (!nextMessages.some((m) => m.role === "user")) return;
    const session = makeSession(nextMessages);
    setHistory((current) => {
      const next = [session, ...current].slice(0, 30);
      try {
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        // Keep the current session usable even if storage is full/disabled.
      }
      return next;
    });
  }

  async function sendMessage(rawText: string) {
    const text = rawText.trim();
    if (!text || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", text }];
    setMessages(next);
    setInput("");
    setHistoryOpen(false);
    setLoading(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-25) }),
      });

      let data: { reply?: string; products?: Product[] } = {};
      try { data = await res.json(); } catch { /* safe fallback below */ }
      const reply =
        typeof data.reply === "string" && data.reply.trim()
          ? data.reply.trim()
          : !res.ok
            ? "تعذّر إكمال الطلب حالياً. جرّب بعد قليل."
            : "ما وصلني رد واضح من المساعد. جرّب صياغة السؤال بطريقة ثانية.";
      const completed = [...next, {
        role: "assistant" as const,
        text: reply,
        products: Array.isArray(data.products) ? data.products.slice(0, 3) : [],
      }];
      setMessages(completed);
      saveSession(completed);
    } catch {
      const completed = [...next, {
        role: "assistant" as const,
        text: "ما قدرت اتصل بالمساعد. تأكد من اتصال الإنترنت وجرّب مرة ثانية.",
      }];
      setMessages(completed);
      saveSession(completed);
    } finally {
      setLoading(false);
    }
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    await sendMessage(input);
  }

  function startNewChat() {
    saveSession(messages);
    setMessages([{ role: "assistant", text: WELCOME_MESSAGE }]);
    setInput("");
    setHistoryOpen(false);
  }

  function restoreSession(session: ChatSession) {
    setMessages(session.messages);
    setHistoryOpen(false);
  }

  const suggestions = messages.length === 1 && !loading ? (
    <section className="ai-chat-suggestions" aria-label="أسئلة مقترحة">
      <p className="ai-chat-suggestions-title">ممكن نساعدك بـ</p>
      <div className="ai-chat-suggestion-list">
        {SUGGESTED_QUESTIONS.map((item) => (
          <button
            type="button"
            className="ai-chat-suggestion"
            key={item.label}
            onClick={() => void sendMessage(item.question)}
            disabled={loading}
          >{item.label}</button>
        ))}
      </div>
    </section>
  ) : null;

  const messageList = (
    <div className="ai-chat-messages" aria-live="polite" aria-relevant="additions text">
      {messages.map((m, i) => (
        <div key={i} className={`ai-chat-message-row ${m.role}`}>
          <div className={`ai-msg ${m.role}`}>{m.text}</div>
          {m.role === "assistant" && m.products && m.products.length > 0 && (
            <div className="ai-chat-product-list" aria-label="أجهزة من متجر NOVATEK">
              {m.products.map((product) => (
                <article className="ai-chat-product-card" key={product.id}>
                  <a className="ai-chat-product-image" href={`/laptops/${product.id}`} aria-label={`عرض ${product.name}`}>
                    {product.images?.[0]
                      ? <img src={product.images[0]} alt={product.name} loading="lazy" />
                      : <span>💻</span>}
                  </a>
                  <div className="ai-chat-product-info">
                    <strong>{product.name}</strong>
                    <small>{[product.cpu, product.ram, product.storage, product.gpu].filter(Boolean).join(" · ") || product.brand || "من أجهزة NOVATEK"}</small>
                    <b>${Number(product.price).toLocaleString("en-US")}</b>
                    <a className="ai-chat-product-action" href={`/laptops/${product.id}`}>عرض الجهاز <span aria-hidden="true">←</span></a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      ))}
      {loading && (
        <div className="ai-chat-message-row assistant">
          <div className="ai-msg assistant ai-thinking" role="status" aria-label="المساعد يفكر">
            <span className="ai-thinking-dots"><i /><i /><i /></span>
            <span>عم فكّر بالأنسب إلك</span>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );

  const historyPanel = historyOpen ? (
    <section className="ai-chat-history-panel" aria-label="سجل المحادثات">
      <div className="ai-chat-history-heading">
        <strong>سجل المحادثات</strong>
        <button type="button" onClick={() => setHistoryOpen(false)} aria-label="إغلاق سجل المحادثات">×</button>
      </div>
      {history.length === 0 ? (
        <p className="ai-chat-history-empty">لسه ما في محادثات محفوظة. اسأل المساعد وبتظهر هون.</p>
      ) : (
        <div className="ai-chat-history-list">
          {history.map((session) => (
            <button type="button" key={session.id} className="ai-chat-history-item" onClick={() => restoreSession(session)}>
              <span>{session.title}</span>
              <small>{new Date(session.updatedAt).toLocaleDateString("ar")}</small>
            </button>
          ))}
        </div>
      )}
      <p className="ai-chat-history-note">السجل محفوظ بهالمتصفح على جهازك.</p>
    </section>
  ) : null;

  const chat = (
    <>
      <div className="ai-chat-toolbar">
        <button type="button" className="ai-chat-tool-button" onClick={() => setHistoryOpen((v) => !v)} aria-expanded={historyOpen}>
          <span aria-hidden="true">◷</span> سجل محادثات
        </button>
        <button type="button" className="ai-chat-tool-button" onClick={startNewChat}>
          <span aria-hidden="true">＋</span> محادثة جديدة
        </button>
      </div>
      {historyPanel}
      {suggestions}
      {messageList}
      <form onSubmit={send} className="ai-chat-form">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="اسأل NOVATEK أي شي عن منتجاتنا وخدماتنا..."
          aria-label="اكتب سؤالك للمساعد الذكي"
          maxLength={4000}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} aria-label="إرسال السؤال}>➤</button>
      </form>
    </>
  );

  if (embedded) {
    return (
      <div className="ai-chat-embedded" dir="rtl">
        <div className="ai-chat-head">
          <div className="ai-chat-brand"><span className="ai-chat-online-dot" /><div><b>مساعد NOVATEK</b><small>جاهز يساعدك تختار</small></div></div>
        </div>
        {chat}
      </div>
    );
  }

  return (
    <>
      {open && (
        <div className={`ai-chat-panel ${expanded ? "is-expanded" : ""}`} dir="rtl">
          <div className="ai-chat-head">
            <div className="ai-chat-brand"><span className="ai-chat-online-dot" /><div><b>مساعد NOVATEK</b><small>منتجات وخدمات المتجر</small></div></div>
            <div className="ai-chat-head-actions">
              <button type="button" onClick={() => setExpanded((v) => !v)} aria-label={expanded ? "تصغير نافذة المحادثة" : "تكبير المحادثة للشاشة كاملة"} title={expanded ? "تصغير" : "تكبير"}>{expanded ? "↙" : "⛶"}</button>
              <button type="button" onClick={() => { setOpen(false); setExpanded(false); }} aria-label="إغلاق المحادثة">×</button>
            </div>
          </div>
          {chat}
        </div>
      )}
      <button className="ai-chat-fab" onClick={() => setOpen((v) => !v)} aria-label={open ? "إغلاق محادثة الذكاء الاصطناعي" : "محادثة مع الذكاء الاصطناعي"} aria-expanded={open}>
        <span>✦</span>
      </button>
    </>
  );
}
