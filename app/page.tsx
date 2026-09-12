import Link from "next/link";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AIChat from "./components/AIChat";
import BrandShowcase from "./components/BrandShowcase";
import { HeroCarousel, StepProductRail, PlaystationProductRail } from "./components/StorefrontRails";
import StorefrontNotices from "./components/StorefrontNotices";
import { supabase } from "./lib/supabase";
import type { Laptop } from "./lib/types";
import { getSiteSetting } from "./lib/site-settings";

async function getPlaystationProducts(){ const { data } = await supabase.from("playstation_products").select("*").eq("is_available", true).order("created_at", { ascending:false }); return data ?? []; }

async function getLaptops(): Promise<Laptop[]> {
  const { data } = await supabase.from("laptops").select("*").eq("is_available", true).order("created_at", { ascending: false });
  return data ?? [];
}

const defaultCategories = [
  { href: "/laptops?category=business", image: "/catalog/cat-business.png", title: "لابتوبات للأعمال", sub: "للعمل والدراسة", key: "business" },
  { href: "/laptops?category=gaming", image: "/catalog/cat-gaming.png", title: "لابتوبات Gaming", sub: "أداء قوي للألعاب", key: "gaming" },
  { href: "/pc-builder", image: "/catalog/cat-desktop.png", title: "كمبيوتر مكتبي", sub: "حسب الطلب", key: "desktop" },
  { href: "/playstation", image: "/catalog/cat-playstation.png", title: "PlayStation", sub: "PS4 + PS5", key: "playstation" },
  { href: "/services", image: "/catalog/cat-digital.png", title: "الألعاب والخدمات الرقمية", sub: "شحن وبطاقات وأكواد", key: "digital" },
  { href: "/categories", image: "/catalog/cat-accessories.png", title: "الإكسسوارات", sub: "ملحقات تقنية", key: "accessories" },
  { href: "/web-dev", image: "/catalog/cat-web.png", title: "تصميم وبرمجة المواقع", sub: "مواقع ومتاجر", key: "web" },
  { href: "/offers", image: "/catalog/cat-offers.png", title: "العروض", sub: "أسعار مميزة", key: "offers" },
];

const defaultPromos = [
  { title: "PlayStation", text: "PS4 و PS5 موجودين بالمتجر", href: "/playstation", image: "/catalog/promo-playstation.png", key: "playstation" },
  { title: "الألعاب والخدمات الرقمية", text: "شحن وبطاقات وأكواد", href: "/services", image: "/catalog/promo-digital.png", key: "digital" },
  { title: "تصميم وبرمجة المواقع", text: "متجرك وموقعك من بكاري تيك", href: "/web-dev", image: "/catalog/promo-web.png", key: "web" },
  { title: "كمبيوتر مكتبي", text: "اطلب تجميعة حسب استخدامك", href: "/pc-builder", image: "/catalog/promo-desktop.png", key: "desktop" },
];

const defaultMedia = {
  hero: ["/catalog/hero-laptop.png", "/catalog/hero-gaming.png", "/catalog/hero-playstation.png", "/catalog/hero-digital.png"],
  categories: Object.fromEntries(defaultCategories.map(c => [c.key, c.image])),
  promos: Object.fromEntries(defaultPromos.map(c => [c.key, c.image])),
  playstation: "/catalog/playstation-banner.png",
  pc_builder: "/catalog/pc-builder.png",
};

type StorefrontMedia = typeof defaultMedia;

