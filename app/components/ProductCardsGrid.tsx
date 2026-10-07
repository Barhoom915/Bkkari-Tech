"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useCart } from "@/app/lib/cart-context";
import type { Laptop } from "@/app/lib/types";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const card = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function ProductCardsGrid({ products }: { products: Laptop[] }) {
  const { addItem } = useCart();

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-card p-10 text-center text-sm text-ink-soft">
        لسا ما في عروض مميزة مضافة. أضفها من لوحة التحكم أو فعّل خيار
        &quot;عرض مميز&quot; على أي منتج.
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {products.map((p) => (
        <motion.article
          key={p.id}
          variants={card}
          whileHover={{ y: -6, boxShadow: "0 20px 34px -18px rgba(15,42,74,0.3)" }}
          className="flex flex-col rounded-2xl border border-line bg-card p-5"
        >
          <Link href={`/laptops/${p.id}`} className="mb-4 flex aspect-[4/3] items-center justify-center rounded-xl bg-surface text-ink-soft/40">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M4 16V6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v10M2 19h20l-1.5-3h-17L2 19Z" />
            </svg>
          </Link>

          <Link href={`/laptops/${p.id}`}>
            <h3 className="font-semibold text-ink hover:text-blue">{p.name}</h3>
          </Link>
          <p className="font-mono-data mt-1 text-xs text-ink-soft">
            {[p.cpu, p.ram, p.storage].filter(Boolean).join(" / ")}
          </p>
          <p className="mt-1 text-xs text-ink-soft">{p.condition}</p>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-xl font-bold text-ink">${p.price}</span>
            {p.prev_price && (
              <span className="text-sm text-ink-soft/60 line-through">${p.prev_price}</span>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => addItem({ id: String(p.id), name: p.name, price: p.price }, 1)}
              className="flex-1 rounded-full bg-blue px-4 py-2 text-sm font-semibold text-white"
            >
              أضف للسلة
            </motion.button>
            <motion.a
              whileTap={{ scale: 0.9 }}
              href="https://wa.me/963936426605"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-full border border-line px-3 text-ink-soft transition-colors hover:border-blue hover:text-blue"
              aria-label="تواصل واتساب"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2c-5.5 0-10 4.5-10 10 0 1.77.46 3.5 1.34 5.02L2 22l5.13-1.35A10 10 0 0 0 12.04 22c5.5 0 10-4.5 10-10s-4.5-10-10-10Zm5.87 14.3c-.25.7-1.45 1.34-2 1.42-.51.08-1.15.11-1.86-.12-.43-.14-.98-.32-1.68-.63-2.96-1.28-4.89-4.26-5.04-4.46-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.3.6-.37.8-.37.2 0 .4 0 .58.01.19.01.44-.07.68.53.25.6.85 2.08.92 2.23.07.15.12.33.02.53-.1.2-.15.32-.3.5-.15.18-.31.4-.44.53-.15.15-.3.31-.13.6.17.3.76 1.26 1.64 2.04 1.13 1 2.08 1.32 2.38 1.47.3.15.47.13.65-.08.18-.2.75-.87.95-1.17.2-.3.4-.25.66-.15.27.1 1.7.8 2 .95.3.15.5.22.57.35.07.13.07.75-.18 1.44Z" />
              </svg>
            </motion.a>
          </div>
        </motion.article>
      ))}
    </motion.div>
  );
}
