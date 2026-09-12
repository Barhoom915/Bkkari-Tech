"use client";

import { useEffect, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase-browser";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import PushNotifications from "@/app/components/PushNotifications";

export default function AccountPage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [emailResending, setEmailResending] = useState(false);
  const [points, setPoints] = useState(0);
  const [referralCode, setReferralCode] = useState("");

  async function loadAccount(currentUser?: any) {
    const { data: auth } = await supabase.auth.getUser();
    const current = currentUser ?? auth.user;
    setUser(current);
    if (!current) { setLoading(false); return; }

    const meta = current.user_metadata ?? {};
    if (meta.referral_code && !meta.referral_applied_at) {
      const { data: referralResult } = await supabase.rpc("apply_referral", { p_code: meta.referral_code });
      if (referralResult?.ok) {
        await supabase.auth.updateUser({ data: { referral_applied_at: new Date().toISOString() } });
      }
    }
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
    setPoints(Number(rewardRes?.data?.points ?? 0));
    setReferralCode(rewardRes?.data?.referral_code ?? "");
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    (async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (active) await loadAccount(currentUser ?? undefined);
    })();

    const { data } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (!active) return;
      if (session?.user) {
        void loadAccount(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  async function resendEmailConfirmation() {
    if (!user?.email || user.email_confirmed_at) return;
    setEmailResending(true); setMessage("");
    const { error } = await supabase.auth.resend({ type: "signup", email: user.email });
    setEmailResending(false);
    setMessage(error ? `تعذر إرسال رسالة التوثيق: ${error.message}` : "تم إرسال رسالة توثيق الإيميل. افتح بريدك واضغط رابط التفعيل.");
  }

  async function saveProfile() {
    if (!user) return;
    setSaving(true); setMessage("");
    const { data, error } = await supabase.auth.updateUser({
      data: { ...user.user_metadata, full_name: name.trim(), name: name.trim(), phone: phone.trim(), avatar_url: avatarUrl.trim() },
    });
    setSaving(false);
    if (error) setMessage(error.message);
    else { setUser(data.user); setMessage("تم حفظ بيانات الحساب ✓"); }
  }

  async function uploadAvatar(file: File) {
    if (!user || !file) return;
    setSaving(true); setMessage("");
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = URL.createObjectURL(file); });
      const max = 720; const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
      const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("canvas"); ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
      if (!blob) throw new Error("image");
      const uploadFile = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      const path = `${user.id}/avatar-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("avatars").upload(path, uploadFile, { upsert: false, contentType: "image/jpeg" });
    if (error) {
      setSaving(false); setMessage("تعذر رفع الصورة. شغّل v11_wallet_requests.sql في Supabase ثم جرّب مرة تانية."); return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    const { data: updated, error: updateError } = await supabase.auth.updateUser({ data: { ...user.user_metadata, avatar_url: data.publicUrl } });
    setSaving(false);
    if (updateError) setMessage(updateError.message); else { setUser(updated.user); setMessage("تم تحديث الصورة ✓"); }
    } catch { setSaving(false); setMessage("تعذر تجهيز الصورة. جرّب صورة ثانية من المعرض."); }
  }

  if (loading) return <><Header/><main className="mx-auto max-w-6xl px-4 py-24 text-center text-sm text-ink-soft" dir="rtl">جاري تحميل الحساب...</main><Footer/></>;

  if (!user) return <><Header/><main className="mx-auto max-w-md px-4 py-20 text-center" dir="rtl"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue/10 text-3xl">◉</div><h1 className="mt-5 text-2xl font-extrabold">الحساب الشخصي</h1><p className="mt-2 text-sm text-ink-soft">سجّل دخول أولاً حتى تقدر تدير معلومات حسابك وطلباتك.</p><Link href="/login?next=/account" className="mt-6 inline-block rounded-full bg-blue px-7 py-3 text-sm font-bold text-white">تسجيل الدخول</Link></main><Footer/></>;

  const meta = user.user_metadata ?? {};
  const displayName = name || meta.full_name || meta.name || "مستخدم Bkkari Tech";
  const initial = displayName.trim().charAt(0).toUpperCase() || "B";

  return <>
    <Header />
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12" dir="rtl">
      <section className="overflow-hidden rounded-[2rem] border border-line bg-gradient-to-l from-blue-deep to-blue p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {avatarUrl ? <img src={avatarUrl} alt={displayName} className="h-20 w-20 rounded-full border-4 border-white/30 object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 text-3xl font-extrabold">{initial}</div>}
            <div><p className="text-xs font-semibold text-white/70">حساب BKKARI TECH</p><h1 className="mt-1 text-2xl font-extrabold">أهلاً، {displayName}</h1><p className="mt-1 text-sm text-white/75">{user.email}</p><p className="mt-2 break-all text-[10px] text-white/55">ID: {user.id}</p></div>
          </div>
          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur"><p className="text-xs text-white/70">رصيد المحفظة</p><p className="mt-1 text-3xl font-extrabold">${balance.toFixed(2)}</p><Link href="/wallet" className="mt-3 inline-block rounded-full bg-white px-4 py-2 text-xs font-bold text-blue-deep">إدارة المحفظة</Link></div>
        </div>
      </section>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <section className="rounded-3xl border border-line bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between"><div><h2 className="text-xl font-extrabold">معلومات الحساب</h2><p className="mt-1 text-sm text-ink-soft">عدّل اسمك، رقمك وصورتك الشخصية.</p></div></div>
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row">
            {avatarUrl ? <img src={avatarUrl} alt="الصورة الشخصية" className="h-24 w-24 rounded-full border border-line object-cover" /> : <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface text-3xl font-extrabold text-blue">{initial}</div>}
            <label className="cursor-pointer rounded-full border border-line px-5 py-2.5 text-sm font-bold hover:border-blue hover:text-blue">اختيار صورة شخصية<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}/></label>
          </div>
          <div className="mt-6 grid gap-4"><div className="rounded-2xl border border-line bg-surface p-4"><p className="text-xs text-ink-soft">معرّف الحساب (ID)</p><div className="mt-2 break-all rounded-xl bg-white px-3 py-2.5 font-mono text-[11px] text-ink">{user.id}</div><p className="mt-2 text-[10px] text-ink-soft">هاد المعرّف خاص بحسابك وبيستخدم لتمييز الحساب بشكل فريد.</p></div>
            <label className="text-sm font-semibold">الاسم<input value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-blue" placeholder="اكتب اسمك"/></label>
            <div className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-ink-soft">البريد الإلكتروني</p>
                  <p className="mt-1 truncate text-sm font-semibold">{user.email ?? "-"}</p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${user.email_confirmed_at ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {user.email_confirmed_at ? "✓ موثّق" : "غير موثّق"}
                </span>
              </div>
              {!user.email_confirmed_at && <button type="button" disabled={emailResending} onClick={resendEmailConfirmation} className="mt-3 rounded-full border border-line bg-white px-4 py-2 text-xs font-bold hover:border-blue hover:text-blue">{emailResending ? "جاري الإرسال..." : "إعادة إرسال رسالة التوثيق"}</button>}
            </div>
            <div>
              <label className="text-sm font-semibold">رقم الهاتف<input value={phone} onChange={e=>setPhone(e.target.value)} className="mt-2 w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-blue" placeholder="+9639xxxxxxxx"/></label>
              <p className="mt-2 text-xs text-ink-soft">رقم الهاتف محفوظ ضمن معلومات الحساب، لكن التوثيق يتم عبر البريد الإلكتروني فقط.</p>
            </div>
            <button disabled={saving} onClick={saveProfile} className="rounded-2xl bg-blue px-5 py-3 font-bold text-white disabled:opacity-60">{saving ? "جاري الحفظ..." : "حفظ معلومات الحساب"}</button>
            {message && <p className="text-center text-sm text-ink-soft">{message}</p>}
          </div>
        </section>

        <section className="rounded-3xl border border-line bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between"><div><h2 className="text-xl font-extrabold">آخر الطلبات</h2><p className="mt-1 text-sm text-ink-soft">كل طلبات الحساب المرتبطة بتسجيل الدخول.</p></div><Link href="/track" className="text-xs font-bold text-blue">تتبع طلب</Link></div>
          {orders.length ? <div className="mt-5 space-y-3">{orders.map(o=><div key={o.order_number} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-4"><div><p className="font-mono-data text-sm font-bold text-blue">{o.order_number}</p><p className="mt-1 text-xs text-ink-soft">{new Date(o.created_at).toLocaleDateString('ar-SY')}</p></div><div className="text-sm font-bold">${Number(o.total).toFixed(2)}</div><span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold">{o.status}</span></div>)}</div> : <div className="mt-5 rounded-2xl bg-surface p-8 text-center text-sm text-ink-soft">ما عندك طلبات مرتبطة بهالحساب حالياً.</div>}
        </section>
      </div>

      <section className="mt-6 rounded-3xl border border-line bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-extrabold">إشعارات Bkkari Tech 🔔</h2><p className="mt-1 text-xs leading-5 text-ink-soft">فعّلها حتى توصلك تحديثات العروض والطلبات. إشعارات الخلفية تحتاج السماح من المتصفح.</p></div><PushNotifications /></div></section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/wallet" className="rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue"><span className="text-2xl">💳</span><h3 className="mt-3 font-extrabold">المحفظة</h3><p className="mt-1 text-xs text-ink-soft">رصيدك وحركات المحفظة وشحن الرصيد.</p></Link>
        <Link href="/wishlist" className="rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue"><span className="text-2xl">♥</span><h3 className="mt-3 font-extrabold">المفضلة</h3><p className="mt-1 text-xs text-ink-soft">منتجاتك المحفوظة للرجوع إلها لاحقاً.</p></Link>
        <Link href="/checkout" className="rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue"><span className="text-2xl">🛒</span><h3 className="mt-3 font-extrabold">السلة والدفع</h3><p className="mt-1 text-xs text-ink-soft">كمّل طلبك بسرعة من مكان واحد.</p></Link>
        <Link href="/purchase-history" className="rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue"><span className="text-2xl">🛍️</span><h3 className="mt-3 font-extrabold">سجل الشراء</h3><p className="mt-1 text-xs text-ink-soft">كل طلباتك والمنتجات الموجودة ضمن كل طلب.</p></Link>
        <Link href="/payment-history" className="rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue"><span className="text-2xl">💳</span><h3 className="mt-3 font-extrabold">سجل الدفع</h3><p className="mt-1 text-xs text-ink-soft">كل عمليات الدفع من المحفظة والإضافات والاستردادات.</p></Link><Link href="/digital-orders" className="rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue"><span className="text-2xl">🎮</span><h3 className="mt-3 font-extrabold">سجل الخدمات الرقمية</h3><p className="mt-1 text-xs text-ink-soft">طلبات الخدمات الرقمية المباشرة وحالاتها.</p></Link>
        <Link href="/rewards" className="rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue"><span className="text-2xl">⭐</span><h3 className="mt-3 font-extrabold">النقاط والإحالة</h3><p className="mt-1 text-xs text-ink-soft">{points} نقطة · كود {referralCode || "…"}</p></Link>
      </section>
    </main><Footer/>
  </>;
}
