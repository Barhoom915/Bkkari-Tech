import Link from "next/link";
import { notFound } from "next/navigation";
import { satofill } from "@/app/lib/satofill";
import type { SatofillCategory, SatofillProduct } from "@/app/lib/satofill";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import CategoryArtwork from "@/app/components/CategoryArtwork";
import ProductArtwork from "@/app/components/ProductArtwork";
import { applyDigitalOverride, getDigitalOverrides, getGroupOverrides, groupKeyFor } from "@/app/lib/digital-overrides";
import { getChatMarkupPercent } from "@/app/lib/site-settings";
import { getSatoFillStorePrice, isSatoFillBlocked, isSatoFillChatProduct } from "@/app/lib/satofill";

function isAllowed(value: string | undefined) {
  return !isSatoFillBlocked(value);
}

function filterSubcategories(categories: SatofillCategory[]): SatofillCategory[] {
  return categories
    .filter((category) => isAllowed(`${category.name} ${category.slug ?? ""}`))
    .map((category) => ({ ...category, subcategories: filterSubcategories(category.subcategories ?? []) }));
}

function ProductCard({ product, chatMarkupPercent }: { product: SatofillProduct; chatMarkupPercent: number }) {
  const available = product.available !== false;
  const chatProduct = isSatoFillChatProduct(product);
  const storePrice = getSatoFillStorePrice(product.price, chatProduct, chatMarkupPercent);
  return (
    <Link
      href={`/services/product/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue/30 hover:shadow-xl hover:shadow-blue/5"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-surface">
        <ProductArtwork product={product} />
        <span className={`absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold shadow-sm ${available ? "text-blue" : "text-ink-soft"}`}>
          {available ? "اطلب الآن" : "غير متوفر"}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-bold text-ink transition-colors group-hover:text-blue">{product.name}</h3>
        {product.categories?.length ? (
          <p className="mt-1 text-xs text-ink-soft">{product.categories.filter(isAllowed).join(" • ")}</p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <span className="text-xl font-extrabold text-ink">{product.currency_symbol ?? "$"}{storePrice}</span>
            {product.max_quantity && product.max_quantity > 1 && (
              <p className="mt-1 text-[11px] text-ink-soft">حتى {product.max_quantity} بالطلب</p>
            )}
          </div>
          <span className="text-sm font-bold text-blue transition-transform group-hover:-translate-x-1">التفاصيل ←</span>
        </div>
      </div>
    </Link>
  );
}

export default async function ServiceCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await satofill.getCategory(slug).catch((err) => {
    console.error("SatoFill category fetch failed:", err);
    return null;
  });

  if (!category || !isAllowed(`${category.name} ${category.slug ?? ""}`)) notFound();

  const subcategories = filterSubcategories(category.subcategories ?? []);
  const [overrides, groupOverrides, chatMarkupPercent] = await Promise.all([
    getDigitalOverrides(),
    getGroupOverrides(),
    getChatMarkupPercent(),
  ]);
  const products = (category.products ?? [])
    .map((product) => applyDigitalOverride(product, overrides.get(String(product.id)), groupOverrides))
    .filter((product) => isAllowed(`${product.name} ${(product.categories ?? []).join(" ")}`));

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14" dir="rtl">
        <Link href="/services" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft transition hover:text-blue">
          → كل الأقسام
        </Link>

        <section className="relative mt-5 overflow-hidden rounded-[2rem] border border-line bg-surface p-6 sm:p-8">
          <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-blue/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-orange/10 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl">
              <CategoryArtwork category={category} />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{category.name}</h1>
              <p className="mt-1 text-sm leading-6 text-ink-soft">
                {category.description || "اختار التصنيف المناسب وشوف الخدمات المتوفرة واطلبها مباشرة."}
              </p>
            </div>
          </div>
        </section>

        {subcategories.length > 0 && (
          <section className="mt-9">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-ink">التصنيفات الفرعية</h2>
                <p className="mt-1 text-sm text-ink-soft">اختار التصنيف حتى تشوف خدماته لحالها.</p>
              </div>
              <span className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-ink-soft">{subcategories.length}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/services/${sub.slug ?? String(sub.id)}`}
                  className="group flex items-center justify-between rounded-2xl border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-blue/30 hover:shadow-lg"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl">
                      <CategoryArtwork category={sub} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-ink group-hover:text-blue">{sub.name}</h3>
                      <p className="mt-1 text-xs text-ink-soft">{sub.direct_products_count ?? 0} خدمة مباشرة</p>
                    </div>
                  </div>
                  <span className="text-lg text-ink-soft transition-transform group-hover:-translate-x-1">←</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-ink">الخدمات المتوفرة مباشرة</h2>
              <p className="mt-1 text-sm text-ink-soft">اضغط على أي خدمة لتشوف التفاصيل والسعر وتدخل الـID وتأكد الطلب مباشرة.</p>
            </div>
            <span className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-ink-soft">{products.length} خدمة</span>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-sm text-ink-soft">
              ما في خدمات مباشرة ضمن هالقسم حالياً. إذا فيه تصنيفات فرعية، اختار التصنيف من فوق.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => <ProductCard key={product.id} product={product} chatMarkupPercent={chatMarkupPercent} />)}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
