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
      <main className="laptops-v18-page unified-page" dir="rtl">
        <div className="section-breadcrumb"><Link href="/">الرئيسية</Link><span>»</span><strong>الخدمات الرقمية</strong></div>
        <section className="laptop-hero-v18 unified-hero digital-unified-hero">
          <div><span>BKKARI TECH / DIGITAL</span><h1>كل الخدمات الرقمية بمكان واحد.</h1><p>اختار القسم، وشوف الخدمات بنفس أسلوب بطاقات اللابتوبات: صورة، اسم، وصف، وعدد الخدمات.</p></div>
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
          <section className="laptop-page-wrap unified-catalog digital-unified-catalog">
            <div className="unified-section-heading"><div><span>DIGITAL CATALOG</span><h2>اختار القسم</h2><p>كل الأقسام والخدمات الرقمية مرتبة بنفس نظام المتجر.</p></div><strong>{categories.length} أقسام</strong></div>
            <div className="unified-category-grid">
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
                    className="unified-category-card"
                  >
                    <div className="unified-category-image"><CategoryArtwork category={category} /></div><div className="unified-category-body">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-bold text-ink transition-colors group-hover:text-blue">
                          {category.name}
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-ink-soft">
                          {category.description || "خدمات رقمية متوفرة للطلب بشكل مباشر"}
                        </p>
                      </div>
                      
                    </div>

                    <div className="unified-category-meta">
                      {subCount > 0 && (
                        <span className="unified-meta-pill primary">
                          {subCount} تصنيفات فرعية
                        </span>
                      )}
                      <span className="unified-meta-pill">
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
