"use client";
import { useEffect, useRef, useState } from "react";
export type StoreNotice = { id?: string|number; title?: string; text?: string; icon?: string };
export default function StorefrontNotices({ notices }: { notices: StoreNotice[] }) {
  const base = notices.filter(x => x && (x.title || x.text)); const items=[...base,...base,...base]; const ref=useRef<HTMLDivElement>(null); const [paused,setPaused]=useState(false);
  useEffect(()=>{if(base.length<2)return;const el=ref.current;if(!el)return;const step=(el.scrollWidth/3);el.scrollLeft=step;const id=window.setInterval(()=>{if(paused||document.hidden)return;el.scrollBy({left:220,behavior:"smooth"});window.setTimeout(()=>{if(el.scrollLeft>step*2.1)el.scrollLeft-=step;if(el.scrollLeft<step*.45)el.scrollLeft+=step},550)},2600);return()=>window.clearInterval(id)},[base.length,paused]);
  if(!base.length)return null;
  return <section className="store-notices" dir="rtl"><div className="store-notices-head"><b>ملاحظات المتجر</b><span>معلومات وتحديثات</span></div><div ref={ref} className="store-notices-track pl-draggable-window" dir="ltr" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onTouchStart={()=>setPaused(true)} onTouchEnd={()=>setPaused(false)}>{items.map((n,i)=><article key={`${n.id||i}-${i}`} dir="rtl"><span>{n.icon||"ℹ️"}</span><div><b>{n.title}</b><p>{n.text}</p></div></article>)}</div></section>;
}
