import Link from "next/link";
import { syriaMarket } from "@/app/lib/syrimarket";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = Record<string, unknown>;

function objectRows(value: unknown, depth = 0): Row[] {
  if (depth > 3 || value == null) return [];
  if (Array.isArray(value)) return value.filter((x): x is Row => !!x && typeof x === "object" && !Array.isArray(x));
  if (typeof value !== "object") return [];
  const obj = value as Row;
  for (const key of ["products", "items", "data", "results", "catalog", "categories"]) {
    const nested = obj[key];
    if (Array.isArray(nested)) return objectRows(nested, depth + 1);
    if (nested && typeof nested === "object") {
      const found = objectRows(nested, depth + 1);
      if (found.length) return found;
    }
  }
  return [];
}

function stringValue(row: Row, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function moneyValue(row: Row) {
  const amount = stringValue(row, ["price", "amount", "selling_price", "final_price", "cost", "total"]);
  const currency = stringValue(row, ["currency_symbol", "currency", "currency_code"]);
  if (!amount) return "";
  return currency ? `${amount} ${currency}` : amount;
}

export default async function SyriMarketCatalogPage() {
  let products: Row[] = [];
  let error = false;
  try {
    const payload = await syriaMarket.getProducts();
    products = objectRows(payload);
  } catch (e) {
    error = true;
    console.error("SyriMarket storefront catalog failed", e instanceof Error ? e.name : "UnknownError");
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14" dir="rtl">
        <div className="mb-6 flex items-center gap-2 text-sm text-ink-soft">
          <Link href="/">الرئيسية</Link><span>»</span><Link href="/services">الخدمات الرقمية</Link><span>»</span><strong>SyriMarket</strong>
        </div>
        <section className="rounded-3xl border border-line bg-surface p-6 sm:p-10">
          <span className="text-xs font-bold tracking-widest text-blue">NOVATEK / SYRIMARKET</span>
          <h1 className="mt-3 text-3xl font-extrabold text-ink">كتالوج SyriMarket</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">عرض تجريبي للمنتجات القادمة من المزود. الأسعار والخيارات النهائية تحتاج مطابقة مع مخطط SyriMarket الرسمي قبل تفعيل الطلب.</p>
        </section>

        {error ? (
          <div className="mt-8 rounded-2xl border border-dashed border-line p-8 text-center text-sm text-ink-soft">كتالوج SyriMarket غير متاح حالياً. جرّب لاحقاً.</div>
        ) : products.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-line p-8 text-center text-sm text-ink-soft">اتصلنا بالكتالوج، لكن ما قدرنا نحدد قائمة منتجات من شكل البيانات الحالي. يلزم مطابقة مخطط استجابة المزود.</div>
        ) : (
          <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => {
              const name = stringValue(product, ["name", "title", "product_name", "label", "service_name"]) || `منتج SyriMarket ${index + 1}`;
              const id = stringValue(product, ["id", "product_id", "sku", "code"]);
              const price = moneyValue(product);
              const description = stringValue(product, ["description", "details", "summary"]);
              return (
                <article key={id || `${name}-${index}`} className="flex flex-col rounded-2xl border border-line bg-white p-5 shadow-sm">
                  <h2 className="font-bold text-ink">{name}</h2>
                  {description ? <p className="mt-2 text-sm leading-6 text-ink-soft">{description}</p> : null}
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <span className="text-lg font-extrabold text-ink">{price || "السعر قيد التحقق"}</span>
                    <span className="text-xs text-ink-soft">{id ? `معرّف: ${id}` : "SyriMarket"}</span>
                  </div>
                  <p className="mt-4 rounded-xl bg-surface p-3 text-xs leading-5 text-ink-soft">الطلب غير مفعّل بعد؛ سيتم تفعيله بعد التحقق من التسعير والتوقيع وخيارات المنتج.</p>
                </article>
              );
            })}
          </section>
        )}
        <div className="mt-8"><Link href="/services" className="font-bold text-blue">← رجوع للخدمات الرقمية</Link></div>
      </main>
      <Footer />
    </>
  );
}
