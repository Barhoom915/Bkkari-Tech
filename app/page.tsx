import Link from "next/link";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AIChat from "./components/AIChat";
import BrandShowcase from "./components/BrandShowcase";
import { HeroCarousel, StepProductRail, PlaystationProductRail, DigitalHomeProductRail } from "./components/StorefrontRails";
import { satofill, isSatoFillBlocked, getSatoFillStorePrice, isSatoFillChatProduct } from "./lib/satofill";
import StorefrontNotices from "./components/StorefrontNotices";
import { supabase } from "./lib/supabase";
import type { Laptop } from "./lib/types";
import { getSiteSetting } from "./lib/site-settings";

async function getPlaystationProducts(){ const { data } = await supabase.from("playstation_products").select("*").eq("is_available", true).order("created_at", { ascending:false }); return data ?? []; }

async function getLaptops(): Promise<Laptop[]> {
  const { data } = await supabase.from("laptops").select("*").eq("is_available", true).order("created_at", { ascending: false });
  return data ?? [];
}
async function getDigitalHomeProducts() {
  try {
    const products = await satofill.getProducts();
    const available = products.filter(p => p.available !== false && !isSatoFillBlocked(`${p.name} ${(p.categories ?? []).join(" ")}`));
    const text = (p:any) => `${p.name} ${(p.categories ?? []).join(" ")}`.toLowerCase();
    const buckets = [
      /(pubg|ببجي|uc)/i,
      /(free fire|فري فاير|فري فاير|diamonds|دايموند)/i,
      /(netflix|youtube|spotify|shahid|telegram|canva|capcut|اشتراك|premium)/i,
      /(itunes|playstation|roblox|بطاق|gift card|card)/i,
      /(jawaker|جواكر)/i,
    ];
    const picked:any[] = [];
    for (const re of buckets) {
      const matches = available.filter(p => re.test(text(p)));
      for (const p of matches.slice(0, 2)) if (!picked.some(x => String(x.id) === String(p.id))) picked.push(p);
    }
    for (const p of available) { if (picked.length >= 10) break; if (!picked.some(x => String(x.id) === String(p.id))) picked.push(p); }
    return picked.slice(0, 10).map(p => ({
      id: Number(p.id), name: p.name, image: p.thumbnail, maxQuantity: p.max_quantity,
      price: Number(getSatoFillStorePrice(p.price, isSatoFillChatProduct(p), 5)) || 0, currency_symbol: p.currency_symbol
    })).filter(p => Number.isFinite(p.id) && p.price >= 0);
  } catch { return []; }
}


const defaultCategories = [
  { href: "/laptops?category=%D8%A3%D8%B9%D9%85%D8%A7%D9%84", image: "/catalog/cat-business.png", title: "لابتوبات للأعمال", sub: "للعمل والدراسة", key: "business" },
  { href: "/laptops?category=Gaming", image: "/catalog/cat-gaming.png", title: "لابتوبات Gaming", sub: "أداء قوي للألعاب", key: "gaming" },
  { href: "/laptops?category=Gaming%20%D9%85%D8%AA%D9%88%D8%B3%D8%B7", image: "/catalog/cat-gaming.png", title: "Gaming متوسط", sub: "أداء متوازن للألعاب", key: "gaming-medium" },
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
  hero: ["/catalog/hero-laptop.png", "/catalog/hero-playstation.png", "/catalog/hero-digital.png", "/catalog/hero-web.png", "/catalog/hero-gaming.png"],
  categories: Object.fromEntries(defaultCategories.map(c => [c.key, c.image])),
  promos: Object.fromEntries(defaultPromos.map(c => [c.key, c.image])),
  playstation: "/catalog/playstation-banner.png",
  pc_builder: "/catalog/pc-builder.png",
};

type StorefrontMedia = typeof defaultMedia;

