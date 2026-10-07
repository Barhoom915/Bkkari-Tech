"use client";

import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";

const stats = [
  { value: 14, prefix: "", suffix: "", label: "محافظة نغطيها بالشحن" },
  { value: 24, prefix: "", suffix: "/سا", label: "رد سريع عبر واتساب" },
  { value: 3, prefix: "", suffix: "", label: "أقسام رئيسية" },
];

function Counter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => `${prefix}${Math.round(v)}${suffix}`);

  useEffect(() => {
    if (inView) {
      const controls = animate(count, value, { duration: 1.4, ease: "easeOut" });
      return controls.stop;
    }
  }, [inView, value, count]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

export default function StatsBar() {
  return (
    <section className="border-y border-line bg-surface py-10">
      <div className="mx-auto grid max-w-6xl grid-cols-3 gap-4 px-4 sm:px-6">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="text-center"
          >
            <div className="text-2xl font-bold text-blue sm:text-3xl">
              <Counter value={s.value} prefix={s.prefix} suffix={s.suffix} />
            </div>
            <p className="mt-1 text-xs text-ink-soft sm:text-sm">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
