import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { supabase } from "@/app/lib/supabase";

export const dynamic = "force-dynamic";

const storeSections = [
  { href: "/laptops", icon: "💻", label: "01", title: "اللابتوبات", desc: "Gaming، مكتبي، وGaming متوسط حسب الشركة" },
  { href: "/services", icon: "🎮", label: "02", title: "الألعاب والخدمات الرقمية", desc: "شحن ألعاب، تطبيقات، بطاقات رقمية" },
  { href: "/web-dev", icon: "⌘", label: "03", title: "تصميم وبرمجة المواقع", desc: "مواقع، متاجر، Landing Pages" },
  { href: "/pc-builder", icon: "🖥️", label: "04", title: "PC مكتبي و Gaming", desc: "طلبات تجميع حسب المواصفات والميزانية" },
  { href: "/playstation", icon: "🎮", label: "05", title: "PlayStation", desc: "PS4 و PS5 بمختلف الإصدارات — للتواصي" },
];

const fallbackLaptopCategories = ["Gaming", "مكتبي", "Gaming متوسط"];

async function getLaptopData() {
  const { data } = await supabase.from("laptops").select("category,brand").eq("is_available", true);
  const categories = Array.from(new Set((data ?? []).map((x) => x.category).filter(Boolean))) as string[];
  const brands = Array.from(new Set((data ?? []).map((x) => x.brand).filter(Boolean))) as string[];
  return { categories: categories.length ? categories : fallbackLaptopCategories, brands };
}

export default async function CategoriesPage() {
  const { categories: laptopCategories, brands } = await getLaptopData();

  return (
    <div className="site-shell">
      <Header />
      <main dir="rtl" className="categories-page">
        <section className="categories-hero">
          <div className="categories-hero-glow" />
          <div className="categories-wrap">
            <span className="v16-eyebrow">BKKARI / CATEGORIES</span>
            <h1>أقسام المتجر</h1>
            <p>اختار القسم اللي بدك ياه، وبعدها فوت مباشرة على المنتجات والخدمات.</p>
          </div>
        </section>

        <section className="categories-section">
          <div className="categories-wrap">
            <div className="categories-title-row"><div><span className="v16-eyebrow">STORE</span><h2>كل المتجر بمكان واحد</h2></div><span className="categories-count">5 أقسام رئيسية</span></div>

            <div className="store-section-grid">
              {storeSections.map((item) => (
                <Link href={item.href} key={item.href} className="store-section-card">
                  <div className="store-section-number">{item.label}</div>
                  <div className="store-section-icon">{item.icon}</div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                  <span className="store-section-link">استكشف القسم <b>←</b></span>
                </Link>
              ))}
            </div>
          </div>
        </section>


      </main>
      <Footer />
    </div>
  );
}
