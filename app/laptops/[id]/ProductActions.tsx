"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/app/lib/supabase";
import { useCart } from "@/app/lib/cart-context";
import type { Laptop } from "@/app/lib/types";

export default function ProductActions({ laptop }: { laptop: Laptop }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [viewsToday, setViewsToday] = useState<number | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    supabase.rpc("increment_product_view", { p_laptop_id: laptop.id }).then(() => {
      supabase
        .from("product_views")
        .select("view_count")
        .eq("laptop_id", laptop.id)
        .eq("viewed_on", new Date().toISOString().slice(0, 10))
        .maybeSingle()
        .then(({ data }) => {
          if (data) setViewsToday(data.view_count);
        });
    });
  }, [laptop.id]);

  function handleAdd() {
    addItem({ id: `laptop-${laptop.id}`, name: laptop.name, price: laptop.price, image: laptop.images?.[0], details: [laptop.brand,laptop.model,laptop.cpu,laptop.ram,laptop.storage].filter(Boolean).join(" • "), note: note.trim() }, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div>
      {viewsToday !== null && viewsToday > 3 && (
        <p className="mb-3 text-xs text-orange">
          👀 {viewsToday} شخص شاف هالمنتج اليوم
        </p>
      )}

      <label className="mb-4 block text-sm font-semibold text-ink"><span>ملاحظة عند طلب المنتج <small className="font-normal text-ink-soft">(اختياري)</small></span><textarea value={note} onChange={e=>setNote(e.target.value)} rows={3} placeholder={laptop.order_note || "مثلاً: بدي فحص البطارية قبل التسليم..."} className="mt-2 w-full rounded-2xl border border-line bg-surface p-3 text-sm outline-none focus:border-blue"/></label>
      <div className="flex gap-3">
        <motion.button
          onClick={handleAdd}
          whileTap={{ scale: 0.96 }}
          className="flex-1 rounded-full bg-blue px-6 py-3 text-sm font-semibold text-white"
        >
          {added ? "✓ انضاف للسلة" : "أضف للسلة"}
        </motion.button>
        <a
          href={`https://wa.me/963936426605?text=${encodeURIComponent(`مرحبا، بدي أستفسر عن: ${laptop.name}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center rounded-full border border-line px-5 text-sm text-ink-soft transition-colors hover:border-blue hover:text-blue"
        >
          واتساب
        </a>
      </div>
    </div>
  );
}
