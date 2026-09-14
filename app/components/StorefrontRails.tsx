"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import type { Laptop } from "@/app/lib/types";
import LaptopArtwork from "./LaptopArtwork";
import FavoriteButton from "./FavoriteButton";
import { useCart } from "@/app/lib/cart-context";

export type PlaystationProduct = {
  id: number; name: string; family: "ps4" | "ps5"; product_type?: "console" | "controller" | "accessory"; model: string | null; storage: string | null;
  condition: string | null; price: number; prev_price: number | null; image: string | null;
  stock_quantity: number; is_available: boolean; is_offer: boolean; is_featured: boolean;
};

function ProductCard({ laptop }: { laptop: Laptop }) {
  return <article className="pl-product-card">
    <div className="pl-product-media">
      <Link href={`/laptops/${laptop.id}`} className="pl-product-image-link">
        {laptop.images?.[0] ? <img src={laptop.images[0]} alt={laptop.name} loading="lazy" decoding="async" /> : <LaptopArtwork brand={laptop.brand} category={laptop.category} />}
      </Link>
      <span className="pl-brand-tag">{laptop.brand || "BKKARI"}</span>
      <FavoriteButton laptopId={laptop.id} />
      {(laptop.is_offer || (laptop.prev_price != null && Number(laptop.prev_price) > Number(laptop.price))) && <b className="pl-sale">عرض</b>}
    </div>
    <div className="pl-product-body">
      <Link href={`/laptops/${laptop.id}`}><h3>{laptop.name}</h3></Link>
      <p>{[laptop.cpu, laptop.ram, laptop.storage].filter(Boolean).join(" · ")}</p>
      <div className="pl-price"><strong>${Number(laptop.price).toFixed(0)}</strong>{laptop.prev_price && <del>${Number(laptop.prev_price).toFixed(0)}</del>}</div>
      <Link href={`/laptops/${laptop.id}`} className="pl-add">إضافة إلى السلة</Link>
    </div>
  </article>;
}

function PlaystationCard({ product }: { product: PlaystationProduct }) {
  const { addItem } = useCart();
  const out = !product.is_available;
  return <article className="pl-product-card ps-product-card">
    <div className="pl-product-media">
      <Link href={`/playstation/${product.id}`} className="pl-product-image-link">
        {product.image ? <img src={product.image} alt={product.name} loading="lazy" decoding="async" /> : <div className="ps-product-placeholder"><b>{product.family.toUpperCase()}</b><span>{product.model}</span></div>}
      </Link>
      <span className="pl-brand-tag">{product.product_type === "controller" ? `قبضة ${product.family.toUpperCase()}` : product.family === "ps5" ? "PS5" : "PS4"}</span>
      {product.is_offer || (product.prev_price != null && Number(product.prev_price) > Number(product.price)) ? <b className="pl-sale">عرض</b> : null}
    </div>
    <div className="pl-product-body">
      <Link href={`/playstation/${product.id}`}><h3>{product.name}</h3></Link>
      <p>{[product.product_type === "controller" ? "يد تحكم" : null, product.model, product.storage, product.condition].filter(Boolean).join(" · ")}</p>
      <div className="pl-price"><strong>${Number(product.price).toFixed(0)}</strong>{product.prev_price && <del>${Number(product.prev_price).toFixed(0)}</del>}</div>
      <Link href={`/playstation/${product.id}`} className="pl-add">{out ? "عرض التفاصيل" : "اختيار المنتج ←"}</Link>
    </div>
  </article>;
}

function LoopRail<T extends { id: number }>({ items, render, reverse = false, className = "" }: { items: T[]; render: (item: T) => ReactNode; reverse?: boolean; className?: string }) {
  const base = useMemo(() => items.slice(0, 12), [items]);
  const loop = useMemo(() => [...base, ...base, ...base, ...base, ...base], [base]);
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const resetToMiddle = () => {
    const el = ref.current; if (!el || !base.length) return;
    const card = el.querySelector<HTMLElement>(".pl-product-card");
    const width = (card?.getBoundingClientRect().width ?? 230) + 12;
    const segment = width * base.length;
    if (el.scrollLeft < segment * 0.04) el.scrollLeft += segment * 2;
    else if (el.scrollLeft > segment * 4.96) el.scrollLeft -= segment * 2;
  };
  const moveOne = (direction: 1 | -1) => {
    const el = ref.current; if (!el || !base.length) return;
    const card = el.querySelector<HTMLElement>(".pl-product-card");
    const amount = (card?.getBoundingClientRect().width ?? 230) + 12;
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
    window.setTimeout(resetToMiddle, 650);
  };
  useEffect(() => {
    if (base.length < 2) return;
    const el = ref.current; if (!el) return;
    const card = el.querySelector<HTMLElement>(".pl-product-card");
    const width = (card?.getBoundingClientRect().width ?? 230) + 12;
    el.scrollLeft = width * base.length;
  }, [base.length]);
  useEffect(() => {
    if (base.length < 2) return;
    const id = window.setInterval(() => { if (!paused && !document.hidden) moveOne(reverse ? -1 : 1); }, 3300);
    return () => window.clearInterval(id);
  }, [base.length, paused, reverse]);
  if (!base.length) return null;
  return <div className={`pl-step-rail ${className}`}>
    <button className="pl-rail-arrow" onClick={() => moveOne(-1)} aria-label="السابق">‹</button>
    <div ref={ref} className="pl-step-window pl-draggable-window" dir="ltr" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)}>
      {loop.map((item, i) => <div className="pl-loop-item" key={`${item.id}-${i}`}>{render(item)}</div>)}
    </div>
    <button className="pl-rail-arrow" onClick={() => moveOne(1)} aria-label="التالي">›</button>
  </div>;
}

