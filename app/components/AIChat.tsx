"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Suggestion, SuggestionList, Suggestions } from "./ai-chat/suggestions";
import { Message, MessageActions, MessageAction, MessageAvatar, MessageBody, MessageContent, MessageThread, MessageTyping } from "./ai-chat/message-thread";

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
type Feedback = "up" | "down" | null;

const WELCOME_MESSAGE =
  "أهلاً فيك بـ NOVATEK 👋\nأنا مساعد المتجر، فيني ساعدك تختار لابتوب أو تتعرّف على خدماتنا. شو حابب تلاقي اليوم؟";

const SUGGESTED_QUESTIONS = [
  { label: "لابتوب حسب ميزانيتي", question: "ساعدني اختار لابتوب مناسب حسب ميزانيتي واستخدامي." },
  { label: "لابتوب للألعاب", question: "فرجيني لابتوبات مناسبة للألعاب من أجهزة NOVATEK المتوفرة." },
  { label: "خدمات المتجر", question: "شو خدمات NOVATEK وكيف فيني أطلب؟" },
  { label: "قارنلي بين جهازين", question: "ساعدني قارن بين لابتوبين من حيث الأداء والسعر والمواصفات." },
  { label: "لابتوب للدراسة", question: "رشّحلي لابتوب مناسب للدراسة والبرمجة حسب الأجهزة المتوفرة عندكم." },
];

const HISTORY_KEY = "novatek-ai-chat-history-v1";

function makeSession(messages: ChatMessage[], id: string): ChatSession {
  const firstQuestion = messages.find((m) => m.role === "user")?.text || "محادثة جديدة";
  return {
    id,
    title: firstQuestion.length > 38 ? `${firstQuestion.slice(0, 38)}…` : firstQuestion,
    updatedAt: Date.now(),
    messages,
  };
}

