"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const categories = [
  {
    href: "/laptops",
    title: "اللابتوبات",
    desc: "Gaming، مكتبي، وGaming متوسط حسب الشركة",
    tag: "تشكيلة متنوعة",
    icon: <path d="M4 16V6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v10M2 19h20l-1.5-3h-17L2 19Z" />,
  },
  {
    href: "/services",
    title: "الألعاب والخدمات الرقمية",
    desc: "شحن ألعاب، تطبيقات، بطاقات رقمية",
    tag: "تنفيذ سريع",
    icon: <path d="M6 12h4m-2-2v4M15 13h.01M18 11h.01M8 8h8a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v0a4 4 0 0 1 4-4Z" />,
  },
  {
    href: "/web-dev",
    title: "تصميم وبرمجة المواقع",
    desc: "مواقع، متاجر، Landing Pages",
    tag: "عرض سعر مجاني",
    icon: <path d="m8 9-3 3 3 3m8-6 3 3-3 3M13 6l-2 12" />,
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function CategoryGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        className="mb-10 text-center"
      >
        <h2 className="text-2xl font-bold text-ink sm:text-3xl">أقسام المتجر</h2>
        <p className="mt-2 text-sm text-ink-soft">
          كل خدمات بكاري تيك مرتبة بمكان واحد — اختار القسم وبلّش.
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="grid gap-5 md:grid-cols-3"
      >
        {categories.map((cat) => (
          <motion.div key={cat.href} variants={cardVariant}>
            <Link href={cat.href} className="block h-full">
              <motion.div
                whileHover={{ y: -8, boxShadow: "0 24px 40px -20px rgba(15,42,74,0.35)" }}
                whileTap={{ scale: 0.98 }}
                className="group flex h-full flex-col rounded-[2rem] border border-line bg-card p-7 shadow-[0_12px_40px_rgba(15,42,74,0.06)]"
              >
                <motion.div
                  className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue/10 text-blue"
                  whileHover={{ rotate: [0, -8, 8, 0], backgroundColor: "#2e8bd8", color: "#fff" }}
                  transition={{ duration: 0.5 }}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    {cat.icon}
                  </svg>
                </motion.div>
                <h3 className="text-lg font-semibold text-ink">{cat.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{cat.desc}</p>
                <span className="mt-4 inline-flex w-fit rounded-full bg-orange-soft px-3 py-1 text-xs font-medium text-orange">
                  {cat.tag}
                </span>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
