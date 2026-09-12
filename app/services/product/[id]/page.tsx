import Link from "next/link";
import { notFound } from "next/navigation";
import { satofill } from "@/app/lib/satofill";
import type { SatofillProduct } from "@/app/lib/satofill";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import DigitalServiceOrder from "@/app/components/DigitalServiceOrder";
import { applyDigitalOverride, getDigitalOverrides, getGroupOverrides } from "@/app/lib/digital-overrides";
import { getChatMarkupPercent } from "@/app/lib/site-settings";
import { getSatoFillStorePrice, isSatoFillBlocked, isSatoFillChatProduct } from "@/app/lib/satofill";
import ProductArtwork from "@/app/components/ProductArtwork";

function isAllowed(value: string | undefined) {
  return !isSatoFillBlocked(value);
}

function ProductImage({ product }: { product: SatofillProduct }) {
  return <ProductArtwork product={product} />;
}

export default async function DigitalProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await satofill.getProduct(id).catch((err) => {
    console.error("SatoFill product fetch failed:", err);
    return null;
  });

  if (!product) notFound();
  const [overrides, groupOverrides, chatMarkupPercent] = await Promise.all([getDigitalOverrides(), getGroupOverrides(), getChatMarkupPercent()]);
  const custom = overrides.get(String(product.id));
  if (custom?.is_active === false) notFound();
  const displayProduct = applyDigitalOverride(product, custom, groupOverrides);
  if (!isAllowed(`${displayProduct.name} ${(displayProduct.categories ?? []).join(" ")}`)) notFound();

  const productId = String(displayProduct.id);
  const canAddToCart = productId.length > 0;
  const chatProduct = isSatoFillChatProduct(displayProduct);
  const price = Number(getSatoFillStorePrice(displayProduct.price, chatProduct, chatMarkupPercent));
  const available = product.available !== false;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14" dir="rtl">
        <Link href="/services" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft transition hover:text-blue">
          → كل الخدمات الرقمية
        </Link>

        <section className="mt-5 grid gap-7 rounded-[2rem] border border-line bg-white p-5 shadow-sm sm:p-7 lg:grid-cols-2">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-3xl bg-surface">
            <ProductImage product={displayProduct} />
          </div>

          <div className="flex flex-col justify-center py-2">
            <div className="flex flex-wrap gap-2">
              {(displayProduct.categories ?? []).filter(isAllowed).map((category) => (
                <span key={category} className="rounded-full bg-blue/10 px-3 py-1 text-xs font-semibold text-blue">
                  {category}
                </span>
              ))}
            </div>

            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{displayProduct.name}</h1>
            <p className="mt-3 text-sm leading-7 text-ink-soft">
              {String((displayProduct as any).custom_store_description || "الخدمة متوفرة حالياً. أدخل الـID المطلوب وتأكد منه ثم أكد الطلب مباشرة بدون سلة.")}
            </p>

            <div className="mt-6 rounded-2xl border border-line bg-surface p-4">
              <p className="text-xs text-ink-soft">السعر</p>
              <p className="mt-1 text-3xl font-extrabold text-ink">
                {displayProduct.currency_symbol ?? "$"}{getSatoFillStorePrice(displayProduct.price, chatProduct, chatMarkupPercent)}
              </p>
            </div>

            <div className="mt-5">
              {canAddToCart && Number.isFinite(price) && available ? (
                <DigitalServiceOrder product={{id: productId,name: displayProduct.name,price,currencySymbol: displayProduct.currency_symbol ?? "$",minQuantity: product.min_quantity ?? 1,maxQuantity: product.max_quantity ?? 1,customFields: product.custom_fields ?? []}} />
              ) : (
                <div className="rounded-2xl border border-dashed border-line bg-surface p-4 text-center text-sm text-ink-soft">{available ? "هالخدمة ما إلها طلب مباشر حالياً." : "هالخدمة غير متوفرة حالياً."}</div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
