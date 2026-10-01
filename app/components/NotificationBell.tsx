"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

export type StoreNotification = { id: string; title: string; body: string; href?: string | null; kind?: string | null; created_at: string };

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<StoreNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  async function load() {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setItems(json.data ?? []);
      setUnread(Number(json.unread ?? 0));
    } catch { /* keep the bell usable even if the request is temporarily unavailable */ }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-notification-trigger]") || target?.closest("[data-notification-popover]")) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  async function markRead() {
    try { await fetch("/api/notifications", { method: "PATCH" }); } catch {}
    setUnread(0);
  }

  const popover = open && mounted ? createPortal(
    <div className="notification-popover notification-popover-fixed" data-notification-popover dir="rtl" role="dialog" aria-label="الإشعارات">
      <div className="notification-popover-head"><b>الإشعارات</b><button type="button" onClick={markRead}>تحديد كمقروء</button></div>
      {items.length === 0 ? <div className="notification-empty">ما في إشعارات جديدة 🔔</div> : <div className="notification-list">{items.map(n => <Link key={n.id} href={n.href || "#"} onClick={() => setOpen(false)} className="notification-row"><span className="notification-dot">{n.kind === "offer" ? "🔥" : n.kind === "order" ? "📦" : "🔔"}</span><span className="notification-copy"><b>{n.title}</b><small>{n.body}</small><em>{new Date(n.created_at).toLocaleDateString("ar-SY")}</em></span></Link>)}</div>}
      <button type="button" className="notification-refresh" onClick={() => void load()}>تحديث الإشعارات</button>
    </div>,
    document.body
  ) : null;

  return <>
    <button
      type="button"
      data-notification-trigger
      onClick={() => {
        setOpen(v => !v);
        if (!open) void markRead();
      }}
      aria-expanded={open}
      aria-label="الإشعارات"
      className={`notification-trigger ${open ? "is-open" : ""}`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>
      {unread > 0 && <span className="notification-badge">{unread > 9 ? "9+" : unread}</span>}
    </button>
    {popover}
  </>;
}
