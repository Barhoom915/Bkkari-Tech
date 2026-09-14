"use client";
import Link from "next/link";
import { motion } from "framer-motion";

const floating = [
  { cls: "v16-float-one", icon: "⚡", text: "DIGITAL" },
  { cls: "v16-float-two", icon: "◈", text: "WEB" },
  { cls: "v16-float-three", icon: "▣", text: "LAPTOPS" },
];

export default function HeroAnimated() {
  return (
    <section className="v16-hero">
      <div className="v16-noise" />
      <div className="v16-grid-bg" />
      <div className="v16-hero-glow v16-glow-blue" />
      <div className="v16-hero-glow v16-glow-orange" />
      {floating.map((item) => <motion.div key={item.text} className={`v16-floating ${item.cls}`} animate={{ y: [0, -13, 0], rotate: [-2, 2, -2] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}><b>{item.icon}</b><span>{item.text}</span></motion.div>)}
      <div className="v16-container v16-hero-inner">
        <motion.div initial={{ opacity: 0, y: 35 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8 }} className="v16-hero-copy">
          <span className="v16-hero-kicker"><i /> متجر تقني ورقمي — BKKARI TECH</span>
          <h1>التقنية،<br /><span>بس بطريقة</span> مختلفة.</h1>
          <p>لابتوبات مختارة. خدمات رقمية. مواقع احترافية. كل شي بمكان واحد، بتجربة أسرع وأوضح.</p>
          <div className="v16-hero-actions"><Link href="/laptops" className="v16-main-button">تصفح المتجر <span>↗</span></Link><Link href="/web-dev/request" className="v16-ghost-button">اطلب موقعك</Link></div>
          <div className="v16-trust"><span>✦ تشكيلة متنوعة من اللابتوبات</span><span>✦ شحن للمحافظات</span><span>✦ دعم مباشر</span></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: .9, x: 25 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: 1, delay: .15 }} className="v16-hero-visual">
          <div className="v16-hero-ring ring-a" /><div className="v16-hero-ring ring-b" />
          <div className="v16-device-card">
            <div className="v16-device-top"><span>BK / 2026</span><span>● LIVE</span></div>
            <div className="v16-device-screen"><div className="screen-line l1"/><div className="screen-line l2"/><div className="screen-line l3"/><div className="screen-orb">B</div></div>
            <div className="v16-device-bottom"><strong>TECH<br />WITHOUT<br />LIMITS.</strong><span>01 — 03</span></div>
          </div>
          <div className="v16-mini-card"><span>CURATED</span><strong>BK</strong><small>selected laptops</small></div>
        </motion.div>
      </div>
      <div className="v16-scroll-cue"><span>SCROLL</span><i /></div>
    </section>
  );
}
