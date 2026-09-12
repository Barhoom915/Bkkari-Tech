"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/app/lib/cart-context";

export default function AddDigitalToCart({
  id,
  name,
  price,
  maxQuantity,
}: {
  id: string;
  name: string;
  price: number;
  maxQuantity: number;
}) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const max = Math.max(1, maxQuantity || 1);

  function add() {
    addItem({ id, name, price }, qty);
    setAdded(true);
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-full border border-line bg-white p-1">
          <button type="button" onClick={() => setQty((v) => Math.max(1, v - 1))} className="h-9 w-9 rounded-full text-lg text-ink-soft hover:bg-surface">−</button>
          <span className="w-9 text-center text-sm font-bold text-ink">{qty}</span>
          <button type="button" onClick={() => setQty((v) => Math.min(max, v + 1))} className="h-9 w-9 rounded-full text-lg text-ink-soft hover:bg-surface">+</button>
        </div>
        <button type="button" onClick={add} className="flex-1 rounded-full bg-blue px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg">
          أضف للسلة
        </button>
      </div>
      {added && (
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-blue/10 px-4 py-3 text-sm">
          <span className="font-semibold text-blue">تمت الإضافة للسلة ✓</span>
          <Link href="/cart" className="font-bold text-ink underline underline-offset-4">عرض السلة</Link>
        </div>
      )}
    </div>
  );
}
