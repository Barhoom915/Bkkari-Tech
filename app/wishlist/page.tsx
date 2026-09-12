import { redirect } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import { createClient } from "@/app/lib/supabase-server";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import FavoriteButton from "@/app/components/FavoriteButton";
import type { Laptop } from "@/app/lib/types";
import LaptopArtwork from "@/app/components/LaptopArtwork";

export const dynamic = "force-dynamic";
export default async function WishlistPage() {
  const server = await createClient();
  const { data: { user } } = await server.auth.getUser();
  if (!user) redirect("/login?next=/wishlist");
  const { data: rows } = await server.from("wishlists").select("laptop_id").eq("user_id", user.id).order("created_at", { ascending: false });
  const ids = (rows ?? []).map(r => r.laptop_id);
  let laptops: Laptop[] = [];
  if (ids.length) { const { data } = await supabase.from("laptops").select("*").in("id", ids); laptops = data ?? []; }
  return <><Header/><main className="mx-auto max-w-6xl px-4 py-10" dir="rtl"><div className="wishlist-hero"><div><span>YOUR SAVED DEVICES</span><h1>المفضلة ❤️</h1><p>الأجهزة اللي حفظتها للرجوع إلها بأي وقت.</p></div><Link href="/laptops" className="rounded-full bg-blue px-5 py-2.5 text-sm font-bold text-white">تصفح اللابتوبات</Link></div>{laptops.length?<div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{laptops.map(l=><article key={l.id} className="wishlist-card"><div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-surface"><Link href={`/laptops/${l.id}`} className="absolute inset-0"><>{l.images?.[0]?<img src={l.images[0]} alt={l.name} className="h-full w-full object-cover"/>:<span className="grid h-full place-items-center p-6"><LaptopArtwork brand={l.brand} category={l.category} /></span>}</></Link><FavoriteButton laptopId={l.id} className="absolute left-3 top-3 z-10"/></div><div className="p-5"><p className="text-xs font-bold text-blue">{l.brand}</p><Link href={`/laptops/${l.id}`}><h2 className="mt-1 font-extrabold text-ink">{l.name}</h2></Link><p className="mt-2 text-xs text-ink-soft">{[l.cpu,l.ram,l.storage].filter(Boolean).join(" • ")}</p><strong className="mt-4 block text-xl text-ink">${l.price}</strong></div></article>)}</div>:<div className="mt-7 rounded-3xl border border-dashed border-line bg-surface p-12 text-center"><div className="text-4xl">♡</div><h2 className="mt-3 text-xl font-extrabold text-ink">المفضلة فاضية</h2><p className="mt-2 text-sm text-ink-soft">اضغط القلب على أي لابتوب حتى ينحفظ هون.</p></div>}</main><Footer/></>;
}
