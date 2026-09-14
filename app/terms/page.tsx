"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { createClient } from "@/app/lib/supabase-browser";

const fallback = {
  title: "الشروط والأحكام",
  body: "باستخدام Bkkari Tech، يوافق المستخدم على تقديم معلومات صحيحة عند إنشاء الحساب أو الطلب، وعلى مراجعة تفاصيل المنتج والسعر قبل تأكيد الطلب. الأسعار والتوفر قد تتغير قبل تأكيد الطلب من الإدارة. الخدمات الرقمية بعد تنفيذها قد لا تكون قابلة للاسترجاع إذا تم استخدامها أو تنفيذها بشكل صحيح. يمنع إساءة استخدام الموقع أو محاولة الوصول إلى حسابات أو بيانات غير مصرح بها. يحق للإدارة التواصل مع المستخدم لتأكيد الطلب ومعلومات التسليم.",
};

function TermsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const acceptMode = params.get("accept") === "1";
  const next = params.get("next") || "/account";
  const [content, setContent] = useState(fallback);
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    createClient()
      .from("site_settings")
      .select("value")
      .eq("key", "terms")
      .maybeSingle()
      .then((result: { data: { value: unknown } | null }) => {
        const value = result.data?.value;
        if (value && typeof value === "object") setContent({ ...fallback, ...(value as Partial<typeof fallback>) });
      });
  }, []);

  async function accept() {
    if (!accepted) return;
    setSaving(true);
    setError("");

    try {
      const result = await fetch("/api/auth/accept-terms", { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await result.json().catch(() => ({}));
      if (!result.ok || !data.ok) throw new Error(data.error || "تعذر حفظ الموافقة على الشروط.");
      router.replace(next.startsWith("/") ? next : "/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ الموافقة على الشروط.");
    } finally {
      setSaving(false);
    }
  }

  return <>
    <Header />
    <main className="policy-page" dir="rtl">
      <div className="policy-wrap">
        <div className="policy-head"><span>LEGAL / TERMS</span><h1>{content.title}</h1></div>
        <article className="policy-card"><p>{content.body}</p></article>
        {acceptMode && <section className="terms-accept-card">
          <h2>قبل المتابعة</h2>
          <p>لازم توافق على الشروط والأحكام حتى يكتمل إنشاء الحساب وتقدر تكمل استخدام المتجر.</p>
          <label><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} /> قرأت الشروط والأحكام وأوافق عليها.</label>
          {error && <div className="login-error" role="alert">{error}</div>}
          <button disabled={!accepted || saving} onClick={accept}>{saving ? "جاري حفظ الموافقة..." : "موافق والمتابعة"}</button>
        </section>}
      </div>
    </main>
    <Footer />
  </>;
}

export default function TermsPage() {
  return <Suspense fallback={<main className="policy-page"><div className="policy-wrap">جاري التحميل...</div></main>}><TermsContent /></Suspense>;
}
