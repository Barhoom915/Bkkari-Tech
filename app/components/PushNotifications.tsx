"use client";

import { useState } from "react";

export default function PushNotifications() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function enable() {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) { setMessage("المتصفح ما بيدعم إشعارات المتجر."); return; }
    setBusy(true); setMessage("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setMessage("تم رفض إذن الإشعارات. فيك تفعّله من إعدادات المتصفح."); return; }
      const registration = await navigator.serviceWorker.register("/sw.js");
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) { setMessage("الإشعارات داخل الموقع شغالة، وإشعارات الخلفية بدها VAPID من إعدادات الاستضافة."); return; }
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) });
      const res = await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription) });
      if (!res.ok) throw new Error("تعذر حفظ الاشتراك");
      setMessage("تم تفعيل إشعارات Bkkari Tech 🔔");
    } catch (e) { setMessage(e instanceof Error ? e.message : "تعذر تفعيل الإشعارات"); }
    finally { setBusy(false); }
  }
  return <button onClick={enable} disabled={busy} className="rounded-xl border border-blue/20 bg-blue/10 px-4 py-2.5 text-xs font-bold text-blue disabled:opacity-60">{busy ? "جاري التفعيل..." : "🔔 فعّل إشعارات المتجر"}</button>;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const rawData = window.atob((base64String + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
