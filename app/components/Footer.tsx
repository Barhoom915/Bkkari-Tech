"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeLanguageControls from "./ThemeLanguageControls";
import { createClient } from "@/app/lib/supabase-browser";

const contacts = [
  { label: "واتساب", value: "0936426605", href: "https://wa.me/963936426605", icon: "◉" },
  { label: "تيليغرام", value: "@NexCode9", href: "https://t.me/NexCode9", icon: "✈" },
  { label: "الإيميل", value: "ibrahimbkkari51@gmail.com", href: "mailto:ibrahimbkkari51@gmail.com", icon: "✉" },
  { label: "فيسبوك", value: "Bkkari Tech", href: "https://www.facebook.com/share/1BZU7LUd2o/", icon: "f" },
];

const links = [
  { title: "المتجر", items: [["اللابتوبات", "/laptops"], ["PC مكتبي و Gaming", "/pc-builder"], ["PlayStation", "/playstation"], ["الخدمات الرقمية", "/services"], ["برمجة المواقع", "/web-dev"], ["العروض", "/offers"]] },
  { title: "الدعم", items: [["التوصيل والشحن", "/delivery"], ["الأسئلة الشائعة", "/faq"], ["تتبع الطلب", "/track"], ["تواصل معنا", "/contact"]] },
  { title: "قانوني", items: [["سياسة الخصوصية", "/privacy"], ["الشروط والأحكام", "/terms"], ["الاستبدال والاسترجاع", "/returns"]] },
];

export default function Footer() {
  const [dynamicContacts, setDynamicContacts] = useState(contacts);
  useEffect(() => {
    createClient().from("site_settings").select("value").eq("key", "contact").maybeSingle().then((result: { data: { value: unknown } | null }) => {
      const cfg = result.data?.value as Partial<Record<string,string>> | undefined;
      if (!cfg) return;
      setDynamicContacts(contacts.map((item) => item.label === "واتساب" ? { ...item, value: cfg.phone || item.value, href: cfg.whatsapp ? `https://wa.me/${cfg.whatsapp}` : item.href } : item.label === "تيليغرام" ? { ...item, value: cfg.telegram || item.value, href: cfg.telegram ? `https://t.me/${String(cfg.telegram).replace(/^@/,"")}` : item.href } : item.label === "الإيميل" ? { ...item, value: cfg.email || item.value, href: cfg.email ? `mailto:${cfg.email}` : item.href } : item.label === "فيسبوك" ? { ...item, value: "Bkkari Tech", href: cfg.facebook || item.href } : item));
    });
  }, []);
  return <footer className="bt-footer" dir="rtl">
    <div className="bt-footer-wrap">
      <div className="bt-footer-main">
        <div className="bt-footer-brand"><p>متجر تقني ورقمي — لابتوبات، PC مكتبي وGaming، PlayStation، خدمات رقمية، وتصميم وبرمجة مواقع — مع توصيل وشحن حسب المحافظة.</p><Link href="/contact" className="bt-footer-support">تواصل مع فريق الدعم ←</Link></div>
        {links.map(col => <div key={col.title} className="bt-footer-col"><h4>{col.title}</h4>{col.items.map(([label,href]) => <Link key={href} href={href}>{label}</Link>)}</div>)}
      </div>
      <div className="bt-footer-contact-head"><div><span>CONNECT / SUPPORT</span><h3>اختار طريقة التواصل المناسبة إلك</h3></div><Link href="/rewards">⭐ النقاط والإحالة</Link></div>
      <div className="bt-contact-grid">{dynamicContacts.map(c => <a key={c.label} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="bt-contact-card"><span className="bt-contact-icon">{c.icon}</span><span><b>{c.label}</b><small>{c.value}</small></span><strong>↗</strong></a>)}</div>
      <div className="bt-footer-bottom"><span>© {new Date().getFullYear()} Bkkari Tech — جميع الحقوق محفوظة</span><ThemeLanguageControls /></div>
    </div>
  </footer>;
}
