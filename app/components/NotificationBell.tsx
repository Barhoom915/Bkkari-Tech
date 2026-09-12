"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/app/lib/supabase-browser";

export type StoreNotification = { id: string; title: string; body: string; href?: string | null; kind?: string | null; created_at: string };

export default function NotificationBell() {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<StoreNotification[]>([]);
  const [unread, setUnread] = useState(0);

  async function load() {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    if (!res.ok) return;
    const json = await res.json();
    setItems(json.data ?? []);
    setUnread(Number(json.unread ?? 0));
  }
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 8000); return () => window.clearInterval(timer); }, []);
  async function markRead() { await fetch("/api/notifications", { method: "PATCH" }); setUnread(0); }
  return (
    <div className="relative">
      <button onClick={() => { setOpen(v => !v); if (!open) void markRead(); }} aria-label="الإشعارات" className="relative flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-ink-soft shadow-sm transition hover:-translate-y-0.5 hover:border-blue hover:text-blue">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>
        {unread > 0 && <span className="absolute -left-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-orange px-1 text-[9px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && <div className="notification-popover notification-popover-fixed" dir="rtl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3"><b>الإشعارات</b><button onClick={markRead} className="text-[11px] text-blue">تحديد كمقروء</button></div>
        {items.length === 0 ? <div className="p-7 text-center text-xs text-ink-soft">ما في إشعارات جديدة 🔔</div> : <div className="max-h-80 overflow-auto">{items.map(n => <Link key={n.id} href={n.href || "#"} onClick={() => setOpen(false)} className="notification-row"><span className="notification-dot">{n.kind === "offer" ? "🔥" : n.kind === "order" ? "📦" : "🔔"}</span><span className="min-w-0"><b>{n.title}</b><small>{n.body}</small><em>{new Date(n.created_at).toLocaleDateString("ar-SY")}</em></span></Link>)}</div>}
        <div className="border-t border-line px-4 py-2"><button onClick={() => { void load(); setOpen(false); }} className="w-full text-xs font-semibold text-ink-soft">تحديث</button></div>
      </div>}
    </div>
  );
}