export default function AIChat({ embedded = false }: { embedded?: boolean }) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: WELCOME_MESSAGE },
  ]);
  const [typingMessageIndex, setTypingMessageIndex] = useState<number | null>(null);
  const [typedText, setTypedText] = useState("");
  const [feedbackByMessage, setFeedbackByMessage] = useState<Record<number, Feedback>>({});
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentSessionId = useRef<string>(`${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

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
  }, [messages, loading, historyOpen, typedText]);

  useEffect(() => {
    if (typingMessageIndex === null || !messages[typingMessageIndex]) {
      setTypedText("");
      return;
    }
    const fullText = messages[typingMessageIndex].text;
    let position = 0;
    setTypedText("");
    const timer = window.setInterval(() => {
      position = Math.min(position + (position < 100 ? 2 : 3), fullText.length);
      setTypedText(fullText.slice(0, position));
      if (position >= fullText.length) {
        window.clearInterval(timer);
        setTypingMessageIndex(null);
      }
    }, 16);
    return () => window.clearInterval(timer);
  }, [messages, typingMessageIndex]);

  function saveSession(nextMessages: ChatMessage[]) {
    if (!nextMessages.some((m) => m.role === "user")) return;
    const session = makeSession(nextMessages, currentSessionId.current);
    setHistory((current) => {
      const next = [session, ...current.filter((item) => item.id !== session.id)].slice(0, 30);
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
    setMenuOpen(false);
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
      setTypingMessageIndex(completed.length - 1);
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

  async function regenerateLastAnswer() {
    if (loading || !messages.some((message) => message.role === "user")) return;
    const lastUserIndex = messages.map((message) => message.role).lastIndexOf("user");
    const context = messages.slice(0, lastUserIndex + 1);
    setMessages(context);
    setLoading(true);
    setFeedbackByMessage({});
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: context.slice(-25) }),
      });
      let data: { reply?: string; products?: Product[] } = {};
      try { data = await res.json(); } catch { /* safe fallback below */ }
      const reply = typeof data.reply === "string" && data.reply.trim()
        ? data.reply.trim()
        : !res.ok
          ? "تعذّر إعادة الرد حالياً. جرّب بعد قليل."
          : "ما وصلني رد واضح. جرّب مرة ثانية.";
      const completed: ChatMessage[] = [...context, {
        role: "assistant",
        text: reply,
        products: Array.isArray(data.products) ? data.products.slice(0, 3) : [],
      }];
      setMessages(completed);
      setTypingMessageIndex(completed.length - 1);
      saveSession(completed);
    } catch {
      const completed: ChatMessage[] = [...context, {
        role: "assistant",
        text: "ما قدرت أعيد الرد بسبب مشكلة بالاتصال. جرّب مرة ثانية.",
      }];
      setMessages(completed);
      saveSession(completed);
    } finally {
      setLoading(false);
    }
  }

  async function copyAnswer(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageIndex(index);
      window.setTimeout(() => setCopiedMessageIndex((current) => current === index ? null : current), 1800);
    } catch {
      setCopiedMessageIndex(null);
    }
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    await sendMessage(input);
  }

  function startNewChat() {
    saveSession(messages);
    currentSessionId.current = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setTypingMessageIndex(null);
    setTypedText("");
    setMessages([{ role: "assistant", text: WELCOME_MESSAGE }]);
    setInput("");
    setHistoryOpen(false);
    setMenuOpen(false);
  }

  function restoreSession(session: ChatSession) {
    currentSessionId.current = session.id;
    setTypingMessageIndex(null);
    setTypedText("");
    setMessages(session.messages);
    setHistoryOpen(false);
    setMenuOpen(false);
  }

  const suggestions = messages.length === 1 && !loading ? (
    <Suggestions className="ai-chat-suggestions">
      <SuggestionList>
        {SUGGESTED_QUESTIONS.map((item) => (
          <Suggestion key={item.label} onClick={() => void sendMessage(item.question)} disabled={loading}>
            {item.label}
          </Suggestion>
        ))}
      </SuggestionList>
    </Suggestions>
  ) : null;

  const messageList = (
    <MessageThread className="ai-chat-messages">
      {messages.map((m, i) => (
        <Message key={i} role={m.role} className="ai-chat-message-row">
          <MessageBody>
            {m.role === "assistant" && <MessageAvatar> N </MessageAvatar>}
            <MessageContent className={`ai-msg ${m.role}`}>
              {m.role === "assistant" && i === typingMessageIndex ? typedText : m.text}
            </MessageContent>
          </MessageBody>
          {m.role === "assistant" && i !== typingMessageIndex && (
            <MessageActions className="ai-chat-message-actions">
              <MessageAction label={copiedMessageIndex === i ? "تم النسخ" : "نسخ الرد"} className="message-action-copy" onClick={() => void copyAnswer(m.text, i)}>
                {copiedMessageIndex === i ? "✓" : "▢"}
              </MessageAction>
              <MessageAction label="الرد مفيد" className={feedbackByMessage[i] === "up" ? "selected" : ""} onClick={() => setFeedbackByMessage((current) => ({ ...current, [i]: current[i] === "up" ? null : "up" }))}>
                <span aria-hidden="true">👍</span>
              </MessageAction>
              <MessageAction label="الرد غير مفيد" className={feedbackByMessage[i] === "down" ? "selected" : ""} onClick={() => setFeedbackByMessage((current) => ({ ...current, [i]: current[i] === "down" ? null : "down" }))}>
                <span aria-hidden="true">👎</span>
              </MessageAction>
              {i === messages.length - 1 && <MessageAction label="إعادة الرد" onClick={() => void regenerateLastAnswer()} disabled={loading} className="message-action-regenerate"><span aria-hidden="true">↻</span></MessageAction>}
            </MessageActions>
          )}
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
        </Message>
      ))}
      {loading && (
        <Message role="assistant" className="ai-chat-message-row">
          <MessageBody>
            <MessageAvatar>N</MessageAvatar>
            <MessageTyping label="عم حضّر الرد" />
          </MessageBody>
        </Message>
      )}
      <div ref={messagesEndRef} />
    </MessageThread>
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
      {messageList}
      {suggestions}
      <form onSubmit={send} className="ai-chat-form">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="اسأل NOVATEK أي شي عن منتجاتنا وخدماتنا..."
          aria-label="اكتب سؤالك لمساعد NOVATEK"
          maxLength={4000}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} aria-label="إرسال السؤال">➤</button>
      </form>
    </>
  );

  if (embedded) {
    return (
      <div className="ai-chat-embedded ai-chat-page-shell" dir="rtl">
        <div className="ai-chat-head ai-chat-page-head">
          <div className="ai-chat-brand">
            <span className="ai-chat-avatar"><img src="/brand/novatek-logo-transparent.png" alt="شعار NOVATEK" /></span>
            <div><b>مساعد NOVATEK ✨</b><small><span className="ai-chat-online-dot" /> نشط الآن</small></div>
          </div>
          <button type="button" className="ai-chat-menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"} aria-expanded={menuOpen}>☰</button>
          {menuOpen && (
            <nav className="ai-chat-page-menu" aria-label="قائمة مساعد NOVATEK">
              <button type="button" onClick={() => { setHistoryOpen(true); setMenuOpen(false); }}>سجل المحادثات</button>
              <button type="button" onClick={startNewChat}>محادثة جديدة</button>
            </nav>
          )}
        </div>
        {chat}
      </div>
    );
  }

  return (
    <Link className="ai-chat-fab" href="/ai-chat" aria-label="افتح مساعد NOVATEK">
      <span>✨</span>
    </Link>
  );
}
