import Link from "next/link";
import { satofill } from "@/app/lib/satofill";
import type { SatofillCategory } from "@/app/lib/satofill";
import { isSatoFillBlocked } from "@/app/lib/satofill";
import { getDigitalCategoryOrder, sortByOrder } from "@/app/lib/site-settings";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import CategoryArtwork from "@/app/components/CategoryArtwork";

function isAllowedCategory(category: SatofillCategory) {
  return !isSatoFillBlocked(`${category.name} ${category.slug ?? ""} ${category.description ?? ""}`);
}

async function getCategories(): Promise<{ categories: SatofillCategory[]; error: string | null }> {
  try {
    const [categories, order] = await Promise.all([satofill.getCategories(), getDigitalCategoryOrder()]);
    const allowed = categories.filter(isAllowedCategory);
    return { categories: sortByOrder(allowed, order), error: null };
  } catch (err) {
    console.error("categories fetch failed:", err);
    return { categories: [], error: "الأقسام الرقمية مش متوفرة حالياً، جرب بعد شوي" };
  }
}

export default async function DigitalServicesPage() {
  const { categories, error } = await getCategories();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14" dir="rtl">
        <section className="relative overflow-hidden rounded-[2rem] border border-line bg-surface px-6 py-9 sm:px-10">
          <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-blue/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-orange/10 blur-3xl" />
          <div className="relative">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue/15 bg-white px-3 py-1 text-xs font-semibold text-blue">
              <span className="h-2 w-2 rounded-full bg-blue" />
              خدمات رقمية فورية
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              الخدمات الرقمية
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft sm:text-base">
              اختار القسم اللي بدك ياه، وبعدها تصفّح التصنيفات والخدمات المتوفرة مباشرة.
            </p>
          </div>
        </section>

        {error ? (
          <div className="mt-8 rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-sm text-ink-soft">
            {error}
          </div>
        ) : categories.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-sm text-ink-soft">
            لسا ما في أقسام رقمية متوفرة.
          </div>
        ) : (
          <section className="mt-9">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-ink">تصفّح حسب القسم</h2>
                <p className="mt-1 text-sm text-ink-soft">تصفّح الأقسام واختار الخدمة يلي بتحتاجها.</p>
              </div>
              <span className="hidden rounded-full bg-surface px-3 py-1 text-xs font-semibold text-ink-soft sm:block">
                {categories.length} أقسام
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => {
                const countProducts = (item: SatofillCategory): number =>
                  (item.direct_products_count ?? 0) + (item.subcategories ?? []).reduce((sum, sub) => sum + countProducts(sub), 0);
                const productCount = category.direct_products_count ?? 0;
                const subCount = category.subcategories_count ?? category.subcategories?.length ?? 0;
                const totalCount = countProducts(category);

                return (
                  <Link
                    key={category.id}
                    href={`/services/${category.slug ?? String(category.id)}`}
                    className="group rounded-3xl border border-line bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue/30 hover:shadow-xl hover:shadow-blue/5"
                  >
                    <div className="flex items-start gap-4">
                      <CategoryArtwork category={category} />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-bold text-ink transition-colors group-hover:text-blue">
                          {category.name}
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-ink-soft">
                          {category.description || "خدمات رقمية متوفرة للطلب بشكل مباشر"}
                        </p>
                      </div>
                      <span className="text-xl text-ink-soft transition-transform group-hover:-translate-x-1">←</span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2 text-xs">
                      {subCount > 0 && (
                        <span className="rounded-full bg-blue/10 px-3 py-1.5 font-semibold text-blue">
                          {subCount} تصنيفات فرعية
                        </span>
                      )}
                      <span className="rounded-full bg-surface px-3 py-1.5 font-semibold text-ink-soft">
                        {totalCount || productCount} خدمة
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
