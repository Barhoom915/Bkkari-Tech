import Reveal from "./motion/Reveal";

const gifts = [
  { label: "كرتونة الجهاز", icon: "📦" },
  { label: "ماوس هدية", icon: "🖱️" },
  { label: "حقيبة لابتوب هدية", icon: "🎒" },
  { label: "بكج البرامج الأساسية", icon: "💻" },
];

const delivery = [
  {
    title: "توصيل لباب المنزل",
    desc: "بوصلك الجهاز مباشرة عالعنوان يلي بتحدده، بدون ما تطلع من البيت.",
    icon: "🚚",
  },
  {
    title: "شحن لكل المحافظات",
    desc: "بغطي كل المحافظات السورية — تكلفة الشحن بتختلف حسب المحافظة.",
    icon: "📦",
  },
];

export default function GiftsAndDelivery() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal className="rounded-2xl border border-orange/20 bg-orange-soft p-6 sm:p-8">
          <h2 className="text-xl font-bold text-ink">🎁 هدايا مع بعض الأجهزة</h2>
          <p className="mt-2 text-sm text-ink-soft">
            بعض اللابتوبات بتجيك مع هدايا إضافية بدون أي تكلفة زيادة
          </p>
          <ul className="mt-5 grid grid-cols-2 gap-3">
            {gifts.map((g) => (
              <li key={g.label} className="flex items-center gap-2 rounded-xl bg-surface px-3 py-3 text-sm text-ink">
                <span className="text-lg">{g.icon}</span>
                {g.label}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.15} className="rounded-2xl border border-line bg-card p-6 sm:p-8">
          <h2 className="text-xl font-bold text-ink">التوصيل والشحن</h2>
          <p className="mt-2 text-sm text-ink-soft">
            المتجر رقمي بالكامل وما إلنا محل فعلي — بس هيك منوصلك أينما كنت
          </p>
          <ul className="mt-5 space-y-4">
            {delivery.map((d) => (
              <li key={d.title} className="flex items-start gap-3">
                <span className="text-xl">{d.icon}</span>
                <div>
                  <p className="font-semibold text-ink">{d.title}</p>
                  <p className="mt-1 text-sm text-ink-soft">{d.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
