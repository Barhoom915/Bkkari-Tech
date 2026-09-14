import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import type { Laptop } from "@/app/lib/types";

type Dimension = { key: string; label: string; value: (l: Laptop) => string; score: (l: Laptop) => number; explain: (l: Laptop) => string };

function textScore(value: unknown) {
  const t = String(value || "").toLowerCase();
  let s = 0;
  if (/rtx\s*50/.test(t)) s += 14; else if (/rtx\s*40/.test(t)) s += 12; else if (/rtx\s*30/.test(t)) s += 10; else if (/rtx/.test(t)) s += 8;
  else if (/rx\s*7|rx\s*6/.test(t)) s += 8; else if (/radeon rx/.test(t)) s += 7; else if (/gtx\s*16/.test(t)) s += 6; else if (/gtx/.test(t)) s += 5; else if (/iris xe|iris graphics/.test(t)) s += 2;
  if (/ultra\s*9|core\s*i9|ryzen\s*9/.test(t)) s += 9; else if (/ultra\s*7|core\s*i7|ryzen\s*7/.test(t)) s += 7; else if (/ultra\s*5|core\s*i5|ryzen\s*5/.test(t)) s += 5; else if (/core\s*i3|ryzen\s*3/.test(t)) s += 2;
  return s;
}
function ramScore(v: unknown) { const n = Number((String(v || "").match(/\d+/) || [0])[0]); return Math.min(12, Math.floor(n / 2)); }
function storageScore(v: unknown) { const t = String(v || "").toLowerCase(); const n = Number((t.match(/[0-9]+/) || [0])[0]); return /nvme|ssd/.test(t) ? Math.min(8, 4 + Math.floor(n / 500)) : Math.min(5, 1 + Math.floor(n / 500)); }
function screenScore(v: unknown) { const t = String(v || "").toLowerCase(); let s = 0; if (/2k|qhd|1440|1600/.test(t)) s += 5; else if (/fhd|1080|1920/.test(t)) s += 4; else if (/4k|2160|uhd/.test(t)) s += 6; if (/144|165|240|360/.test(t)) s += 3; return s; }
function usage(l: Laptop) {
  const t = `${l.category || ""} ${l.cpu || ""} ${l.gpu || ""}`.toLowerCase();
  const gaming = /gaming|gtx|rtx|radeon rx|geforce/.test(t);
  const creator = /rtx|radeon rx|quadro|arc|design|تصميم/.test(t);
  const office = !gaming || /أعمال|business|مكتبي|دراسة|student/.test(t);
  const out: string[] = [];
  if (gaming) out.push("الألعاب");
  if (creator) out.push("التصميم والمونتاج");
  if (office) out.push("العمل والدراسة");
  if (!out.length) out.push("الاستخدام اليومي");
  return out;
}
function performanceScore(l: Laptop) { return textScore(`${l.cpu || ""} ${l.gpu || ""}`) + ramScore(l.ram) + storageScore(l.storage) + screenScore(`${l.screen_resolution || ""} ${l.screen_size || ""}`); }

const dimensions: Dimension[] = [
  { key: "cpu", label: "المعالج", value: l => l.cpu || "غير مذكور", score: l => textScore(l.cpu), explain: l => `المعالج ${l.cpu || "غير مذكور"} هو العامل الأساسي بسرعة تنفيذ البرامج وتعدد المهام. هذا الجهاز متفوق هنا بحسب التقييم التقريبي، لذلك هو الأنسب إذا كان هدفك سرعة العمل اليومية أو البرامج الثقيلة.` },
  { key: "gpu", label: "كرت الشاشة", value: l => l.gpu || "غير مذكور", score: l => textScore(l.gpu), explain: l => `كرت الشاشة ${l.gpu || "غير مذكور"} يؤثر مباشرة على الألعاب، المونتاج والتصميم ثلاثي الأبعاد. الجهاز المتفوق هنا هو الخيار الأقوى لهذه الاستخدامات.` },
  { key: "ram", label: "الرام", value: l => l.ram || "غير مذكور", score: l => ramScore(l.ram), explain: l => `${l.ram || "غير مذكور"} يعطي مساحة أكبر لتعدد المهام وفتح البرامج معاً. إذا كنت تستخدم المتصفح وبرامج الدراسة أو العمل الثقيلة بنفس الوقت، فهذه النقطة مهمة.` },
  { key: "storage", label: "التخزين", value: l => l.storage || "غير مذكور", score: l => storageScore(l.storage), explain: l => `${l.storage || "غير مذكور"} يحدد مساحة ملفاتك وسرعة الإقلاع وتشغيل البرامج بحسب نوع القرص. الأفضل عملياً هو الجمع بين مساحة كافية وSSD/NVMe سريع.` },
  { key: "screen", label: "الشاشة", value: l => [l.screen_size, l.screen_resolution].filter(Boolean).join(" • ") || "غير مذكور", score: l => screenScore(`${l.screen_resolution || ""} ${l.screen_size || ""}`), explain: l => `${[l.screen_size, l.screen_resolution].filter(Boolean).join(" • ") || "مواصفات الشاشة غير مذكورة"}. الدقة ومعدل التحديث وحجم الشاشة يفرقون بالراحة اليومية، الألعاب والتصميم.` },
  { key: "battery", label: "البطارية", value: l => l.battery_health || "غير مذكور", score: l => { const n = Number((String(l.battery_health || "").match(/\d+/) || [0])[0]); return n; }, explain: l => `حالة البطارية المسجلة: ${l.battery_health || "غير مذكورة"}. كلما كانت الحالة أفضل، كان الجهاز أريح للاستخدام خارج الشاحن.` },
];