export default async function Home() {
  const [laptops, media, psProducts, notices] = await Promise.all([getLaptops(), getSiteSetting<Partial<StorefrontMedia>>("storefront_media", {}), getPlaystationProducts(), getSiteSetting<any[]>("storefront_notices", [])]);
  const mergedMedia: StorefrontMedia = {
    ...defaultMedia,
    ...media,
    hero: Array.isArray(media.hero) && media.hero.length ? media.hero : defaultMedia.hero,
    categories: { ...defaultMedia.categories, ...(media.categories ?? {}) },
    promos: { ...defaultMedia.promos, ...(media.promos ?? {}) },
  };
  // Keep existing admin media selections intact, but upgrade only the old built-in defaults
  // to the new local asset set. Custom uploaded URLs are never replaced.
  const legacyToNew: Record<string,string> = {
    '/catalog/cat-desktop.png': '/catalog/promo-desktop.png',
    '/catalog/cat-digital.png': '/catalog/promo-digital.png',
    '/catalog/cat-web.png': '/catalog/promo-web.png',
  };
  mergedMedia.promos = Object.fromEntries(Object.entries(mergedMedia.promos).map(([k,v]) => [k, legacyToNew[String(v)] ?? v])) as StorefrontMedia['promos'];
  if (mergedMedia.playstation === '/catalog/hero-playstation.png') mergedMedia.playstation = '/catalog/playstation-banner.png';
  if (mergedMedia.pc_builder === '/catalog/cat-desktop.png') mergedMedia.pc_builder = '/catalog/pc-builder.png';
  const categories = defaultCategories.map(c => ({ ...c, image: String(mergedMedia.categories[c.key] ?? c.image) }));
  const promoTiles = defaultPromos.map(c => ({ ...c, image: String(mergedMedia.promos[c.key] ?? c.image) }));
  const brands = Array.from(new Set(laptops.map(x => x.brand).filter(Boolean) as string[]));
  const counts = laptops.reduce((m, l) => { if (l.brand) m[l.brand] = (m[l.brand] ?? 0) + 1; return m; }, {} as Record<string, number>);
  const offers = laptops.filter(l => l.is_offer || (l.prev_price != null && Number(l.prev_price) > Number(l.price)));
  const featured = laptops.slice(0, 8);
  const gamingProducts = laptops.filter(l => /gaming|game|ألعاب|gtx|rtx|quadro|radeon|geforce/i.test(`${l.category??""} ${l.name??""} ${l.gpu??""}`));
  const businessProducts = laptops.filter(l => !gamingProducts.some(g => g.id===l.id));
  const businessRail = businessProducts.length ? businessProducts : featured;
  const gamingRail = gamingProducts.length ? gamingProducts : featured.slice().reverse();
  const offerProducts = (offers.length ? offers : laptops).slice(0, 12);
  const ps4Products = psProducts.filter((p:any)=>p.family==="ps4").slice(0,12);
  const ps5Products = psProducts.filter((p:any)=>p.family==="ps5").slice(0,12);

  return <div className="pl-store">
    <StorefrontNotices notices={notices} />
    <Header />
    <main>
      <HeroCarousel images={mergedMedia.hero} />

      <section className="pl-category-section">
        <div className="pl-section-title"><h2>تسوق حسب الفئة</h2><Link href="/categories">عرض الكل ←</Link></div>
        <div className="pl-category-rail">
          {categories.map((c) => <Link key={c.href} href={c.href} className="pl-category-item"><span className="pl-category-icon"><img src={c.image} alt="" /></span><b>{c.title}</b><small>{c.sub}</small></Link>)}
        </div>
      </section>

      {featured.length > 0 && <section className="pl-home-section">
        <div className="pl-section-title"><div><h2>لابتوبات للأعمال</h2><p>أجهزة مناسبة للعمل والدراسة</p></div><Link href="/laptops?category=business">عرض الكل ←</Link></div>
        <StepProductRail products={businessRail} />
      </section>}

      {gamingRail.length > 0 && <section className="pl-home-section">
        <div className="pl-section-title"><div><h2>لابتوبات Gaming</h2><p>أجهزة بأداء قوي للألعاب</p></div><Link href="/laptops?category=gaming">عرض الكل ←</Link></div>
        <StepProductRail products={gamingRail} reverse />
      </section>}

      <section className="pl-promo-grid">
        {promoTiles.map((tile, i) => <Link href={tile.href} key={tile.href} className={`pl-promo-card p${i}`} style={{ backgroundImage: `linear-gradient(90deg, rgba(255,255,255,.98) 0%, rgba(255,255,255,.88) 48%, rgba(255,255,255,.2) 100%), url(${tile.image})` }}><div><small>BKKARI TECH</small><h3>{tile.title}</h3><p>{tile.text}</p><b>تصفح القسم ←</b></div></Link>)}
      </section>

      {offerProducts.length > 0 && <section className="pl-home-section pl-offers-section">
        <div className="pl-section-title"><div><h2>عروض اللابتوبات</h2><p>منتجات عليها سعر مميز</p></div><Link href="/offers">عرض الكل ←</Link></div>
        <StepProductRail products={offerProducts} />
      </section>}

      <section className="pl-wide-banner" style={{ backgroundImage: `linear-gradient(90deg, rgba(255,255,255,.98) 0%, rgba(255,255,255,.9) 50%, rgba(255,255,255,.28) 100%), url(${mergedMedia.playstation})` }}><div><small>PLAYSTATION STORE</small><h2>PlayStation</h2><p>PS4 و PS5 موجودين ضمن المتجر.</p><Link href="/playstation">تصفح PlayStation ←</Link></div></section>

      <section className="pl-home-section">
        <BrandShowcase brands={brands} counts={counts}/>
      </section>

      <section className="pl-home-section pl-custom-pc" style={{ backgroundImage: `linear-gradient(90deg, rgba(255,255,255,.98) 0%, rgba(255,255,255,.88) 50%, rgba(255,255,255,.25) 100%), url(${mergedMedia.pc_builder})` }}>
        <div className="pl-pc-copy"><small>PC BUILDER / REQUEST</small><h2>بدك PC على مواصفاتك؟</h2><p>حدد الميزانية والاستخدام والمواصفات، ومنرجعلك باقتراح مناسب.</p><Link href="/pc-builder">اطلب تجميعتك ←</Link></div>
      </section>

      {psProducts.length>0 && <section className="pl-home-section pl-ps-home-section">
        <div className="pl-section-title"><div><h2>منتجات PlayStation</h2><p>PS4 و PS5 — أجهزة ومنتجات جاهزة للطلب</p></div><Link href="/playstation">عرض كل PlayStation ←</Link></div>
        <div className="ps-family-home-rail"><Link href="/playstation?family=ps4" className="ps-family-circle"><span>PS4</span><b>PlayStation 4</b></Link><Link href="/playstation?family=ps5" className="ps-family-circle"><span>PS5</span><b>PlayStation 5</b></Link></div>
        {ps5Products.length>0 && <><h3 className="ps-home-subtitle">PS5</h3><PlaystationProductRail products={ps5Products}/></>}
        {ps4Products.length>0 && <><h3 className="ps-home-subtitle">PS4</h3><PlaystationProductRail products={ps4Products} reverse/></>}
      </section>}

      <section className="pl-home-section pl-mini-links">
        {[["🎮","PlayStation","PS4 و PS5","/playstation"],["⚡","الخدمات الرقمية","ألعاب وبطاقات وشحن","/services"],["🌐","برمجة المواقع","متاجر ومواقع احترافية","/web-dev"]].map(([icon,title,text,href]) => <Link href={href} key={href}><span>{icon}</span><div><b>{title}</b><small>{text}</small></div><strong>←</strong></Link>)}
      </section>
    </main>
    <Footer/><AIChat/>
  </div>;
}
