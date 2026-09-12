"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/app/lib/supabase-browser";

function GoogleIcon() { return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 15.4 18.9 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.2-5.6l-6.6-5.6C29.6 34.6 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.8l6.6 5.6C41.9 35.9 44 30.5 44 24c0-1.3-.1-2.7-.4-3.5z"/></svg> }

function LoginForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  const [termsOpen, setTermsOpen] = useState(false); const [termsAccepted, setTermsAccepted] = useState(false); const [termsText, setTermsText] = useState("باستخدام Bkkari Tech، يوافق المستخدم على تقديم معلومات صحيحة عند إنشاء الحساب أو الطلب، وعلى مراجعة تفاصيل المنتج والسعر قبل تأكيد الطلب.");
  const searchParams = useSearchParams(); const next = searchParams.get("next") || "/account"; const referralCode = searchParams.get("ref") || "";
  useEffect(() => { createClient().from("site_settings").select("value").eq("key","terms").maybeSingle().then((result: { data: { value: unknown } | null }) => { const value = result.data?.value; if (value && typeof value === "object" && "body" in value && typeof value.body === "string") setTermsText(value.body); }); }, []);

  async function handleGoogleLogin() {
    if (!termsAccepted) { setTermsOpen(true); return; }
    setLoading(true); setError("");
    try { const supabase = createClient(); const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}${referralCode ? `&ref=${encodeURIComponent(referralCode)}` : ""}`; const { error: authError } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } }); if (authError) throw authError; }
    catch (err) { setLoading(false); setError(err instanceof Error ? err.message : "تعذر بدء تسجيل الدخول."); }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signup" && !termsAccepted) { setTermsOpen(true); return; }
    setLoading(true); setError(""); setMessage("");
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name, terms_accepted_at: new Date().toISOString(), referral_code: referralCode || null } } });
        if (authError) throw authError;
        if (data.session) window.location.href = next; else setMessage("تم إنشاء الحساب. شيّك إيميلك لتأكيد الحساب ثم سجّل الدخول.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError; window.location.href = next;
      }
    } catch (err) { setError(err instanceof Error ? err.message : "تعذر تنفيذ العملية."); }
    finally { setLoading(false); }
  }

  return <main className="login-page" dir="rtl"><div className="login-orb login-orb-one"/><div className="login-orb login-orb-two"/><section className="login-shell">
    <div className="login-showcase"><div className="showcase-grid"/><div className="showcase-top"><a href="/" className="brand-mark"><span>BKKARI <b>TECH</b></span></a><span className="secure-pill"><span/> دخول آمن</span></div><div className="showcase-content"><span className="eyebrow">{mode === "signup" ? "أهلاً في عائلة بكاري تيك" : "مرحباً بك من جديد"}</span><h1>كل عالمك التقني<br/><strong>بمكان واحد.</strong></h1><p>حساب واحد للوصول إلى طلباتك، محفظتك، خدماتك الرقمية ومشاريع المواقع.</p><div className="benefits"><div><i>✓</i><span>تابع طلباتك وحالتها</span></div><div><i>✓</i><span>أدر محفظتك وخدماتك</span></div><div><i>✓</i><span>تواصل معنا بسهولة</span></div></div></div><div className="showcase-footer"><span>لابتوبات</span><span>خدمات رقمية</span><span>برمجة مواقع</span></div></div>
    <div className="login-card-wrap"><div className="login-card"><div className="card-heading"><span className="card-kicker">BKKARI TECH</span><h2>{mode === "signup" ? "إنشاء حساب جديد" : "تسجيل الدخول"}</h2><p>{mode === "signup" ? "أنشئ حسابك وابدأ باستخدام المتجر" : "ادخل إلى حسابك بالطريقة المناسبة إلك"}</p></div>
      <div className="auth-switch"><button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>دخول</button><button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>إنشاء حساب</button></div>
      <form onSubmit={handleEmailAuth} className="email-auth-form">{mode === "signup" && <input value={name} onChange={e=>setName(e.target.value)} placeholder="الاسم الكامل" required/>}<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="البريد الإلكتروني" required/><input type="password" minLength={6} value={password} onChange={e=>setPassword(e.target.value)} placeholder="كلمة المرور" required/><button className="primary-auth" disabled={loading}>{loading ? "جاري التنفيذ..." : mode === "signup" ? "إنشاء الحساب" : "تسجيل الدخول"}</button></form>
      <div className="divider"><span>أو</span></div><button className="google-button" onClick={handleGoogleLogin} disabled={loading}><span className="google-icon"><GoogleIcon/></span><span>المتابعة باستخدام Google</span><span className="arrow">←</span></button>
      {error && <div className="login-error" role="alert">{error}</div>}{message && <div className="login-success">{message}</div>}
      <div className="social-login-row"><a href="https://wa.me/963936426605" target="_blank" rel="noreferrer">واتساب</a><a href="https://t.me/NexCode9" target="_blank" rel="noreferrer">تيليغرام</a><a href="https://www.facebook.com/share/1BZU7LUd2o/" target="_blank" rel="noreferrer">فيسبوك</a></div>
      <p className="terms">{mode === "signup" ? "بعد إنشاء الحساب قد يصلك إيميل لتأكيد البريد الإلكتروني." : "تسجيل الدخول آمن، ويمكن استخدام Google أو البريد الإلكتروني."}</p>
      {mode === "signup" && <button type="button" onClick={()=>setTermsOpen(true)} className="terms-inline">📄 قراءة الشروط والأحكام {termsAccepted ? "✓ موافق" : ""}</button>}
      {termsOpen && <div className="terms-modal-backdrop" onClick={()=>setTermsOpen(false)}><div className="terms-modal" onClick={e=>e.stopPropagation()}><button type="button" className="terms-modal-close" onClick={()=>setTermsOpen(false)}>×</button><span>LEGAL / TERMS</span><h3>الشروط والأحكام</h3><div className="terms-modal-text">{termsText}</div><label><input type="checkbox" checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)}/> قرأت الشروط والأحكام وأوافق عليها.</label><button type="button" disabled={!termsAccepted} onClick={()=>setTermsOpen(false)}>موافق والمتابعة</button></div></div>}<a className="back-home" href="/">العودة إلى المتجر <span>←</span></a></div></div>
  </section></main>
}
export default function LoginPage(){return <Suspense fallback={<main className="login-page"><div className="login-loading">جاري التحميل...</div></main>}><LoginForm/></Suspense>}
