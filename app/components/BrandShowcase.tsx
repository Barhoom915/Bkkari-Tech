"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const BRAND_LOGOS: Record<string,string> = {
  Apple:"/catalog/brands/apple.svg", ASUS:"https://cdn.simpleicons.org/asus/0F2A4A", Lenovo:"https://cdn.simpleicons.org/lenovo/0F2A4A", Dell:"https://cdn.simpleicons.org/dell/0F2A4A", HP:"https://cdn.simpleicons.org/hp/0F2A4A", Acer:"https://cdn.simpleicons.org/acer/0F2A4A", MSI:"https://cdn.simpleicons.org/msi/0F2A4A", Microsoft:"https://cdn.simpleicons.org/microsoft/0F2A4A", Samsung:"https://cdn.simpleicons.org/samsung/0F2A4A", LG:"https://cdn.simpleicons.org/lg/0F2A4A", Razer:"https://cdn.simpleicons.org/razer/0F2A4A", Huawei:"https://cdn.simpleicons.org/huawei/0F2A4A", Gigabyte:"https://cdn.simpleicons.org/gigabyte/0F2A4A", Alienware:"https://cdn.simpleicons.org/alienware/0F2A4A", Toshiba:"https://cdn.simpleicons.org/toshiba/0F2A4A", VAIO:"https://cdn.simpleicons.org/vaio/0F2A4A", Dynabook:"https://cdn.simpleicons.org/dynabook/0F2A4A", Xiaomi:"https://cdn.simpleicons.org/xiaomi/0F2A4A", Framework:"https://cdn.simpleicons.org/framework/0F2A4A", Chuwi:"https://cdn.simpleicons.org/chuwi/0F2A4A", Medion:"https://cdn.simpleicons.org/medion/0F2A4A"
};
const DEFAULT_BRANDS = Object.keys(BRAND_LOGOS);
function normalizeBrand(raw:string){ const v=String(raw||'').trim(); const k=v.toLowerCase().replace(/[\s_-]+/g,''); if(['asus','أسوس','اسوس'].includes(v.toLowerCase())||k==='asus'||k==='أسوس'||k==='اسوس') return 'ASUS'; if(['apple','ابل','آبل'].includes(v.toLowerCase())||['apple','ابل','آبل'].includes(k)) return 'Apple'; return v; }

export default function BrandShowcase({ brands, counts = {}, selectedBrand, homeRail = false, logoMap = {} }: { brands?: string[]; counts?: Record<string,number>; selectedBrand?: string; homeRail?: boolean; logoMap?: Record<string,string> }) {
  const raw = (brands ?? []).filter(Boolean);
  const grouped = useMemo(() => { const m = new Map<string,number>(); for(const b of raw){ const n=normalizeBrand(b); if(n) m.set(n,(m.get(n)||0)+(counts[b]||0)); } return Array.from(m.keys()); }, [brands, counts]);
  const logoFor=(brand:string)=>logoMap[brand] || BRAND_LOGOS[brand] || "";
  const items = grouped.filter(brand => Boolean(logoFor(brand))).length ? grouped.filter(brand => Boolean(logoFor(brand))) : DEFAULT_BRANDS.filter(brand => Boolean(logoFor(brand)));
  const [clicked,setClicked]=useState<string|null>(null);
  const viewport=useRef<HTMLDivElement>(null); const [paused,setPaused]=useState(false);
  useEffect(()=>{ if(!homeRail || items.length<2) return; const el=viewport.current; if(!el) return; const id=window.setInterval(()=>{ if(paused||document.hidden)return; const card=el.querySelector<HTMLElement>('.home-brand-item'); if(!card)return; const amount=card.getBoundingClientRect().width + 12; const max=el.scrollWidth-el.clientWidth; const next=el.scrollLeft+amount; el.scrollTo({left: next>=max-2?0:next,behavior:'smooth'}); },3200); return()=>window.clearInterval(id); },[homeRail,items.length,paused]);
  const renderItem=(brand:string,i:number,home=false)=>{ const count=counts[brand] ?? grouped.reduce((n,b)=>b===brand?n+1:n,0); const active=selectedBrand===brand; return <Link key={`${brand}-${i}`} href={`/laptops?brand=${encodeURIComponent(brand)}`} onClick={()=>setClicked(brand)} className={`${home?'home-brand-item':'brand-grid-item'} ${active?'active':''} ${clicked===brand?'brand-clicked':''}`} aria-label={brand}><span className="brand-logo-circle"><img src={logoFor(brand)} alt={brand} loading="lazy" decoding="async"/></span>{!home&&<><b>{brand}</b><small>{count?`${count} جهاز`:'متوفر لاحقاً'}</small></>}</Link>; };
  if(homeRail) return <section className="brand-strip-section home-brand-rail" aria-label="شركات اللابتوبات"><div ref={viewport} className="home-brand-viewport" dir="ltr" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onTouchStart={()=>setPaused(true)} onTouchEnd={()=>setPaused(false)}>{items.map((b,i)=>renderItem(b,i,true))}</div></section>;
  return <section className="brand-strip-section unified-brand-section laptop-brands-grid-section"><div className="brand-grid-five" aria-label="شركات اللابتوبات">{items.map((b,i)=>renderItem(b,i,false))}</div></section>;
}
