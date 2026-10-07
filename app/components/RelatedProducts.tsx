import Link from "next/link";
import type { Laptop } from "@/app/lib/types";
import LaptopArtwork from "./LaptopArtwork";
import FavoriteButton from "./FavoriteButton";

export default function RelatedProducts({ products }: { products: Laptop[] }) {
  if (!products.length) return null;

  return (
    <section className="related-products-section" dir="rtl">
      <div className="related-products-head">
        <div>
          <span>YOU MAY ALSO LIKE</span>
          <h2>منتجات ممكن تعجبك</h2>
          <p>اقتراحات قريبة من المنتج اللي عم تشوفه.</p>
        </div>
        <Link href="/laptops">عرض كل اللابتوبات ←</Link>
      </div>

      <div className="related-products-grid">
        {products.map((p) => (
          <article key={p.id} className="pl-product-card related-pl-card">
            <div className="pl-product-media">
              <Link href={`/laptops/${p.id}`} prefetch className="pl-product-image-link">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} loading="lazy" decoding="async" />
                ) : (
                  <LaptopArtwork brand={p.brand} category={p.category} />
                )}
              </Link>
              <span className="pl-brand-tag">{p.brand || "NOVATEK"}</span>
              <FavoriteButton laptopId={p.id} />
              {(p.is_offer || (p.prev_price != null && Number(p.prev_price) > Number(p.price))) && (
                <b className="pl-sale">عرض</b>
              )}
            </div>
            <div className="pl-product-body">
              <Link href={`/laptops/${p.id}`} prefetch>
                <h3>{p.name}</h3>
              </Link>
              <p>{[p.cpu, p.ram, p.storage].filter(Boolean).join(" · ")}</p>
              <div className="pl-price">
                <strong>${Number(p.price).toFixed(0)}</strong>
                {p.prev_price && <del>${Number(p.prev_price).toFixed(0)}</del>}
              </div>
              <Link href={`/laptops/${p.id}`} prefetch className="pl-add">
                عرض المنتج
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
