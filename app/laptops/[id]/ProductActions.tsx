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
    addItem({ id: String(laptop.id), name: laptop.name, price: laptop.price }, 1);
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