const defaultNotices = [
  { id: "delivery", title: "شحن لجميع المحافظات", text: "مننسق معك العنوان وموعد التسليم حسب المحافظة.", icon: "🚚" },
  { id: "digital", title: "خدمات رقمية سريعة", text: "شحن ألعاب وبطاقات وخدمات رقمية.", icon: "⚡" },
  { id: "support", title: "دعم سريع", text: "تواصل معنا قبل الطلب أو بعده.", icon: "🎧" },
  { id: "stock", title: "تحديث مستمر للمخزون", text: "الأسعار والتوفر قابلين للتحديث من لوحة التحكم.", icon: "ℹ️" },
];


export const revalidate = 60;

export default async function Home() {
  const [laptops, media, psProducts, notices, digitalHomeProducts] = await Promise.all([getLaptops(), getSiteSetting<Partial<StorefrontMedia>>("storefront_media", {}), getPlaystationProducts(), getSiteSetting<any[]>("storefront_notices", defaultNotices), getDigitalHomeProducts()]);
  const activeNotices = Array.isArray(notices) && notices.length ? notices : defaultNotices;
  const mergedMedia: StorefrontMedia = {
    ...defaultMedia,
    ...media,
    hero: Array.isArray(media.hero) && media.hero.length ? media.hero.map((x:any,i:number)=>x || defaultMedia.hero[i] || defaultMedia.hero[0]) : defaultMedia.hero,
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
  const categories = defaultCategories.map(c => ({ ...c, image: String(mergedMedia.categories[c.key] || c.image) }));
  const promoTiles = defaultPromos.map(c => ({ ...c, image: String(mergedMedia.promos[c.key] || c.image) }));
  const cleanedLaptops = laptops.filter(l => Boolean(l.images?.[0]));
  const normalizeBrand = (raw:string) => { const v=String(raw||'').trim(); const k=v.toLowerCase().replace(/[\s_-]+/g,''); if(['asus','أسوس','اسوس'].includes(v.toLowerCase())||['asus','أسوس','اسوس'].includes(k)) return 'ASUS'; if(['apple','ابل','آبل'].includes(v.toLowerCase())||['apple','ابل','آبل'].includes(k)) return 'Apple'; return v; };
  const brands = Array.from(new Set(cleanedLaptops.map(x => normalizeBrand(String(x.brand||''))).filter(Boolean)));
  const counts = cleanedLaptops.reduce((m, l) => { const b=normalizeBrand(String(l.brand||'')); if (b) m[b] = (m[b] ?? 0) + 1; return m; }, {} as Record<string, number>);
  const offers = cleanedLaptops.filter(l => l.is_offer || (l.prev_price != null && Number(l.prev_price) > Number(l.price)));
  const featured = cleanedLaptops.slice(0, 8);
  const classifyLaptop = (raw:string) => {
    const v=String(raw||"").toLowerCase().trim();
    if (/gaming\s*(medium|mid)|gaming متوسط|متوسط/.test(v)) return "Gaming متوسط";
    if (/gaming|game|ألعاب|gtx|rtx|quadro|radeon|geforce/.test(v)) return "Gaming";
    if (/business|أعمال/.test(v)) return "أعمال";
    if (/desktop|مكتبي|student|دراسة|design|تصميم/.test(v)) return "مكتبي";
    return "مكتبي";
  };
  const businessProducts = cleanedLaptops.filter(l => classifyLaptop(String(l.category??"")) === "أعمال");
  const gamingProducts = cleanedLaptops.filter(l => classifyLaptop(String(l.category??"")) === "Gaming");
  const gamingMediumProducts = cleanedLaptops.filter(l => classifyLaptop(String(l.category??"")) === "Gaming متوسط");
  const businessRail = businessProducts.length ? businessProducts : [];
  const gamingRail = gamingProducts.length ? gamingProducts : [];
  const gamingMediumRail = gamingMediumProducts.length ? gamingMediumProducts : [];
  const offerProducts = (offers.length ? offers : cleanedLaptops).slice(0, 12);
  const ps4Products = psProducts.filter((p:any)=>p.family==="ps4").slice(0,12);
  const ps5Products = psProducts.filter((p:any)=>p.family==="ps5").slice(0,12);

  return <div className="pl-store">
    <StorefrontNotices notices={activeNotices} />
    <Header />
    <main>
      <HeroCarousel images={mergedMedia.hero} />

      <section className="pl-home-section pl-brands-first"><BrandShowcase brands={brands} counts={counts} homeRail logoMap={(media as any)?.laptop_brand_logos || {}} /></section>

      <section className="pl-category-section">
        <div className="pl-section-title"><h2>تسوق حسب الفئة</h2><Link href="/categories">عرض الكل</Link></div>
        <div className="pl-category-rail">
          {categories.map((c) => <Link key={c.href} href={c.href} className="pl-category-item"><span className="pl-category-icon"><img src={c.image} alt="" /></span><b>{c.title}</b><small>{c.sub}</small></Link>)}
        </div>
      </section>

      {offerProducts.length > 0 && <section className="pl-home-section pl-feature-section">
        <div className="pl-section-title"><div><h2>عروض اللابتوبات</h2><p>منتجات مختارة بسعر مميز</p></div><Link href="/offers">عرض الكل</Link></div>
        <StepProductRail products={offerProducts} />
      </section>}

      {businessRail.length > 0 && <section className="pl-home-section compact-laptop-section">
        <div className="pl-section-title"><div><h2>لابتوبات للأعمال</h2><p>أجهزة مناسبة للعمل والدراسة</p></div><Link href="/laptops?category=%D8%A3%D8%B9%D9%85%D8%A7%D9%84">عرض الكل</Link></div>
        <StepProductRail products={businessRail} />
      </section>}

      {gamingRail.length > 0 && <section className="pl-home-section compact-laptop-section">
        <div className="pl-section-title"><div><h2>لابتوبات Gaming</h2><p>أداء قوي للألعاب والاستخدام الثقيل</p></div><Link href="/laptops?category=Gaming">عرض الكل</Link></div>
        <StepProductRail products={gamingRail} reverse />
      </section>}

      {gamingMediumRail.length > 0 && <section className="pl-home-section compact-laptop-section">
        <div className="pl-section-title"><div><h2>Gaming متوسط</h2><p>أداء متوازن للألعاب والدراسة</p></div><Link href="/laptops?category=Gaming%20%D9%85%D8%AA%D9%88%D8%B3%D8%B7">عرض الكل</Link></div>
        <StepProductRail products={gamingMediumRail} />
      </section>}

      <section className="pl-home-section pl-split-section ps-home-section">
        <div className="pl-split-banner" style={{backgroundImage:`url(${mergedMedia.playstation || defaultMedia.playstation})`}}><div><small>PLAYSTATION</small><h2>PlayStation</h2><p>PS4 و PS5 — أجهزة وقبضات وملحقات PlayStation.</p><Link href="/playstation">تصفح PlayStation</Link></div></div>
        <div className="pl-split-products"><div className="pl-section-title"><h2>PlayStation</h2><Link href="/playstation">عرض الكل</Link></div><div className="ps-family-home-rail">
          <Link href="/playstation?family=ps4" className="ps-family-home-card" style={{backgroundImage:`url(${ps4Products[0]?.image || mergedMedia.playstation || defaultMedia.playstation})`}}><span>PS4</span><b>PlayStation 4</b><small>تصفح أجهزة PS4</small></Link>
          <Link href="/playstation?family=ps5" className="ps-family-home-card" style={{backgroundImage:`url(${ps5Products[0]?.image || mergedMedia.playstation || defaultMedia.playstation})`}}><span>PS5</span><b>PlayStation 5</b><small>تصفح أجهزة PS5</small></Link>
        </div>{psProducts.length>0&&<PlaystationProductRail products={psProducts.slice(0,8)}/>}</div>
      </section>

      {digitalHomeProducts.length > 0 && <section className="pl-home-section pl-split-section">
        <div className="pl-split-banner" style={{backgroundImage:`url(${mergedMedia.promos.digital || '/catalog/promo-digital.png'})`}}><div><small>DIGITAL SERVICES</small><h2>الخدمات الرقمية</h2><p>شحن ألعاب، بطاقات، أكواد وخدمات رقمية.</p><Link href="/services">تصفح الخدمات</Link></div></div>
        <div className="pl-split-products"><div className="pl-section-title"><h2>الخدمات الرقمية</h2><Link href="/services">عرض الكل</Link></div><DigitalHomeProductRail products={digitalHomeProducts}/></div>
      </section>}

      <section className="pl-home-section pl-split-section webdev-home-section" dir="rtl">
        <div className="pl-split-banner" style={{backgroundImage:`url(${mergedMedia.promos.web || defaultMedia.promos.web})`}}>
          <div><small>WEB DEVELOPMENT</small><h2>برمجة وتصميم المواقع</h2><p>متاجر إلكترونية، Portfolio، مواقع شركات ومنصات ويب — من الفكرة للتنفيذ.</p><Link href="/web-dev">تصفح كل الخدمات</Link></div>
        </div>
        <div className="pl-split-products home-web-products">
          <div className="pl-section-title"><div><h2>خدمات المواقع</h2><p>اختار الخدمة المناسبة لمشروعك</p></div><Link href="/web-dev">عرض الكل</Link></div>
          <div className="home-web-service-grid">
            {[
              ['برمجة متجر إلكتروني','متجر كامل مع المنتجات والطلبات والدفع ولوحة تحكم.','🛒'],
              ['برمجة موقع Portfolio','موقع شخصي احترافي لعرض أعمالك ومشاريعك وخبرتك.','💼'],
              ['موقع شركة وأعمال','موقع احترافي للشركات والخدمات مع صفحات ومعلومات التواصل.','🏢'],
              ['Landing Page','صفحة هبوط سريعة للحملات والإعلانات والمشاريع الجديدة.','🚀'],
              ['منصة ويب مخصصة','نظام ويب مخصص حسب فكرة المشروع والوظائف المطلوبة.','⚙️'],
              ['لوحة تحكم وربط API','لوحات تحكم وربط خدمات وقواعد بيانات وواجهات API.','🔗'],
            ].map(([title,desc,icon]) => <Link key={title} href={`/web-dev/request?service=${encodeURIComponent(title)}`} className="home-web-service-card"><span className="home-web-service-icon">{icon}</span><div><h3>{title}</h3><p>{desc}</p></div><b>اطلب الخدمة ←</b></Link>)}
          </div>
        </div>
      </section>

      <section className="pl-promo-grid">
        {promoTiles.map((tile, i) => <Link href={tile.href} key={tile.href} className={`pl-promo-card p${i}`} style={{ backgroundImage: `url(${tile.image})` }}><div><small>BKKARI TECH</small><h3>{tile.title}</h3><p>{tile.text}</p><b>تصفح القسم ←</b></div></Link>)}
      </section>

      <section className="pl-home-section pl-custom-pc" style={{ backgroundImage: `url(${mergedMedia.pc_builder || defaultMedia.pc_builder})` }}>
        <div className="pl-pc-copy"><small>PC BUILDER</small><h2>بدك PC على مواصفاتك؟</h2><p>حدد الميزانية والاستخدام والمواصفات، ومنرجعلك باقتراح مناسب.</p><Link href="/pc-builder">اطلب تجميعتك ←</Link></div>
      </section>

      <section className="pl-trust-grid">
        <div><b>★</b><span>منتجات أصلية</span><small>وضمان حقيقي</small></div><div><b>🚚</b><span>شحن للمحافظات</span><small>بأمان وسرعة</small></div><div><b>🛡</b><span>دفع آمن</span><small>متعدد الطرق</small></div><div><b>🎧</b><span>دعم فني سريع</span><small>24/7</small></div>
      </section>
    </main>
    <Footer/><AIChat/>
  </div>;
}
