"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase-browser";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import PushNotifications from "@/app/components/PushNotifications";

export default function AccountPage() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [emailResending, setEmailResending] = useState(false);

  async function loadAccount(currentUser?: User | null) {
    const { data: auth } = await supabase.auth.getUser();
    const current = currentUser ?? auth.user;
    setUser(current);
    if (!current) { setLoading(false); return; }
    const meta = current.user_metadata ?? {};
    setName(meta.full_name ?? meta.name ?? "");
    setPhone(meta.phone ?? "");
    setAvatarUrl(meta.avatar_url ?? meta.picture ?? "");
    const [ordersRes, walletRes, rewardRes] = await Promise.all([
      supabase.from("orders").select("order_number,total,status,created_at").eq("user_id", current.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("wallets").select("balance").eq("user_id", current.id).maybeSingle(),
      supabase.rpc("ensure_customer_rewards"),
    ]);
    setOrders(ordersRes.data ?? []);
    setBalance(Number(walletRes.data?.balance ?? 0));
    setPoints(Number(rewardRes.data?.points ?? 0));
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => { if (active) void loadAccount(data.user); });
    const { data } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (!active) return;
      void loadAccount(session?.user ?? null);
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [supabase]);

  async function saveProfile() {
    if (!user) return;
    setSaving(true); setMessage("");
    const { data, error } = await supabase.auth.updateUser({ data: { ...user.user_metadata, full_name: name.trim(), name: name.trim(), phone: phone.trim(), avatar_url: avatarUrl.trim() } });
    setSaving(false);
    if (error) setMessage(error.message); else { setUser(data.user); setMessage("تم حفظ معلومات الحساب ✓"); }
  }

  async function uploadAvatar(file: File) {
    if (!user || !file) return;
    setSaving(true); setMessage("");
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = URL.createObjectURL(file); });
      const max = 720; const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
      const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("canvas"); ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", .86)); if (!blob) throw new Error("image");
      const path = `${user.id}/avatar-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("avatars").upload(path, new File([blob], "avatar.jpg", { type: "image/jpeg" }), { upsert: false, contentType: "image/jpeg" });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const { data: updated, error: updateError } = await supabase.auth.updateUser({ data: { ...user.user_metadata, avatar_url: data.publicUrl } });
      if (updateError) throw updateError;
      setAvatarUrl(data.publicUrl); setUser(updated.user); setMessage("تم تحديث الصورة ✓");
    } catch { setMessage("تعذر تحديث الصورة حالياً. جرّب صورة ثانية."); }
    finally { setSaving(false); }
  }

  async function resendEmailConfirmation() {
    if (!user?.email || user.email_confirmed_at) return;
    setEmailResending(true); setMessage("");
    const { error } = await supabase.auth.resend({ type: "signup", email: user.email });
    setEmailResending(false);
    setMessage(error ? `تعذر إرسال رسالة التوثيق: ${error.message}` : "تم إرسال رسالة التوثيق إلى بريدك.");
  }

  async function logout() {
    if (!window.confirm("⚠️ تحذير\n\nسيتم تسجيل الخروج من حسابك. هل تريد المتابعة؟")) return;
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) return <><Header/><main className="v71-account-page" dir="rtl"><div className="v71-loading">جاري تحميل حسابك...</div></main><Footer/></>;
  if (!user) return <><Header/><main className="v71-account-page" dir="rtl"><section className="v71-guest"><span>ACCOUNT</span><b>👤</b><h1>حسابك بانتظارك</h1><p>سجّل دخول حتى تتابع طلباتك، محفظتك والمفضلة من مكان واحد.</p><Link href="/login?next=/account">تسجيل الدخول</Link></section></main><Footer/></>;

  const meta = user.user_metadata ?? {};
  const displayName = name || meta.full_name || meta.name || "مستخدم Bkkari Tech";
  const initial = displayName.trim().charAt(0).toUpperCase() || "B";
  const quick = [
    ["/track", "🚚", "تتبع الطلب", "تابع حالة طلباتك"],
    ["/purchase-history", "📦", "طلباتي", "كل سجل الشراء"],
    ["/wishlist", "♡", "المفضلة", "الأجهزة المحفوظة"],
    ["/wallet", "💳", "المحفظة", "الرصيد والحركات"],
    ["/rewards", "★", "المكافآت", `${points} نقطة`],
    ["/payment-history", "↕", "المدفوعات", "سجل الدفعات"],
  ];

  return <div className="v71-account-shell"><Header/><main className="v71-account-page" dir="rtl">
    <section className="v71-account-head">
      <div className="v71-profile-mini">
        {avatarUrl ? <img src={avatarUrl} alt=""/> : <span>{initial}</span>}
        <div><small>حساب Bkkari Tech</small><h1>{displayName}</h1><p>{user.email}</p></div>
      </div>
      <div className="v71-head-balance"><small>رصيد المحفظة</small><strong>${balance.toFixed(2)}</strong><div><Link href="/wallet">+ شحن الرصيد</Link><Link href="/wallet">المحفظة</Link></div></div>
    </section>

    <section className="v71-account-quick" aria-label="اختصارات الحساب">
      {quick.map(([href,icon,title,desc]) => <Link href={href} key={href}><b>{icon}</b><span><strong>{title}</strong><small>{desc}</small></span><i>←</i></Link>)}
    </section>

    <div className="v71-account-columns">
      <section className="v71-account-panel">
        <div className="v71-panel-title"><div><span>PROFILE</span><h2>معلوماتي</h2></div><button onClick={()=>void logout()} className="v71-logout">تسجيل الخروج</button></div>
        <div className="v71-avatar-row">
          {avatarUrl ? <img src={avatarUrl} alt="الصورة الشخصية"/> : <span>{initial}</span>}
          <label>تغيير الصورة<input type="file" accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>)=>e.target.files?.[0] && void uploadAvatar(e.target.files[0])}/></label>
        </div>
        <div className="v71-form-grid">
          <label>الاسم<input value={name} onChange={e=>setName(e.target.value)} placeholder="اسمك"/></label>
          <label>رقم الهاتف<input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="09xxxxxxxx"/></label>
        </div>
        <div className="v71-email-row"><span><small>البريد الإلكتروني</small><b>{user.email ?? "-"}</b></span><em className={user.email_confirmed_at ? "ok" : "warn"}>{user.email_confirmed_at ? "✓ موثّق" : "غير موثّق"}</em>{!user.email_confirmed_at && <button onClick={()=>void resendEmailConfirmation()} disabled={emailResending}>{emailResending ? "جاري الإرسال..." : "إرسال التوثيق"}</button>}</div>
        <button className="v71-save" disabled={saving} onClick={()=>void saveProfile()}>{saving ? "جاري الحفظ..." : "حفظ التغييرات"}</button>
        {message && <p className="v71-account-message">{message}</p>}
      </section>

      <section className="v71-account-panel v71-orders-panel">
        <div className="v71-panel-title"><div><span>ORDERS</span><h2>آخر الطلبات</h2></div><Link href="/track">تتبع الكل ←</Link></div>
        {orders.length ? <div className="v71-order-list">{orders.slice(0,6).map(o=><Link href="/track" key={o.order_number}><span className="v71-order-icon">📦</span><span><b>{o.order_number}</b><small>{new Date(o.created_at).toLocaleDateString("ar-SY")} · {o.status}</small></span><strong>${Number(o.total).toFixed(2)}</strong></Link>)}</div> : <div className="v71-empty">لسا ما عندك طلبات. <Link href="/laptops">ابدأ التسوق ←</Link></div>}
      </section>
    </div>

    <section className="v71-account-panel v71-notify-panel"><div><span>NOTIFICATIONS</span><h2>إشعارات المتجر</h2><p>فعّل إشعارات الطلبات والعروض من جهازك.</p></div><PushNotifications/></section>
  </main><Footer/></div>;
}