export function StepProductRail({ products, reverse = false }: { products: Laptop[]; reverse?: boolean }) {
  return <LoopRail items={products} reverse={reverse} render={(laptop) => <ProductCard laptop={laptop} />} />;
}


export type DigitalHomeProduct = { id: number; name: string; price: number; image?: string | null; maxQuantity?: number; currency_symbol?: string };

export function DigitalHomeProductRail({ products }: { products: DigitalHomeProduct[] }) {
  const { addItem } = useCart();
  const base = products.slice(0, 8);
  if (!base.length) return null;
  const loop = [...base, ...base, ...base, ...base, ...base];
  return <div className="pl-step-rail digital-home-rail">
    <button className="pl-rail-arrow" aria-label="السابق">‹</button>
    <div className="pl-step-window pl-draggable-window" dir="ltr">
      {loop.map((p, i) => <article className="pl-loop-item" key={`${p.id}-${i}`}><div className="pl-product-card digital-home-card">
        <div className="pl-product-media"><Link href={`/services`} className="pl-product-image-link">{p.image ? <img src={p.image} alt={p.name} loading="lazy" decoding="async" /> : <div className="ps-product-placeholder"><b>⚡</b></div>}</Link><span className="pl-brand-tag">DIGITAL</span></div>
        <div className="pl-product-body"><Link href="/services"><h3>{p.name}</h3></Link><p>خدمة رقمية</p><div className="pl-price"><strong>${Number(p.price).toFixed(2)}</strong></div><button className="pl-add" onClick={() => addItem({id:`digital-${p.id}`,name:p.name,price:Number(p.price)})}>إضافة للسلة</button></div>
      </div></article>)}
    </div>
    <button className="pl-rail-arrow" aria-label="التالي">›</button>
  </div>;
}

export function PlaystationProductRail({ products, reverse = false }: { products: PlaystationProduct[]; reverse?: boolean }) {
  return <LoopRail items={products} reverse={reverse} render={(product) => <PlaystationCard product={product} />} />;
}

const heroSlides = [
  { image: "/catalog/hero-laptop.png", eyebrow: "BKKARI TECH", title: "اللابتوبات", text: "لابتوبات للأعمال وGaming وأجهزة مناسبة لكل استخدام", href: "/laptops", button: "تصفح اللابتوبات" },
  { image: "/catalog/hero-playstation.png", eyebrow: "PLAYSTATION", title: "أجهزة PS4 و PS5", text: "أجهزة PlayStation وقبضات وملحقات ضمن المتجر", href: "/playstation", button: "تصفح PlayStation" },
  { image: "/catalog/hero-digital.png", eyebrow: "DIGITAL SERVICES", title: "المنتجات الرقمية", text: "شحن ألعاب وبطاقات وخدمات رقمية بسرعة", href: "/services", button: "تصفح الخدمات الرقمية" },
  { image: "/catalog/hero-web.png", eyebrow: "BKKARI WEB", title: "تصميم وبرمجة المواقع", text: "مواقع ومتاجر إلكترونية مصممة حسب حاجتك", href: "/web-dev", button: "اطلب موقعك" },
  { image: "/catalog/hero-gaming.png", eyebrow: "GAMING", title: "Gaming أقوى", text: "أجهزة Gaming مختارة للألعاب والاستخدام الثقيل", href: "/laptops?category=Gaming", button: "تصفح Gaming" },
];

export function HeroCarousel({ images }: { images?: string[] }) {
  const ref = useRef<HTMLDivElement>(null); const [index, setIndex] = useState(0); const [paused, setPaused] = useState(false);
  const slides = heroSlides.map((slide, i) => ({ ...slide, image: images?.[i] || slide.image }));
  const go = (next: number) => { const i=(next+slides.length)%slides.length; setIndex(i); ref.current?.scrollTo({left:ref.current.clientWidth*i,behavior:"smooth"}); };
  useEffect(()=>{const id=window.setInterval(()=>{if(!paused&&!document.hidden)go(index+1)},5000);return()=>window.clearInterval(id)},[index,paused]);
  useEffect(()=>{const el=ref.current;if(!el)return;const onScroll=()=>setIndex(Math.round(el.scrollLeft/Math.max(1,el.clientWidth)));el.addEventListener("scroll",onScroll,{passive:true});return()=>el.removeEventListener("scroll",onScroll)},[]);
  return <section className="pl-hero-carousel" aria-label="العروض الرئيسية" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}>
    <div ref={ref} className="pl-hero-track pl-draggable-window" dir="ltr">{slides.map(slide=><article className="pl-hero-slide" key={slide.title}><Link href={slide.href} className="pl-hero-slide-link" aria-label={slide.title}><div className="pl-hero-slide-copy" dir="rtl"><span>{slide.eyebrow}</span><h1>{slide.title}</h1><p>{slide.text}</p><span className="pl-hero-btn">{slide.button}</span></div><div className="pl-hero-slide-art"><img src={slide.image} alt="" /></div></Link></article>)}</div>
    <button className="pl-hero-arrow prev" onClick={()=>go(index-1)} aria-label="البانر السابق">‹</button><button className="pl-hero-arrow next" onClick={()=>go(index+1)} aria-label="البانر التالي">›</button>
    <div className="pl-hero-dots">{slides.map((_,i)=><button key={i} className={i===index?"active":""} onClick={()=>go(i)} aria-label={`البانر ${i+1}`} />)}</div>
  </section>;
}
