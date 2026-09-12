import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import type { Laptop } from "@/app/lib/types";
import ProductCardsGrid from "./ProductCardsGrid";
import Reveal from "./motion/Reveal";

async function getFeaturedLaptops(): Promise<Laptop[]> {
  const { data, error } = await supabase
    .from("laptops")
    .select("*")
    .eq("is_available", true)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    console.error("Supabase error (featured laptops):", error.message);
    return [];
  }
  return (data ?? []).filter((l: Laptop) => l.is_offer || (l.prev_price != null && Number(l.prev_price) > Number(l.price))).slice(0, 8);
}

export default async function FeaturedOffers() {
  const products = await getFeaturedLaptops();

  return (
    <section className="bg-surface py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">🔥 عروض مميزة</h2>
            <p className="mt-2 text-sm text-ink-soft">العروض الحالية من كل الشركات والأنواع</p>
          </div>
          <div className="flex flex-wrap gap-3"><Link href="/offers" className="text-sm font-bold text-orange transition-colors hover:text-orange/80">كل العروض ←</Link><Link href="/laptops" className="text-sm font-medium text-blue transition-colors hover:text-blue-deep">شاهد كل اللابتوبات ←</Link></div>
        </Reveal>

        <ProductCardsGrid products={products} />
      </div>
    </section>
  );
}
