import Link from "next/link";
import type { DigitalHomeProduct } from "./StorefrontRails";
import { DigitalHomeProductRail } from "./StorefrontRails";

const categories = [
  { key: "games", label: "ألعاب", sub: "PUBG · Free Fire · Roblox", image: "/catalog/cat-gaming.png", href: "/services/games" },
  { key: "chat", label: "تطبيقات وشات", sub: "Telegram · Discord · Premium", image: "/catalog/cat-digital.png", href: "/services/chat" },
  { key: "cards", label: "بطاقات واشتراكات", sub: "Gift Cards · PlayStation · خدمات", image: "/catalog/cat-accessories.png", href: "/services?type=cards" },
];

export default function DigitalHomeSection({ products, banner }: { products: DigitalHomeProduct[]; banner: string }) {
  return <section className="pl-home-section pl-split-section digital-home-section">
    <div className="pl-split-banner" style={{ backgroundImage: `url(${banner})` }}>
      <div><small>DIGITAL SERVICES</small><h2>الخدمات الرقمية</h2><p>ألعاب، تطبيقات وشات، بطاقات واشتراكات — كل الخدمات بمكان واحد.</p><Link href="/services">تصفح كل الخدمات</Link></div>
    </div>
    <div className="pl-split-products">
      <div className="pl-section-title"><div><h2>الخدمات الرقمية</h2><p>اختصارات سريعة للأقسام الرقمية.</p></div><Link href="/services">عرض الأقسام</Link></div>

      <div className="digital-family-home-rail" aria-label="اختصارات الخدمات الرقمية">
        {categories.map(c => <Link key={c.key} href={c.href} className="digital-family-home-card">
          <span className="digital-family-home-image" style={{ backgroundImage: `url(${c.image})` }} />
          <span className="digital-family-home-overlay" />
          <span className="digital-family-home-copy"><small>DIGITAL</small><b>{c.label}</b><em>{c.sub}</em></span>
          <span className="digital-family-home-arrow">←</span>
        </Link>)}
      </div>

      <div className="digital-all-label"><span>كل الخدمات الرقمية</span><Link href="/services">عرض الأقسام ←</Link></div>
      <div className="digital-home-products-heading"><span>{products.length} خدمة متاحة</span></div>
      <div className="digital-home-product-rail-wrap">
        {products.length ? <DigitalHomeProductRail products={products} /> : <div className="digital-home-empty">ما في خدمات رقمية متاحة حالياً.</div>}
      </div>
    </div>
  </section>;
}

