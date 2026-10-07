"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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

const SEARCH_SUGGESTIONS = [
  { label: "لابتوبات", query: "لابتوب", icon: "💻", keywords: "لابتوب لاب توب لابتوبات لابتوب محمول laptop notebook" },
  { label: "Gaming", query: "gaming", icon: "🎮", keywords: "gaming جيمنج قيمنق ألعاب قيمنغ" },
  { label: "PS5", query: "PS5", icon: "🎮", keywords: "ps5 بلايستيشن بلاي ستيشن بلايستيشن 5" },
  { label: "PS4", query: "PS4", icon: "🎮", keywords: "ps4 بلايستيشن بلاي ستيشن بلايستيشن 4" },
  { label: "قبضات PlayStation", query: "يد تحكم", icon: "🕹️", keywords: "يد تحكم قبضة يد كنترول controller dualsense dualshock" },
  { label: "ألعاب", query: "ألعاب", icon: "🎮", keywords: "لعبة العاب ألعاب game games سيديات cd" },
  { label: "PUBG / ببجي", query: "ببجي", icon: "⚡", keywords: "ببجي ببجى pubg uc يو سي شحن" },
  { label: "Free Fire / فري فاير", query: "فري فاير", icon: "🔥", keywords: "فري فاير فريفاير free fire دايموند diamonds" },
  { label: "بطاقات وشحن", query: "بطاقات", icon: "💳", keywords: "بطاقات كروت شحن كرت بطاقة cards gift card" },
  { label: "اشتراكات", query: "اشتراك", icon: "⭐", keywords: "اشتراك اشتراكات اشتراك شهري premium بريميوم subscription" },
  { label: "iPhone / آيفون", query: "ايفون", icon: "📱", keywords: "ايفون آيفون اى فون iphone" },
  { label: "Samsung / سامسونج", query: "سامسونج", icon: "📱", keywords: "سامسونج samsung جالكسي galaxy" },
  { label: "Xiaomi / شاومي", query: "شاومي", icon: "📱", keywords: "شاومي xiaomi ريدمي redmi بوكو poco" },
  { label: "Dell", query: "Dell", icon: "💻", keywords: "dell ديل" },
  { label: "HP", query: "HP", icon: "💻", keywords: "hp اتش بي" },
  { label: "Lenovo / لينوفو", query: "Lenovo", icon: "💻", keywords: "lenovo لينوفو" },
  { label: "ASUS / أسوس", query: "ASUS", icon: "💻", keywords: "asus اسوس أسوس" },
  { label: "MacBook / ماك", query: "MacBook", icon: "🍎", keywords: "macbook ماك بوك ماك" },
];

function normalizeSearchText(value: string) {
  return String(value || "").toLowerCase().normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي")
    .replace(/ؤ/g, "و").replace(/ئ/g, "ي").replace(/[ـ_\-]/g, " ")
    .replace(/\s+/g, " ").trim();
}


