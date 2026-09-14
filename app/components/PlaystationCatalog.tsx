"use client";
import { useMemo, useState } from "react";

import Link from "next/link";

export type PlaystationCatalogProduct = {
  id: number; name: string; family: "ps4" | "ps5";
  product_type?: "console" | "controller" | "accessory";
  model?: string | null; storage?: string | null; condition?: string | null;
  price: number; prev_price?: number | null; image?: string | null;
  details?: string | null; controller_connection?: string | null; included_options?: string[] | null; storage_options?: string[] | null; controller_count?: number | null; modification_status?: string | null; modification_types?: string[] | null; order_note?: string | null;
  stock_quantity: number; is_available: boolean; is_offer: boolean; is_featured: boolean;
};

type Filter = "all" | "ps4" | "ps5" | "ps4-controller" | "ps5-controller";

const defaultFilters: { key: Exclude<Filter,"all">; label: string; image: string }[] = [
  { key: "ps4", label: "PS4", image: "/catalog/ps4-circle.png" },
  { key: "ps5", label: "PS5", image: "/catalog/ps5-circle.png" },
  { key: "ps4-controller", label: "قبضة PS4", image: "/catalog/controller-ps4-circle.png" },
  { key: "ps5-controller", label: "قبضة PS5", image: "/catalog/controller-ps5-circle.png" },
];

export default function PlaystationCatalog({ products, filterImages = {} }: { products: PlaystationCatalogProduct[]; filterImages?: Record<string,string> }) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = useMemo(() => products.filter(p => {
    if (filter === "all") return true;
    if (filter === "ps4-controller") return p.family === "ps4" && p.product_type === "controller";
    if (filter === "ps5-controller") return p.family === "ps5" && p.product_type === "controller";
    return p.family === filter && p.product_type !== "controller";
  }), [products, filter]);

  const filters = defaultFilters.map(f => ({ ...f, image: filterImages[f.key] || f.image }));

  return <div className="unified-catalog">
    <section className="unified-brand-section">
      <div className="unified-section-heading"><div><span>PLAYSTATION</span><h2>اختار الفئة</h2><p>اختار PS4 أو PS5 أو القبضة، والمنتجات بتتفلتر مباشرة.</p></div><strong>{products.length} منتج</strong></div>
      <div className="ps-filter-circles unified-filter-circles">
        {filters.map(f => {
          const count = f.key.includes("controller")
            ? products.filter(p => p.family === f.key.slice(0,3) && p.product_type === "controller").length
            : products.filter(p => p.family === f.key && p.product_type !== "controller").length;
          return <button key={f.key} type="button" onClick={() => setFilter(f.key)} className={`ps-filter-circle unified-filter-circle ${filter === f.key ? "active" : ""}`}>
            <span><img src={f.image} alt="" onError={e => { e.currentTarget.style.display="none"; }} /></span>
            <b>{f.label}</b><small>{count} منتج</small>
          </button>;
        })}
      </div>
    </section>

    <section className="unified-products-section">
      <div className="unified-section-heading compact"><div><span>CATALOG</span><h2>{filters.find(f => f.key === filter)?.label || "PlayStation"}</h2><p>كل المنتجات من هذا القسم بمكان واحد.</p></div><strong>{visible.length} منتج</strong></div>
      {visible.length ? <div className="unified-product-grid">{visible.map(p => {
        const out = !p.is_available;
        const isController = p.product_type === "controller";
        return <article key={p.id} className="unified-product-card">
          <Link href={`/playstation/${p.id}`} className="unified-product-image">
            {p.image ? <img src={p.image} alt={p.name} loading="lazy" decoding="async" /> : <div className="unified-placeholder"><b>{isController ? "🎮" : p.family.toUpperCase()}</b><span>{p.model || "PlayStation"}</span></div>}
            <span className="unified-product-badge">{isController ? `قبضة ${p.family.toUpperCase()}` : p.family.toUpperCase()}</span>
            {(p.is_offer || (p.prev_price != null && Number(p.prev_price) > Number(p.price))) && <b className="unified-sale">عرض</b>}
          </Link>
          <div className="unified-product-body">
            <Link href={`/playstation/${p.id}`}><h3>{p.name}</h3></Link>
            <p>{[isController ? "يد تحكم" : null, p.model, isController ? p.controller_connection : null, p.condition].filter(Boolean).join(" • ") || "منتج PlayStation"}</p>{p.details && <div className="unified-product-details">{p.details}</div>}{p.included_options?.length ? <div className="unified-included-list">{p.included_options.map((x,i)=><span key={i}>{x}</span>)}</div> : null}
            <div className="ps-card-storage">{!isController && (p.storage_options||[]).length ? <span>التخزين: {(p.storage_options||[]).join(" / ")}</span> : null}</div><div className="unified-product-bottom"><div><strong>${Number(p.price).toFixed(0)}</strong>{p.prev_price != null && Number(p.prev_price)>Number(p.price) && <del>${Number(p.prev_price).toFixed(0)}</del>}<small>{out ? "غير متوفر" : "متوفر للطلب"}</small></div><Link href={`/playstation/${p.id}`} className="unified-product-detail-link">{out ? "عرض التفاصيل" : "اختيار المنتج ←"}</Link></div>
          </div>
        </article>;
      })}</div> : <div className="unified-empty">ما في منتجات ضمن هذا القسم حالياً.</div>}
    </section>
  </div>;
}
