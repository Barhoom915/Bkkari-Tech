"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";

const items = [
  { href: "/", label: "الرئيسية", icon: "home", type: "link" },
  { href: "#menu", label: "القائمة", icon: "menu", type: "menu" },
  { href: "/offers", label: "العروض", icon: "tag", type: "link" },
  { href: "/account", label: "حسابي", icon: "user", type: "link" },
  { href: "/cart", label: "السلة", icon: "cart", type: "link" },
] as const;

function Icon({ name }: { name: string }) {
  const common = { width: 21, height: 21, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "home") return <svg {...common}><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>;
  if (name === "menu") return <svg {...common}><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
  if (name === "tag") return <svg {...common}><path d="m20 13-7 7-9-9V4h7z"/><circle cx="7.5" cy="7.5" r="1"/></svg>;
  if (name === "cart") return <svg {...common}><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M3 4h2l2.2 11a2 2 0 0 0 2 1.6h7.5a2 2 0 0 0 2-1.6L21 8H6"/></svg>;
  return <svg {...common}><circle cx="12" cy="8" r="3.2"/><path d="M5 20c.8-3.2 3.2-5 7-5s6.2 1.8 7 5"/></svg>;
}

export default function MobileDock({ user, cartCount, onMenu }: { user: User | null; cartCount: number; onMenu: () => void }) {
  const pathname = usePathname();
  return <div className="mobile-dock-wrap lg:hidden">
    <nav className="mobile-dock" aria-label="التنقل السريع">
      {items.map((item) => {
        const active = item.type === "link" && (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));
        const content = <><span className="mobile-dock-icon">{item.label === "حسابي" && user?.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} alt="" /> : <Icon name={item.icon} />}{item.label === "السلة" && cartCount > 0 && <b className="mobile-dock-badge">{cartCount}</b>}</span><span className="mobile-dock-label">{item.label}</span></>;
        return item.type === "menu" ? <button key={item.label} type="button" className="mobile-dock-item" onClick={onMenu}>{content}</button> : <Link key={item.label} href={item.href} className={`mobile-dock-item ${active ? "is-active" : ""}`}>{content}</Link>;
      })}
    </nav>
  </div>;
}
