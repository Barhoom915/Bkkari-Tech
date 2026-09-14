import { notFound } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import type { Laptop } from "@/app/lib/types";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import ProductActions from "./ProductActions";
import Reviews from "./Reviews";
import ProductGallery from "./ProductGallery";

async function getLaptop(id: string): Promise<Laptop | null> {
  const { data, error } = await supabase
    .from("laptops")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

const specLabels: [keyof Laptop, string][] = [
  ["brand", "الشركة"],
  ["model", "الموديل"],
  ["cpu", "المعالج"],
  ["ram", "الذاكرة RAM"],
  ["storage", "التخزين"],
  ["gpu", "كرت الشاشة"],
  ["screen_size", "حجم الشاشة"],
  ["screen_resolution", "دقة الشاشة"],
  ["condition", "حالة الجهاز"],
  ["battery_health", "حالة البطارية"],
];

const giftLabels: [keyof Laptop, string, string][] = [
  ["gift_box", "📦", "كرتونة الجهاز"],
  ["gift_mouse", "🖱️", "ماوس هدية"],
  ["gift_bag", "🎒", "حقيبة لابتوب هدية"],
  ["gift_software_pack", "💻", "بكج البرامج الأساسية"],
];

export default async function LaptopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const laptop = await getLaptop(id);

  if (!laptop) notFound();

  const gifts = giftLabels.filter(([key]) => laptop[key]);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <ProductGallery images={laptop.images ?? []} name={laptop.name} brand={laptop.brand} category={laptop.category} />

          <div>
            <h1 className="text-xl font-bold text-ink sm:text-2xl">{laptop.name}</h1>

            {laptop.warranty_days ? (
              <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-orange-soft px-3 py-1 text-xs font-medium text-orange">
                🛡️ ضمان {laptop.warranty_days} يوم
              </span>
            ) : null}

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl font-bold text-ink">${laptop.price}</span>
              {laptop.prev_price && (
                <span className="text-base text-ink-soft/60 line-through">${laptop.prev_price}</span>
              )}
            </div>

            {laptop.description && (
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">{laptop.description}</p>
            )}

            <div className="mt-5 divide-y divide-line rounded-xl border border-line bg-card">
              {specLabels
                .filter(([key]) => laptop[key])
                .map(([key, label]) => (
                  <div key={key} className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-ink-soft">{label}</span>
                    <span className="font-mono-data text-ink">{String(laptop[key])}</span>
                  </div>
                ))}
            </div>

            {gifts.length > 0 && (
              <div className="mt-4 rounded-xl border border-orange/20 bg-orange-soft p-4">
                <p className="mb-2 text-sm font-medium text-orange">🎁 هدايا مع هالجهاز</p>
                <div className="flex flex-wrap gap-2">
                  {gifts.map(([key, icon, label]) => (
                    <span key={key} className="rounded-full bg-surface px-3 py-1 text-xs text-ink">
                      {icon} {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {laptop.features?.length > 0 && (
              <ul className="mt-4 space-y-1.5 text-sm text-ink-soft">
                {laptop.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
            )}

            <div className="product-delivery-card">
              <div><span>🚚</span><div><b>التوصيل والشحن</b><p>توصيل لباب المنزل وشحن للمحافظات حسب المحافظة. التفاصيل وتكلفة الشحن متاحة من صفحة التوصيل.</p></div></div>
              <a href="/delivery">تفاصيل الشحن ←</a>
            </div>

            <div className="mt-6">
              <ProductActions laptop={laptop} />
            </div>
          </div>
        </div>

        <Reviews laptopId={laptop.id} />
      </main>
      <Footer />
    </>
  );
}
