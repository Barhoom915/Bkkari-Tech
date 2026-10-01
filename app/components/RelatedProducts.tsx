import Link from "next/link";
import type { Laptop } from "@/app/lib/types";
import LaptopArtwork from "./LaptopArtwork";

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
          <Link key={p.id} href={`/laptops/${p.id}`} className="related-product-card">
            <div className="related-product-media">
              {p.images?.[0] ? <img src={p.images[0]} alt={p.name} loading="lazy" decoding="async" /> : <LaptopArtwork brand={p.brand} category={p.category} />}
              {(p.is_offer || (p.prev_price != null && Number(p.prev_price) > Number(p.price))) && <b>عرض</b>}
            </div>
            <div className="related-product-body">
              <small>{p.brand || "NOVATEK"}</small>
              <h3>{p.name}</h3>
              <p>{[p.cpu, p.ram, p.storage].filter(Boolean).join(" · ")}</p>
              <strong>${Number(p.price).toFixed(0)}</strong>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
