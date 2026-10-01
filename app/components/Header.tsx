"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase-browser";
import MobileDock from "./MobileDock";
import { useCart } from "@/app/lib/cart-context";
import NotificationBell from "./NotificationBell";
import ThemeLanguageControls from "./ThemeLanguageControls";

const nav = [
  { href: "/offers", label: "العروض", icon: "🏷️" },
  { href: "/account", label: "حسابي", icon: "👤" },
];

export default function Header() {
  const { totalCount } = useCart();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async (nextUser: User | null) => {
      if (!alive) return;
      setUser(nextUser);
      if (!nextUser) { setWalletBalance(null); return; }
      const { data } = await supabase.from("wallets").select("balance").eq("user_id", nextUser.id).maybeSingle();
      if (alive) setWalletBalance(Number(data?.balance ?? 0));
    };
    supabase.auth.getUser().then((r: { data: { user: User | null } }) => void load(r.data.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => void load(session?.user ?? null));
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, [supabase]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.classList.toggle("menu-locked", menuOpen);
    return () => document.body.classList.remove("menu-locked");
  }, [menuOpen]);

  async function handleLogout() {
    const ok = window.confirm("⚠️ تحذير\n\nرح يتم تسجيل الخروج من حسابك. تأكد إنك ما عندك عملية غير محفوظة.\n\nهل تريد تسجيل الخروج؟");
    if (!ok) return;
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const desktopNav = [
    { href: "/categories", label: "كل المنتجات" },
    { href: "/offers", label: "العروض" },
    { href: "/pc-builder", label: "PC Builder" },
    { href: "/playstation", label: "PlayStation" },
    { href: "/services", label: "الخدمات الرقمية" },
    { href: "/web-dev", label: "تصميم وبرمجة" },
    { href: "/laptops?category=gaming", label: "Gaming" },
    { href: "/laptops", label: "اللابتوبات" },
  ];

  return <>
    <header className="market-header" dir="rtl">
            <div className="market-brand-row">
        <div className="market-brand-inner">
          <div className="market-header-utilities header-controls-lowered" dir="ltr">
            <div className="market-header-actions-group market-header-actions-left">
              <ThemeLanguageControls compact />
              <NotificationBell />
            </div>
            <div className="market-header-actions-group market-header-actions-right" dir="rtl">
              {user ? <Link href="/wallet" className="market-wallet-pill" aria-label="رصيد المحفظة"><span>رصيدي</span><b>{walletBalance === null ? "..." : `$${walletBalance.toFixed(2)}`}</b></Link> : <Link href="/login" className="market-login-pill">دخول</Link>}
              {user && <Link href="/wallet" className="market-wallet-topup" aria-label="شحن المحفظة"><span>+</span><b>شحن</b></Link>}
            </div>
          </div>
          <Link href="/" className="market-brand-wordmark" aria-label="NOVATEK">
            <img src="/brand/novatek-logo-transparent.png" alt="NOVATEK" />
          </Link>
        </div>
      </div>

      <div className="market-search-row">
        <div className="market-search-inner">
          <form action="/search" className="market-header-search">
            <span className="market-search-compass" aria-hidden="true"><svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="19"/><path d="M30.5 17.5 27 27l-9.5 3.5L21 21z"/><path d="M24 5v5M24 38v5M5 24h5M38 24h5"/></svg></span>
            <input name="q" placeholder="ابحث عن أي شيء: لابتوب، PS5، ببجي، فري فاير، اشتراك، بطاقات..." aria-label="البحث في المتجر" />
            <button aria-label="بحث" type="submit">بحث</button>
          </form>
        </div>
      </div>

      <nav className="market-nav-row" aria-label="التنقل الرئيسي">
        <div className="market-main-nav">
          <button type="button" className="market-menu-btn" onClick={() => setMenuOpen(true)} aria-label="فتح القائمة"><span></span><b>القائمة</b></button>
          {desktopNav.map(item => <Link key={item.href} href={item.href} className={pathname.startsWith(item.href.split("?")[0]) ? "active" : ""}>{item.label}</Link>)}
          <Link href="/cart" className="market-cart" aria-label="السلة"><span className="market-cart-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M3 4h2l2.2 10.1a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6"/><circle cx="10" cy="19" r="1.4"/><circle cx="18" cy="19" r="1.4"/></svg></span><em>السلة</em>{totalCount > 0 && <b>{totalCount}</b>}</Link>
        </div>
      </nav>
    </header>

    <div className={`market-drawer-layer ${menuOpen ? "show" : ""}`} onMouseDown={() => setMenuOpen(false)} aria-hidden={!menuOpen}>
      <aside className="market-drawer" onMouseDown={e => e.stopPropagation()} dir="rtl">
        <div className="drawer-head"><div><small>NOVATEK</small><strong>القائمة</strong></div><button onClick={() => setMenuOpen(false)} aria-label="إغلاق">×</button></div>
        {user && <Link href="/wallet" className="drawer-wallet"><span><small>رصيد المحفظة</small><b>${walletBalance === null ? "..." : walletBalance.toFixed(2)}</b></span><i>+</i></Link>}
        <div className="drawer-nav">
          <Link href="/" onClick={() => setMenuOpen(false)}>⌂ <span>الرئيسية</span><b>←</b></Link>
          {desktopNav.map(item => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={pathname.startsWith(item.href.split("?")[0]) ? "active" : ""}>• <span>{item.label}</span><b>←</b></Link>)}
          <Link href="/wishlist" onClick={() => setMenuOpen(false)}>♡ <span>المفضلة</span><b>←</b></Link>
          <Link href="/purchase-history" onClick={() => setMenuOpen(false)}>▤ <span>طلباتي</span><b>←</b></Link>
          <Link href="/contact" onClick={() => setMenuOpen(false)}>◌ <span>تواصل معنا</span><b>←</b></Link>
        </div>
        {user ? <button className="drawer-logout" onClick={handleLogout}>تسجيل الخروج</button> : <Link href="/login" className="drawer-login" onClick={() => setMenuOpen(false)}>تسجيل الدخول</Link>}
      </aside>
    </div>
    <MobileDock user={user} cartCount={totalCount} onMenu={() => setMenuOpen(true)}/>
  </>;

}
