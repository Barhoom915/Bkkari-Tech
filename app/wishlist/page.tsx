import { redirect } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import { createClient } from "@/app/lib/supabase-server";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import FavoriteButton from "@/app/components/FavoriteButton";
import type { Laptop } from "@/app/lib/types";

export const dynamic = "force-dynamic";
export default async function WishlistPage() {
  const server = await createClient();
  const { data: { user } } = await server.auth.getUser();
  if (!user) redirect("/login?next=/wishlist");
  const { data: rows } = await server.from("wishlists").select("laptop_id").eq("user_id", user.id).order("created_at", { ascending: false });
  const ids = (rows ?? []).map(r => r.laptop_id);
  let laptops: Laptop[] = [];
  if (ids.length) { const { data } = await supabase.from("laptops").select("*").in("id", ids); laptops = (data ?? []).filter((l:any)=>Boolean(l.images?.[0])); }
  return <><Header/><main className="v71-wishlist-page" dir="rtl">
    <header className="v71-simple-head"><div><span>WISHLIST</span><h1>المفضلة <b>♥</b></h1><p>أجهزتك المحفوظة، مرتبة ببطاقات صغيرة ومناسبة للموبايل.</p></div><Link href="/laptops">تصفح اللابتوبات ←</Link></header>
    {laptops.length ? <div className="v71-wishlist-grid">{laptops.map(l=><article className="v71-wish-card" key={l.id}>
      <div className="v71-wish-image"><Link href={`/laptops/${l.id}`}><img src={l.images[0]} alt={l.name} loading="lazy"/></Link><FavoriteButton laptopId={l.id}/></div>
      <div className="v71-wish-body"><span>{l.brand}</span><Link href={`/laptops/${l.id}`}><h2>{l.name}</h2></Link><p>{[l.cpu,l.ram,l.storage].filter(Boolean).join(" • ")}</p><div><strong>${Number(l.price).toFixed(0)}</strong><Link href={`/laptops/${l.id}`}>التفاصيل</Link></div></div>
    </article>)}</div> : <section className="v71-wish-empty"><b>♡</b><h2>المفضلة فاضية</h2><p>لما تضغط القلب على منتج، رح يطلع هون.</p><Link href="/laptops">تصفح المنتجات</Link></section>}
  </main><Footer/></>;
}
