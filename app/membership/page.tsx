import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "عضويات NOVATEK | مزايا ومكافآت",
  description: "اكتشف عضويات NOVATEK ومزايا المقارنات الذكية والكوبونات ونقاط الولاء والعروض.",
};

const benefits = [
  { icon: "◈", title: "مقارنات أكثر وأذكى", text: "قارن الأجهزة جنباً إلى جنب، وافهم فرق الأداء والسعر واختر حسب ميزانيتك واستخدامك." },
  { icon: "✦", title: "محادثات المساعد", text: "مساعدة لاختيار المنتجات وفهم المواصفات، ضمن حدود الاستخدام الخاصة بكل خطة." },
  { icon: "％", title: "كوبونات أسبوعية", text: "عروض للأعضاء تتغير حسب الحملات الفعالة وشروط كل كوبون." },
  { icon: "↗", title: "عروض على الاشتراك", text: "خطط لإطلاق خصومات أول اشتراك والتجديد والاشتراك السنوي عند تفعيلها." },
  { icon: "☆", title: "نقاط الولاء", text: "اجمع نقاطاً على المشتريات المؤهلة واستبدلها بمكافآت وفق الشروط التي ستُعلن." },
  { icon: "♡", title: "المفضلة والتنبيهات", text: "تابع الأجهزة التي تهمك واستكشف إمكانية تنبيهات السعر وتوفر المخزون." },
];

const plans = [
  { name: "مجاني", subtitle: "للبداية واكتشاف الخدمة", accent: "border-slate-300", price: "مجاني", items: ["30 رسالة يومياً", "مقارنات أساسية", "تصفح العروض المتاحة"] },
  { name: "Plus", subtitle: "مزايا أكثر للاستخدام اليومي", accent: "border-orange-400", price: "سيُعلن لاحقاً", items: ["حدود استخدام أعلى", "مقارنات أكثر", "كوبونات ومكافآت للأعضاء"], featured: true },
  { name: "Pro", subtitle: "لمن يحتاج أدوات أوسع", accent: "border-sky-500", price: "سيُعلن لاحقاً", items: ["حدود أعلى حسب الخطة", "مقارنات موسعة", "عروض ونقاط بمزايا إضافية"] },
  { name: "Elite", subtitle: "تجربة العضوية الأوسع", accent: "border-violet-500", price: "سيُعلن لاحقاً", items: ["أعلى حدود ضمن الخطة", "أوسع خيارات المقارنة", "مزايا ومكافآت مميزة"] },
];

