"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const slides = [
  {
    title: "🔥 عروض اللابتوبات",
    subtitle: "عروض مختارة على أجهزة بمختلف الفئات — تابع الجديد باستمرار",
    accent: "from-blue-deep to-blue",
  },
  {
    title: "🎮 شحن ألعاب فوري",
    subtitle: "شحن ألعاب وتطبيقات وبطاقات رقمية بأسرع وقت",
    accent: "from-[#0f2a4a] to-blue-deep",
  },
  {
    title: "🌐 موقعك جاهز خلال أيام",
    subtitle: "تصميم وبرمجة مواقع احترافية بأسعار تنافسية",
    accent: "from-orange to-[#f0821e]",
  },
];

export default function OffersSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <div className="relative h-40 overflow-hidden rounded-2xl sm:h-48">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
            className={`absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-l ${slides[index].accent} px-6 text-center text-white`}
          >
            <h3 className="text-xl font-bold sm:text-2xl">{slides[index].title}</h3>
            <p className="max-w-md text-sm text-white/85 sm:text-base">
              {slides[index].subtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`عرض ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