function DrawerIcon({name}:{name:string}) {
  const paths: Record<string, ReactNode> = {
    home: <><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/></>,
    products: <><path d="m4 8 8-4 8 4-8 4-8-4Z"/><path d="M4 8v9l8 4 8-4V8"/><path d="M12 12v9"/></>,
    offers: <><path d="M20.5 13.5 13.5 20.5a2 2 0 0 1-2.8 0L3.5 13.3a2 2 0 0 1 0-2.8L10.5 3.5H18a2 2 0 0 1 2 2v7.5a2 2 0 0 1 .5.5Z"/><circle cx="15.5" cy="8.5" r="1.2"/></>,
    pc: <><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></>,
    playstation: <><path d="M9 5.5v13"/><path d="M9 6.2c2.4-.8 5.1.1 6.4 1.7 1.1 1.4.4 3.2-1.5 3.8l-3.7 1.2"/><path d="m9 16.5-3.5 1.2c-1.7.6-2.8-.1-2.8-1.3 0-1 .8-1.8 2-2.2L9 13"/><path d="m15 14 4 1.4c1.2.4 1.9 1.2 1.9 2.2 0 1.2-1.1 1.9-2.8 1.3L15 17.7"/></>,
    services: <><path d="M12 3 5 13h5l-1 8 7-10h-5l1-8Z"/></>,
    code: <><path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/></>,
    gaming: <><path d="M7 8h10a4 4 0 0 1 3.7 2.5l1.5 4c.7 2-1.1 4-3.2 3.3l-3.5-1.2a11 11 0 0 0-7 0L5 17.8c-2.1.7-3.9-1.3-3.2-3.3l1.5-4A4 4 0 0 1 7 8Z"/><path d="M7 11v4M5 13h4M16.5 12.5h.01M19 14h.01"/></>,
    laptop: <><rect x="4" y="4" width="16" height="11" rx="1.5"/><path d="M2.5 19h19M8 19h8"/></>,
    heart: <path d="M20.8 8.7c0 5.2-8.8 10.1-8.8 10.1S3.2 13.9 3.2 8.7A4.7 4.7 0 0 1 12 6.4a4.7 4.7 0 0 1 8.8 2.3Z"/>,
    orders: <><path d="M6 4h12v17H6z"/><path d="M9 4a3 3 0 0 1 6 0M9 10h6M9 14h6M9 18h4"/></>,
    contact: <><path d="M4 5.5h16v11H8l-4 3v-14Z"/><path d="M8 9h8M8 12h5"/></>,
    wallet: <><path d="M4 6.5h15a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a3 3 0 0 1 3-3h12"/><path d="M17 13h4"/><circle cx="17" cy="13" r=".7"/></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.products}</svg>;
}

