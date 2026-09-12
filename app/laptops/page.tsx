import { supabase } from "@/app/lib/supabase";
import type { Laptop } from "@/app/lib/types";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import LaptopCatalog from "@/app/components/LaptopCatalog";
import BrandShowcase from "@/app/components/BrandShowcase";
import Link from "next/link";
import LaptopArtwork from "@/app/components/LaptopArtwork";

export const dynamic = "force-dynamic";
async function getLaptops(): Promise<Laptop[]> {
  const { data, error } = await supabase.from("laptops").select("*").eq("is_available", true).order("created_at", { ascending: false });
  if (error) { console.error(error.message); return []; }
  return data ?? [];
}

const categoryInfo: Record<string,{icon:string;title:string}> = { Gaming:{icon:"🎮",title:"Gaming"}, "Gaming متوسط":{icon:"🎮",title:"Gaming متوسط"}, "مكتبي":{icon:"🖥️",title:"مكتبي"}, Desktop:{icon:"🖥️",title:"مكتبي"} };
function allowedCategories(brand:string, available:string[]){if(brand==="Apple")return ["مكتبي"];const hasGaming=available.some(c=>/gaming/i.test(c));const hasDesktop=available.some(c=>/desktop|مكتبي|business|design/i.test(c));const r=[hasGaming?"Gaming":null,hasGaming?"Gaming متوسط":null,hasDesktop?"مكتبي":null].filter(Boolean) as string[];return r.length?r:["مكتبي"];}
function normalizeCategory(raw:string){if(/student/i.test(raw))return "مكتبي";if(/business|desktop|design|مكتبي/i.test(raw))return "مكتبي";if(/gaming/i.test(raw))return raw.toLowerCase().includes("medium")||raw.includes("متوسط")?"Gaming متوسط":"Gaming";return "مكتبي";}
function CategoryChooser({categories,brand}:{categories:string[];brand:string}){const shown=allowedCategories(brand,categories);return <section className="laptop-type-picker"><div className="laptop-type-head"><div><span>CHOOSE TYPE</span><h2>شو نوع {brand} اللي بدك ياه؟</h2><p>اختار نوع الجهاز، وبعدها بتشوف أجهزة {brand} ضمنه مباشرة.</p></div><Link href="/laptops" className="picker-back">تغيير الشركة ←</Link></div><div className="laptop-type-grid">{shown.map(c=>{const info=categoryInfo[c]??{icon:"💻",title:c};return <Link key={c} href={`/laptops?brand=${encodeURIComponent(brand)}&category=${encodeURIComponent(c)}`} className="laptop-type-card"><span className="type-icon">{info.icon}</span><div><strong>{info.title}</strong><small>تصفح أجهزة {brand} ضمن هذا النوع ←</small></div></Link>})}</div></section>;}

export default async function LaptopsPage({ searchParams }: { searchParams: Promise<{ brand?: string; category?: string }> }) {
  const { brand: selectedBrand = "all", category: selectedCategory = "all" } = await searchParams;
  const laptops = await getLaptops();
  const counts = laptops.reduce((m, l) => { if (l.brand) m[l.brand] = (m[l.brand] ?? 0) + 1; return m; }, {} as Record<string, number>);
  const brands = Array.from(new Set(laptops.map(l => l.brand).filter(Boolean) as string[]));
  const brandLaptops = selectedBrand !== "all" ? laptops.filter(l=>l.brand===selectedBrand) : laptops;
  const categories = selectedBrand !== "all" ? Array.from(new Set(brandLaptops.map(l=>l.category).filter(Boolean) as string[])) : [];
  const visible = selectedBrand !== "all" && selectedCategory !== "all" ? brandLaptops.filter(l=>normalizeCategory(String(l.category || ""))===selectedCategory) : selectedBrand !== "all" ? brandLaptops : laptops;
  const offers = laptops.filter(l => l.is_offer || (l.prev_price != null && Number(l.prev_price) > Number(l.price)));

  return <><Header/><main className="laptops-v18-page" dir="rtl">
    <section className="laptop-hero-v18"><div><span>BKKARI TECH / LAPTOPS</span><h1>كل اللابتوبات بمكان واحد.</h1><p>{selectedBrand === "all" ? "شوف كل الأجهزة من كل الشركات، وإذا بدك خصّص التصفح اختار شعار الشركة من الشريط." : `أجهزة ${selectedBrand} جاهزة للاختيار — حدد النوع إذا بدك تصفّي النتائج.`}</p></div></section>
    <div className="laptop-page-wrap">
      <BrandShowcase brands={brands} counts={counts} selectedBrand={selectedBrand !== "all" ? selectedBrand : undefined}/>
      {selectedBrand !== "all" && selectedCategory === "all" && <CategoryChooser categories={categories} brand={selectedBrand}/>} 
      {selectedCategory !== "all" ? <div className="catalog-context"><span>الجهاز المختار</span><strong>{selectedBrand} · {selectedCategory}</strong><Link href={`/laptops?brand=${encodeURIComponent(selectedBrand)}`}>تغيير النوع ←</Link></div> : selectedBrand !== "all" ? <div className="catalog-context"><span>كل أجهزة الشركة</span><strong>{selectedBrand}</strong><Link href="/laptops">كل الشركات ←</Link></div> : <div className="catalog-context"><span>CATALOG</span><strong>كل الأجهزة</strong><span className="context-note">من كل الشركات والأنواع</span></div>}
      <LaptopCatalog laptops={visible} initialBrand="all" initialCategory="all"/>
      {selectedBrand === "all" && offers.length > 0 && <section className="laptop-home-offers"><div className="laptop-offers-head"><div><span>HOT LAPTOP DEALS</span><h2>🔥 عروض اللابتوبات</h2><p>عروض من كل الشركات وكل الأنواع.</p></div><Link href="/offers">كل العروض ←</Link></div><div className="laptop-offers-row">{offers.slice(0,12).map(l=><Link key={l.id} href={`/laptops/${l.id}`} className="mini-offer-card"><div>{l.images?.[0]?<img src={l.images[0]} alt={l.name}/>:<LaptopArtwork brand={l.brand} category={l.category} />}</div><b>{l.name}</b><small>{l.brand} · {l.category}</small><strong>${l.price}</strong></Link>)}</div></section>}
    </div>
  </main><Footer/></>;
}