export default function MembershipPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 text-slate-900">
      <section aria-labelledby="elite-trial-title" className="mx-auto max-w-5xl px-5 pt-8 sm:px-8 sm:pt-10">
        <div className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-sm font-extrabold text-orange-600">عرض للحسابات الجديدة المؤهلة</p>
          <h2 id="elite-trial-title" className="mt-2 text-2xl font-black sm:text-3xl">جرّب NOVATEK Elite مجاناً لمدة 7 أيام</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">استمتع بمزايا عضوية Elite لمدة 7 أيام مجاناً، ضمن فترة العرض وللحسابات الجديدة المؤهلة.</p>
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-800">
            <input type="checkbox" name="elite-trial-terms-consent" className="mt-1 h-4 w-4 shrink-0 accent-orange-500" />
            <span>أوافق على شروط العرض.</span>
          </label>
        </div>
      </section>
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_15%_50%,rgba(249,115,22,0.22),transparent_42%),radial-gradient(ellipse_at_85%_20%,rgba(37,99,235,0.18),transparent_35%)]" />
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div>
            <span className="inline-flex rounded-full border border-orange-400/40 bg-orange-400/10 px-4 py-2 text-sm font-bold text-orange-300">NOVATEK MEMBERSHIP</span>
            <h1 className="mt-6 max-w-2xl text-4xl font-black leading-tight sm:text-6xl">تجربة أذكى، <span className="text-orange-400">ومزايا أكثر.</span></h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">قارن اللابتوبات بثقة، استفد من العروض، اجمع نقاط الولاء، واكتشف الخطة المناسبة لطريقتك في استخدام المتجر.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#plans" className="rounded-xl bg-orange-500 px-6 py-3.5 font-extrabold text-slate-950 transition hover:bg-orange-400">استكشف الخطط</a>
              <a href="#benefits" className="rounded-xl border border-white/20 px-6 py-3.5 font-bold text-white transition hover:bg-white/10">شوف المزايا</a>
            </div>
            <p className="mt-4 text-xs leading-6 text-slate-400">الخطط المدفوعة والعروض قيد التجهيز؛ الأسعار والدفع غير مفعّلين حالياً.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[["⌕","مقارنات أذكى"],["％","كوبونات أسبوعية"],["☆","نقاط ومكافآت"],["♧","عروض للأعضاء"]].map(([icon,label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur sm:p-7">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-500/15 text-2xl text-orange-300">{icon}</span>
                <p className="mt-4 font-extrabold sm:text-lg">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="benefits" className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-extrabold text-orange-600">ليش تنضم؟</p>
          <h2 className="mt-2 text-3xl font-black sm:text-4xl">كل مزاياك بمكان واحد</h2>
          <p className="mt-3 leading-7 text-slate-600">من اختيار الجهاز المناسب إلى الاستفادة من العروض والمكافآت، بتكون تفاصيل عضويتك واضحة قدامك.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <article key={benefit.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-orange-50 text-2xl font-bold text-orange-600">{benefit.icon}</span>
              <h3 className="mt-4 text-lg font-extrabold">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{benefit.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="plans" className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="text-sm font-extrabold text-orange-600">اختار تجربتك</p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">خطط العضوية</h2>
            <p className="mt-3 leading-7 text-slate-600">التقسيم مبدئي لتوضيح التجربة؛ سيتم اعتماد الأسعار والحدود النهائية قبل تفعيل الاشتراكات.</p>
          </div>
          <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <article key={plan.name} className={`relative flex flex-col rounded-2xl border-2 ${plan.accent} bg-white p-5 shadow-sm ${plan.featured ? "shadow-xl shadow-orange-100 ring-2 ring-orange-100" : ""}`}>
                {plan.featured && <span className="absolute -top-3 right-5 rounded-full bg-orange-500 px-3 py-1 text-xs font-extrabold text-white">خيار مقترح</span>}
                <h3 className="text-2xl font-black">{plan.name}</h3>
                <p className="mt-1 min-h-12 text-sm leading-6 text-slate-500">{plan.subtitle}</p>
                <p className="mt-4 text-lg font-extrabold">{plan.price}</p>
                <ul className="mt-5 flex-1 space-y-3 border-t border-slate-100 pt-5 text-sm leading-6 text-slate-700">
                  {plan.items.map((item) => <li key={item} className="flex gap-2"><span className="font-black text-orange-500">✓</span><span>{item}</span></li>)}
                </ul>
                <Link href="/account" className={`mt-6 block rounded-xl px-4 py-3 text-center text-sm font-extrabold transition ${plan.featured ? "bg-orange-500 text-slate-950 hover:bg-orange-400" : "bg-slate-100 text-slate-800 hover:bg-slate-200"}`}>
                  {plan.name === "مجاني" ? "ابدأ مجاناً" : "قريباً"}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14 text-center sm:px-8">
        <div className="rounded-3xl bg-slate-950 px-6 py-10 text-white sm:px-12 sm:py-14">
          <p className="text-sm font-bold text-orange-300">NOVATEK</p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">مزايا أكثر. اختيارات أوضح.</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-300">تفاصيل الأسعار، المكافآت، وحدود كل خطة ستظهر بوضوح قبل إطلاق الاشتراكات.</p>
          <Link href="/" className="mt-7 inline-flex rounded-xl bg-orange-500 px-6 py-3 font-extrabold text-slate-950 transition hover:bg-orange-400">العودة إلى المتجر</Link>
        </div>
      </section>
    </main>
  );
}