function winnerFor(d: Dimension, laptops: Laptop[]) { return [...laptops].sort((a, b) => d.score(b) - d.score(a))[0]; }
function priceValueScore(l: Laptop) { return performanceScore(l) / Math.max(1, Number(l.price) || 1); }

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids = "" } = await searchParams;
  const numbers = ids.split(",").map(Number).filter(Boolean).slice(0, 3);
  const { data } = numbers.length ? await supabase.from("laptops").select("*").in("id", numbers) : { data: [] as Laptop[] };
  const laptops = ((data || []) as Laptop[]).filter(l => Boolean(l.images?.[0]));
  const bestPerformance = [...laptops].sort((a, b) => performanceScore(b) - performanceScore(a))[0];
  const bestValue = [...laptops].sort((a, b) => priceValueScore(b) - priceValueScore(a))[0];

  return <><Header /><main className="compare-store-page" dir="rtl">
    <div className="section-breadcrumb"><Link href="/">الرئيسية</Link><span>»</span><Link href="/laptops">اللابتوبات</Link><span>»</span><strong>المقارنة</strong></div>
    <section className="compare-head"><div><span>SMART COMPARISON</span><h1>مين الأفضل؟</h1><p>هلق المقارنة ما عادت مجرد جدول مواصفات: رح تشوف الفرق، مين متفوق بكل نقطة، وشو الاستخدام الأنسب لكل جهاز.</p></div><Link href="/laptops">اختيار أجهزة ثانية ←</Link></section>
    {laptops.length ? <>
      <section className="compare-winner-panel">
        <div><span>🏆 الأفضل إجمالاً</span><h2>{bestPerformance?.name}</h2><p>{bestPerformance ? `أعلى نتيجة أداء بين الأجهزة المختارة (${performanceScore(bestPerformance)} نقطة تقريبية).` : ""}</p></div>
        {bestValue && <div className="compare-value-box"><b>💰 الأفضل مقابل السعر</b><strong>{bestValue.name}</strong><small>ترتيب تقريبي يجمع الأداء مع سعر الجهاز.</small></div>}
      </section>
      <section className="compare-detailed-grid">
        {laptops.map(l => <article key={l.id} className={`compare-detailed-card ${bestPerformance?.id === l.id ? "is-best" : ""}`}>
          <div className="compare-detailed-top"><div className="compare-detailed-image">{l.images?.[0] ? <img src={l.images[0]} alt={l.name} /> : <span>BK</span>}</div><div><span className="compare-brand">{l.brand || "BKKARI TECH"}</span><h2>{l.name}</h2><strong className="compare-big-price">${Number(l.price).toFixed(0)}</strong></div></div>
          <div className="compare-fit"><b>مناسب لـ:</b>{usage(l).map(x => <span key={x}>{x}</span>)}</div>
          <div className="compare-mini-score"><span>الأداء التقريبي</span><b>{Math.min(100, performanceScore(l) * 2)} / 100</b></div><div className="compare-card-summary"><b>شو مناسب له؟</b><p>{usage(l).join("، ")}. إذا كانت أولويتك الأداء الخام، قارن المعالج وكرت الشاشة أولاً؛ وإذا كانت الحركة اليومية أهم، راقب البطارية والشاشة.</p></div>
          <div className="compare-points">{dimensions.map(d => { const winner = winnerFor(d, laptops); const isWinner = winner?.id === l.id; return <div key={d.key} className={isWinner ? "winner" : ""}><div><span>{d.label}</span><b>{d.value(l)}</b></div>{isWinner && <em>✓ الأفضل هنا</em>}</div>; })}</div>
        </article>)}
      </section>
      <section className="compare-difference"><div className="compare-section-label">الفرق بالتفصيل</div><h2>وين كل جهاز بيتفوّق؟</h2><div className="compare-difference-list">{dimensions.map(d => { const winner = winnerFor(d, laptops); return <article key={d.key}><span>{d.label}</span><div><b>الأفضل: {winner?.name}</b><p>{winner ? d.explain(winner) : ""}</p></div></article>; })}</div></section>
      <section className="compare-final"><span>الخلاصة</span><h2>{bestPerformance?.name} هو الأقوى إجمالاً، لكن مو بالضرورة هو الأفضل لكل شخص.</h2><p>إذا أولويتك الألعاب والتصميم، ركّز على كرت الشاشة والمعالج. للعمل والدراسة، الرام والتخزين والبطارية قد تكون أهم. لذلك النتيجة النهائية تعتمد على استخدامك وسعرك المستهدف.</p></section>
    </> : <div className="unified-empty">اختار جهازين أو ثلاثة من صفحة اللابتوبات حتى نخبرك أيهم الأفضل ونوضح الفرق بينهم.</div>}
  </main><Footer /></>;
}
