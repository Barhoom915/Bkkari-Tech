"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase-browser";
import MobileDock from "./MobileDock";
import ThemeLanguageControls from "./ThemeLanguageControls";
import { useCart } from "@/app/lib/cart-context";

const nav = [
  { href: "/offers", label: "العروض", icon: "🏷️" },
  { href: "/account", label: "حسابي", icon: "👤" },
];

export default function Header() {
  const { totalCount } = useCart();
  const pathname = usePathname();
  const supabase = createClient();
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

  async function handleLogout() { await supabase.auth.signOut(); window.location.href = "/login"; }

  return <>
    <header className="market-header">
      <div className="market-topbar">
        <div className="market-topbar-inner">
          <span>📍 سوريا - دمشق</span>
          <span>🚚 شحن لجميع المحافظات</span>
          <span>☎️ 0936426605</span>
          <span className="market-top-spacer" />
          <span>أهلاً فيك بـ Bkkari Tech</span>
          <ThemeLanguageControls compact />
        </div>
      </div>
      <div className="market-search-row">
        <div className="market-search-inner">
          <form action="/search" className="market-header-search">
            <span>⌕</span><input name="q" placeholder="ابحث عن منتج، فئة أو كلمة تجارية..." aria-label="البحث في المتجر"/><button aria-label="بحث">بحث</button>
          </form>
          <ThemeLanguageControls compact />
        </div>
      </div>
      </header>

    <div className={`market-drawer-layer ${menuOpen ? "show" : ""}`} onMouseDown={() => setMenuOpen(false)} aria-hidden={!menuOpen}>
      <aside className="market-drawer" onMouseDown={e => e.stopPropagation()}>
        <div className="drawer-head"><div><small>BKKARI TECH</small><strong>القائمة</strong></div><button onClick={() => setMenuOpen(false)} aria-label="إغلاق">×</button></div>
        {user && <Link href="/wallet" className="drawer-wallet"><span><small>رصيد المحفظة</small><b>${walletBalance === null ? "..." : walletBalance.toFixed(2)}</b></span><i>+</i></Link>}
        <div className="drawer-nav">
          <Link href="/" onClick={() => setMenuOpen(false)}>الرئيسية</Link>
          {nav.map(item => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={pathname.startsWith(item.href) ? "active" : ""}>{item.icon} <span>{item.label}</span><b>←</b></Link>)}
          <Link href="/wishlist" onClick={() => setMenuOpen(false)}>♡ <span>المفضلة</span><b>←</b></Link>
          <Link href="/purchase-history" onClick={() => setMenuOpen(false)}>▤ <span>طلباتي</span><b>←</b></Link>
          <Link href="/contact" onClick={() => setMenuOpen(false)}>◌ <span>تواصل معنا</span><b>←</b></Link>
        </div>
        <div className="drawer-settings"><span>المظهر واللغة</span><ThemeLanguageControls /></div>
        {user ? <button className="drawer-logout" onClick={handleLogout}>تسجيل الخروج</button> : <Link href="/login" className="drawer-login" onClick={() => setMenuOpen(false)}>تسجيل الدخول</Link>}
      </aside>
    </div>
    <MobileDock user={user} cartCount={totalCount} onMenu={() => setMenuOpen(true)}/>
  </>;
}
