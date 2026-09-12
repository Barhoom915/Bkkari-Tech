"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

const fields = [
  ["cpu", "المعالج المطلوب", "مثال: Intel Core i5 / Ryzen 5"],
  ["gpu", "كرت الشاشة", "مثال: RTX 4060 / RX 7600"],
  ["ram", "الرام", "مثال: 16GB / 32GB"],
  ["storage", "التخزين", "مثال: 1TB NVMe"],
  ["monitor", "الشاشة", "اختياري: 24\" 180Hz"],
] as const;

export default function PCBuilderPage() {
  const [category, setCategory] = useState("gaming");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setDone("");
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form.entries());
    body.request_type = "pc_build"; body.category = category;
    const r = await fetch("/api/custom-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) { setDone(j.error || "صار خطأ."); return; }
    setDone(`تم إرسال طلب التوصية ${j.request_number}. رح نراجعه ونتواصل معك للتسعير والتأكيد.`);
    e.currentTarget.reset();
  }

  return <div className="bkk-store-page"><Header/><main className="custom-page">
    <section className="custom-hero">
      <div><span className="custom-kicker">PC BUILDER / PRE-ORDER</span><h1>بدك جهاز مكتبي على ذوقك؟ <strong>خلّيه علينا.</strong></h1><p>هذا القسم للتواصي فقط. حدد المواصفات والميزانية التقريبية، ونرجعلك بسعر وتجميعة مناسبة قبل أي تأكيد.</p></div>
      <div className="custom-hero-badge"><b>🖥️</b><span>تجميعات مكتبية</span><small>Gaming + Business</small></div>
    </section>

    <section className="custom-layout">
      <form onSubmit={submit} className="custom-form">
        <div className="custom-tabs"><button type="button" className={category === "gaming" ? "active" : ""} onClick={() => setCategory("gaming")}>🎮 Gaming PC</button><button type="button" className={category === "business" ? "active" : ""} onClick={() => setCategory("business")}>🖥️ PC مكتبي</button></div>
        <div className="custom-note">ℹ️ ما في سعر ثابت هون. الطلب بيوصلنا كـ <b>طلب توصية</b>، وبعد مراجعة المواصفات والقطع منحدد السعر النهائي معك.</div>
        <div className="custom-grid">{fields.map(([name,label,placeholder]) => <label key={name}><span>{label}</span><input name={name} placeholder={placeholder}/></label>)}</div>
        <label><span>الإكسسوارات المطلوبة</span><input name="accessories" placeholder="كيبورد، ماوس، سماعة، Wi‑Fi..."/></label>
        <label><span>السعر التقريبي / الميزانية بالدولار</span><input name="budget" type="number" min="0" step="1" placeholder="مثال: 700"/></label>
        <label><span>ملاحظات إضافية</span><textarea name="notes" rows={4} placeholder="أي قطعة محددة أو طلب خاص..."/></label>
        <div className="custom-divider">بيانات التواصل</div>
        <div className="custom-grid"><label><span>الاسم *</span><input required name="customer_name" placeholder="اسمك"/></label><label><span>رقم الهاتف *</span><input required name="customer_phone" placeholder="09xxxxxxxx"/></label><label><span>المحافظة</span><input name="governorate" placeholder="دمشق"/></label><label><span>المنطقة</span><input name="city_area" placeholder="المنطقة / الحي"/></label></div>
        <button disabled={busy} className="custom-submit">{busy ? "عم نرسل الطلب..." : "إرسال طلب التوصية ←"}</button>
        {done && <div className={`custom-result ${done.startsWith("تم") ? "ok" : "error"}`}>{done}</div>}
      </form>
      <aside className="custom-side"><div><b>كيف بتم الطلب؟</b><ol><li>حدد نوع الجهاز.</li><li>اكتب المواصفات اللي بتعرفها.</li><li>حط ميزانية تقريبية إذا عندك.</li><li>بنوصلنا الطلب وبنرجعلك بالتسعير المناسب.</li></ol></div><Link href="/playstation" className="custom-side-link">بدك PlayStation؟ شوف قسم البلايستيشن ←</Link></aside>
    </section>
  </main><Footer/></div>;
}
