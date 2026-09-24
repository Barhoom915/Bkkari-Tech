"use client";
import { useEffect, useState } from "react";
export type StoreNotice = { id?: string|number; title?: string; text?: string; icon?: string };

export default function StorefrontNotices({ notices }: { notices: StoreNotice[] }) {
  const base = notices.filter(x => x && (x.title || x.text) && !/أخبار|تحديثات|آخر الأخبار|news|update/i.test(`${x.title ?? ""} ${x.text ?? ""}`));
  const items = [...base, ...base, ...base];
  const [paused, setPaused] = useState(false);
  if (!base.length) return null;
  return <section className={`store-notices ${paused ? "is-paused" : ""}`} dir="rtl" aria-label="إعلانات المتجر">
    <div className="store-notices-viewport">
      <div className="store-notices-track" dir="ltr" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onTouchStart={()=>setPaused(true)} onTouchEnd={()=>setPaused(false)}>
        {items.map((n,i)=><article key={`${n.id||i}-${i}`} dir="rtl"><span>{n.icon||"✦"}</span><div><b>{n.title}</b><p>{n.text}</p></div></article>)}
      </div>
    </div>
  </section>;
}
