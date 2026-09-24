import { supabase } from "@/app/lib/supabase";
import type { Laptop } from "@/app/lib/types";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import LaptopCatalog from "@/app/components/LaptopCatalog";
import BrandShowcase from "@/app/components/BrandShowcase";
import Link from "next/link";
import LaptopArtwork from "@/app/components/LaptopArtwork";
import { getSiteSetting } from "@/app/lib/site-settings";

export const dynamic = "force-dynamic";
export const revalidate = 30;
async function getLaptops(): Promise<Laptop[]> {
  const { data, error } = await supabase.from("laptops").select("*").eq("is_available", true).order("created_at", { ascending: false });
  if (error) { console.error(error.message); return []; }
  return data ?? [];
}

const categoryInfo: Record<string,{icon:string;title:string}> = { Gaming:{icon:"🎮",title:"Gaming"}, "Gaming متوسط":{icon:"🎮",title:"Gaming متوسط"}, "مكتبي":{icon:"🖥️",title:"مكتبي"}, Desktop:{icon:"🖥️",title:"مكتبي"} };
function allowedCategories(brand:string, available:string[]){const hasGaming=available.some(c=>/gaming/i.test(c));const hasDesktop=available.some(c=>/desktop|مكتبي|business|design/i.test(c));const r=[hasGaming?"Gaming":null,hasGaming?"Gaming متوسط":null,hasDesktop?"مكتبي":null].filter(Boolean) as string[];return r.length?r:["مكتبي"];}
function normalizeCategory(raw:string){const v=String(raw||"").toLowerCase();if(/gaming\s*(medium|mid)|gaming متوسط|متوسط/.test(v))return "Gaming متوسط";if(/gaming|game|ألعاب|gtx|rtx|quadro|radeon|geforce/.test(v))return "Gaming";if(/business|أعمال/.test(v))return "أعمال";if(/desktop|مكتبي|student|دراسة|design|تصميم/.test(v))return "مكتبي";return "مكتبي";}
function CategoryChooser({categories,brand}:{categories:string[];brand:string}){const shown=allowedCategories(brand,categories);return <section className="laptop-type-picker"><div className="laptop-type-head"><div><span>CHOOSE TYPE</span><h2>شو نوع {brand} اللي بدك ياه؟</h2><p>اختار نوع الجهاز، وبعدها بتشوف أجهزة {brand} ضمنه مباشرة.</p></div><Link href="/laptops" className="picker-back">تغيير الشركة ←</Link></div><div className="laptop-type-grid">{shown.map(c=>{const info=categoryInfo[c]??{icon:"💻",title:c};return <Link key={c} href={`/laptops?brand=${encodeURIComponent(brand)}&category=${encodeURIComponent(c)}`} className="laptop-type-card"><span className="type-icon">{info.icon}</span><div><strong>{info.title}</strong><small>تصفح أجهزة {brand} ضمن هذا النوع ←</small></div></Link>})}</div></section>;}

export default async function LaptopsPage({ searchParams }: { searchParams: Promise<{ brand?: string; category?: string }> }) {
  const { brand: selectedBrand = "all", category: selectedCategory = "all" } = await searchParams;
  const normalizeBrand = (raw:string) => { const v=String(raw||"").trim(); const k=v.toLowerCase().replace(/[\s_-]+/g,""); if(["asus","أسوس","اسوس"].includes(v.toLowerCase())||["asus","أسوس","اسوس"].includes(k)) return "ASUS"; if(["apple","ابل","آبل"].includes(v.toLowerCase())||["apple","ابل","آبل"].includes(k)) return "Apple"; return v; };
  const selectedBrandNormalized = selectedBrand === "all" ? "all" : normalizeBrand(selectedBrand);
  const laptops = (await getLaptops()).filter(l => Boolean(l.images?.[0]));
  const counts = laptops.reduce((m, l) => { if (l.brand) m[l.brand] = (m[l.brand] ?? 0) + 1; return m; }, {} as Record<string, number>);
  const brands = Array.from(new Set(laptops.map(l => normalizeBrand(String(l.brand||''))).filter(Boolean)));
  const normalizedCounts = laptops.reduce((m,l)=>{const b=normalizeBrand(String(l.brand||'')); if(b)m[b]=(m[b]||0)+1; return m;},{} as Record<string,number>);
  const mediaForBrands = await getSiteSetting<any>("storefront_media", {});
  const brandLogos = mediaForBrands?.laptop_brand_logos || {};
  const visible = laptops.filter((l) => {
    const brandOk = selectedBrandNormalized === "all" || normalizeBrand(String(l.brand||"")) === selectedBrandNormalized;
    if (!brandOk) return false;
    if (selectedCategory === "all") return true;
    return normalizeCategory(String(l.category ?? "")) === normalizeCategory(selectedCategory);
  });

  return <><Header/><main className="laptops-v18-page unified-page" dir="rtl">
    <div className="section-breadcrumb"><Link href="/">الرئيسية</Link><span>»</span><Link href="/laptops">اللابتوبات</Link>{selectedCategory !== "all" && <><span>»</span><strong>{selectedCategory}</strong></>}{selectedBrandNormalized !== "all" && <><span>»</span><strong>{selectedBrandNormalized}</strong></>}</div>
    <div className="laptop-page-wrap unified-catalog">
      <BrandShowcase brands={brands} counts={normalizedCounts} selectedBrand={selectedBrandNormalized !== "all" ? selectedBrandNormalized : undefined} logoMap={brandLogos} />
      <section className="unified-products-section laptop-products-clean">
        <div className="laptop-catalog-count"><strong>{visible.length} جهاز</strong></div>
        <LaptopCatalog laptops={visible} initialBrand="all" initialCategory="all"/>
      </section>
    </div>
  </main><Footer/></>;
}