function HeaderContent() {
  const { totalCount } = useCart();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

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

  useEffect(() => {
    if (pathname === "/search") setSearchText(searchParams.get("q") || "");
  }, [pathname, searchParams]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.classList.toggle("menu-locked", menuOpen);
    return () => document.body.classList.remove("menu-locked");
  }, [menuOpen]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("novatek-search-history") || "[]");
      if (Array.isArray(saved)) setSearchHistory(saved.filter((x): x is string => typeof x === "string").slice(0, 8));
    } catch {}
  }, []);

  const saveSearch = (value: string) => {
    const term = value.trim();
    if (!term) return;
    setSearchHistory(prev => {
      const next = [term, ...prev.filter(x => normalizeSearchText(x) !== normalizeSearchText(term))].slice(0, 8);
      try { localStorage.setItem("novatek-search-history", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const submitSearch = (value = searchText) => {
    const term = value.trim();
    if (!term) return;
    saveSearch(term);
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const filteredSuggestions = useMemo(() => {
    const term = normalizeSearchText(searchText);
    if (!term) return SEARCH_SUGGESTIONS.slice(0, 7);
    return SEARCH_SUGGESTIONS
      .filter(item => normalizeSearchText(`${item.label} ${item.query} ${item.keywords}`).includes(term))
      .slice(0, 7);
  }, [searchText]);

  const accountName = String(
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.user_name ||
    user?.user_metadata?.preferred_username ||
    user?.email?.split("@")[0] ||
    "زائر"
  );
  const accountAvatar = String(user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "");

  async function handleLogout() {
    const ok = window.confirm("⚠️ تحذير\n\nرح يتم تسجيل الخروج من حسابك. تأكد إنك ما عندك عملية غير محفوظة.\n\nهل تريد تسجيل الخروج؟");
    if (!ok) return;
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const desktopNav = [
    { href: "/categories", label: "كل المنتجات", icon: "🛍️" },
    { href: "/offers", label: "العروض", icon: "🔥" },
    { href: "/pc-builder", label: "PC Builder", icon: "🖥️" },
    { href: "/playstation", label: "PlayStation", icon: "🎮" },
    { href: "/services", label: "الخدمات الرقمية", icon: "⚡" },
    { href: "/web-dev", label: "تصميم وبرمجة", icon: "💻" },
    { href: "/laptops?category=gaming", label: "Gaming", icon: "🎮" },
    { href: "/laptops", label: "اللابتوبات", icon: "💻" },
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

      <div className={`market-search-row ${searchOpen ? "search-is-open" : ""}`}>
        <div className="market-search-inner">
          <form className={`market-header-search ${searchOpen ? "search-form-open" : ""}`} onSubmit={(e) => { e.preventDefault(); submitSearch(); }}>
            <input
              name="q"
              value={searchText}
              onChange={(e) => { setSearchText(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              placeholder="ابحث عن أي شيء: لابتوب، PS5، ببجي، فري فاير، اشتراك، بطاقات..."
              aria-label="البحث في المتجر"
              autoComplete="off"
            />
            <button aria-label="بحث" type="submit">بحث</button>
          </form>
          {!searchOpen && searchHistory.length > 0 && (
            <div className="novatek-search-history-under" dir="rtl" aria-label="سجل البحث">
              <div className="novatek-search-history-under-head">
                <strong>سجل البحث</strong>
                <button type="button" onClick={() => { setSearchHistory([]); try { localStorage.removeItem("novatek-search-history"); } catch {} }}>مسح الكل</button>
              </div>
              <div className="novatek-search-history-under-list">
                {searchHistory.slice(0, 8).map(term => (
                  <div className="novatek-search-history-item" key={`under-${term}`}>
                    <button type="button" className="novatek-search-history-open" onClick={() => { setSearchText(term); setSearchOpen(true); }}>
                      <span className="novatek-search-history-clock">↺</span>
                      <b>{term}</b>
                    </button>
                    <button type="button" className="novatek-search-history-remove" aria-label={`حذف ${term} من السجل`} onClick={() => {
                      setSearchHistory(prev => {
                        const next = prev.filter(x => x !== term);
                        try { localStorage.setItem("novatek-search-history", JSON.stringify(next)); } catch {}
                        return next;
                      });
                    }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {searchOpen && (
            <div className="novatek-search-suggest" dir="rtl">
              <div className="novatek-search-suggest-head">
                <strong>{searchText.trim() ? "اقتراحات البحث" : "ابحث بسرعة"}</strong>
                {searchHistory.length > 0 && <button type="button" onClick={() => { setSearchHistory([]); try { localStorage.removeItem("novatek-search-history"); } catch {} }}>مسح السجل</button>}
              </div>
              {!searchText.trim() && searchHistory.length > 0 && (
                <div className="novatek-search-history-list" aria-label="سجل البحث">
                  {searchHistory.slice(0, 8).map(term => (
                    <div className="novatek-search-history-item" key={term}>
                      <button
                        type="button"
                        className="novatek-search-history-open"
                        onClick={() => { setSearchText(term); submitSearch(term); }}
                      >
                        <span className="novatek-search-history-clock">↺</span>
                        <b>{term}</b>
                      </button>
                      <button
                        type="button"
                        className="novatek-search-history-remove"
                        aria-label={`حذف ${term} من السجل`}
                        onClick={() => {
                          setSearchHistory(prev => {
                            const next = prev.filter(x => x !== term);
                            try { localStorage.setItem("novatek-search-history", JSON.stringify(next)); } catch {}
                            return next;
                          });
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="novatek-search-suggestion-grid">
                {filteredSuggestions.map(item => <button key={item.query} type="button" onClick={() => { setSearchText(item.query); submitSearch(item.query); }}>
                  <span>{item.icon}</span><b>{item.label}</b><small>{item.query}</small><i>←</i>
                </button>)}
              </div>
              {searchText.trim() && <button type="button" className="novatek-search-all" onClick={() => submitSearch(searchText)}>البحث عن «{searchText.trim()}» في كل المتجر ←</button>}
            </div>
          )}
        </div>
      </div>
      {searchOpen && <button type="button" className="novatek-search-backdrop" aria-label="إغلاق البحث" onClick={() => setSearchOpen(false)} />}

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
        <div className="drawer-profile-head">
          <button className="drawer-close" type="button" onClick={() => setMenuOpen(false)} aria-label="إغلاق">×</button>
          <div className="drawer-profile-info">
            <strong>{accountName}</strong>
            <b>{user?.email || "سجّل الدخول للوصول إلى حسابك"}</b>
          </div>
          <Link href="/account" className="drawer-profile-avatar" onClick={() => setMenuOpen(false)} aria-label="الحساب">
            {accountAvatar ? <img src={accountAvatar} alt="" /> : <span>{accountName.slice(0, 1).toUpperCase()}</span>}
          </Link>
        </div>
        {user ? (
          <div className="drawer-wallet-card">
            <div className="drawer-wallet-icon"><DrawerIcon name="wallet" /></div>
            <div className="drawer-wallet-copy"><small>رصيدك</small><strong>${walletBalance === null ? "..." : walletBalance.toFixed(2)}</strong></div>
            <Link href="/wallet" onClick={() => setMenuOpen(false)} className="drawer-wallet-add"><span>+</span><b>إضافة رصيد</b></Link>
          </div>
        ) : (
          <Link href="/login" className="drawer-login drawer-login-card" onClick={() => setMenuOpen(false)}>تسجيل الدخول</Link>
        )}
        <div className="drawer-nav">
          <Link href="/" onPointerDown={() => router.prefetch("/")} onClick={() => setMenuOpen(false)} className={pathname === "/" ? "active" : ""}>
            <i className="drawer-nav-icon"><DrawerIcon name="home" /></i><span>الرئيسية</span><b aria-hidden="true">←</b>
          </Link>
          {desktopNav.map(item => {
            const iconName = item.href === "/categories" ? "products" : item.href === "/offers" ? "offers" : item.href === "/pc-builder" ? "pc" : item.href === "/playstation" ? "playstation" : item.href === "/services" ? "services" : item.href === "/web-dev" ? "code" : item.href.includes("gaming") ? "gaming" : "laptop";
            return <Link key={item.href} href={item.href} onPointerDown={() => router.prefetch(item.href.split("?")[0])} onClick={() => setMenuOpen(false)} className={pathname.startsWith(item.href.split("?")[0]) ? "active" : ""}>
              <i className="drawer-nav-icon"><DrawerIcon name={iconName} /></i><span>{item.label}</span><b aria-hidden="true">←</b>
            </Link>;
          })}
          <Link href="/wishlist" onPointerDown={() => router.prefetch("/wishlist")} onClick={() => setMenuOpen(false)} className={pathname.startsWith("/wishlist") ? "active" : ""}>
            <i className="drawer-nav-icon"><DrawerIcon name="heart" /></i><span>المفضلة</span><b aria-hidden="true">←</b>
          </Link>
          <Link href="/purchase-history" onPointerDown={() => router.prefetch("/purchase-history")} onClick={() => setMenuOpen(false)} className={pathname.startsWith("/purchase-history") ? "active" : ""}>
            <i className="drawer-nav-icon"><DrawerIcon name="orders" /></i><span>طلباتي</span><b aria-hidden="true">←</b>
          </Link>
          <Link href="/contact" onPointerDown={() => router.prefetch("/contact")} onClick={() => setMenuOpen(false)} className={pathname.startsWith("/contact") ? "active" : ""}>
            <i className="drawer-nav-icon"><DrawerIcon name="contact" /></i><span>تواصل معنا</span><b aria-hidden="true">←</b>
          </Link>
        </div>
        {user ? <button className="drawer-logout" onClick={handleLogout}>تسجيل الخروج</button> : <Link href="/login" className="drawer-login" onClick={() => setMenuOpen(false)}>تسجيل الدخول</Link>}
      </aside>
    </div>
    <MobileDock user={user} cartCount={totalCount} onMenu={() => setMenuOpen(true)}/>
  </>;

}

export default function Header() {
  return (
    <Suspense fallback={<div style={{ minHeight: 64 }} aria-hidden="true" />}>
      <HeaderContent />
    </Suspense>
  );
}
