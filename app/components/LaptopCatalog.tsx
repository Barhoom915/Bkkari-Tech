"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Laptop } from "@/app/lib/types";
import FavoriteButton from "./FavoriteButton";
import LaptopArtwork from "@/app/components/LaptopArtwork";

export default function LaptopCatalog({ laptops, initialBrand = "all", initialCategory = "all" }: { laptops: Laptop[]; initialBrand?: string; initialCategory?: string }) {
  const PRICE_CAP = 2500;
  const [maxPrice, setMaxPrice] = useState(Math.min(PRICE_CAP, Math.max(100, ...laptops.map(l => Number(l.price) || 0))));
  const [compare, setCompare] = useState<number[]>([]);
  const filtered = useMemo(() => laptops.filter(l => Number(l.price) <= maxPrice), [laptops, maxPrice]);
  function toggleCompare(id: number) { setCompare(c => c.includes(id) ? c.filter(x => x !== id) : c.length < 3 ? [...c, id] : c); }
  return <div>
    <div className="laptop-price-filter-card rounded-3xl border border-line bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-extrabold text-blue">PRICE FILTER</p><h3 className="mt-1 font-extrabold text-ink">أقصى سعر: ${maxPrice}</h3></div>
        <span className="rounded-full bg-surface px-3 py-1.5 text-xs font-bold text-ink-soft">{filtered.length} جهاز</span>
      </div>
      <input type="range" min="100" max={PRICE_CAP} step="10" value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} className="mt-4 w-full accent-[var(--blue)]" />
      <div className="mt-1 flex justify-between text-[10px] text-ink-soft"><span>$100</span><span>حتى $${PRICE_CAP}</span></div>
    </div>
    {filtered.length === 0 ? <div className="mt-6 rounded-3xl border border-dashed border-line bg-surface p-12 text-center text-sm text-ink-soft">ما لقينا أجهزة ضمن السعر المحدد.</div> : <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(l => <article key={l.id} className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-surface"><Link href={`/laptops/${l.id}`} className="absolute inset-0">{l.images?.[0] ? <img src={l.images[0]} alt={l.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/> : <span className="grid h-full place-items-center p-6"><LaptopArtwork brand={l.brand} category={l.category} /></span>}</Link><div className="absolute right-3 top-3 flex gap-1.5 pointer-events-none">{l.is_new && <span className="rounded-full bg-blue px-2.5 py-1 text-[10px] font-bold text-white">جديد</span>}{l.is_bestseller && <span className="rounded-full bg-orange px-2.5 py-1 text-[10px] font-bold text-white">الأكثر مبيعاً</span>}</div><FavoriteButton laptopId={l.id} className="absolute left-3 top-3 z-10"/></div>
      <div className="flex flex-1 flex-col p-5"><div className="text-xs font-semibold text-blue">{l.brand || "BKKARI TECH"}</div><Link href={`/laptops/${l.id}`}><h3 className="mt-1 line-clamp-2 font-bold text-ink hover:text-blue">{l.name}</h3></Link><p className="mt-2 line-clamp-2 text-xs leading-5 text-ink-soft">{[l.cpu,l.ram,l.storage,l.gpu].filter(Boolean).join(" • ")}</p><div className="mt-auto flex items-end justify-between pt-5"><div><span className="text-xl font-extrabold text-ink">${l.price}</span>{l.prev_price && <span className="mr-2 text-xs text-ink-soft/60 line-through">${l.prev_price}</span>}<p className="mt-1 text-[11px] text-ink-soft">{l.stock_quantity > 0 ? `متوفر • ${l.stock_quantity} قطع` : "غير متوفر"}</p></div><button type="button" onClick={() => toggleCompare(l.id)} className={`rounded-xl border px-3 py-2 text-[11px] font-bold ${compare.includes(l.id) ? "border-blue bg-blue/10 text-blue" : "border-line text-ink-soft hover:border-blue"}`}>{compare.includes(l.id) ? "✓ مقارنة" : "مقارنة"}</button></div></div>
    </article>)}</div>}
    {compare.length > 0 && <div className="sticky bottom-20 z-30 mt-6 flex items-center justify-between gap-3 rounded-2xl border border-blue/20 bg-white/95 p-3 shadow-xl backdrop-blur"><span className="text-sm font-bold text-ink">مقارنة {compare.length}/3 أجهزة</span><Link href={`/compare?ids=${compare.join(",")}`} className="rounded-xl bg-blue px-4 py-2 text-xs font-bold text-white">فتح المقارنة</Link></div>}
  </div>;
}
