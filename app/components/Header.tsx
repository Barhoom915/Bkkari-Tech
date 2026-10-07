"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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

export default function Header() {
  const { totalCount } = useCart();
  const pathname = usePathname();
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

      <div className={`market-search-row ${searchOpen ? "search-is-open" : ""}`}>
        <div className="market-search-inner">
          <form className={`market-header-search ${searchOpen ? "search-form-open" : ""}`} onSubmit={(e) => { e.preventDefault(); submitSearch(); }}>
            <button type="button" className="market-search-compass" aria-label="فتح البحث" onClick={() => setSearchOpen(true)}><svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="19"/><path d="M30.5 17.5 27 27l-9.5 3.5L21 21z"/><path d="M24 5v5M24 38v5M5 24h5M38 24h5"/></svg></button>
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
          {searchOpen && (
            <div className="novatek-search-suggest" dir="rtl">
              <div className="novatek-search-suggest-head">
                <strong>{searchText.trim() ? "اقتراحات البحث" : "ابحث بسرعة"}</strong>
                {searchHistory.length > 0 && <button type="button" onClick={() => { setSearchHistory([]); try { localStorage.removeItem("novatek-search-history"); } catch {} }}>مسح السجل</button>}
              </div>
              {!searchText.trim() && searchHistory.length > 0 && (
                <div className="novatek-search-history-row">
                  {searchHistory.slice(0, 5).map(term => <button key={term} type="button" onClick={() => { setSearchText(term); submitSearch(term); }}>↺ {term}</button>)}
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
