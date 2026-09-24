"use client";
import Link from "next/link";
import {useMemo,useState} from "react";
import type {Laptop} from "@/app/lib/types";

function normalize(value:string){return String(value||"").toLowerCase().normalize("NFKD").replace(/[\u064B-\u065F\u0670]/g,"").replace(/[إأآٱ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي").replace(/ؤ/g,"و").replace(/ئ/g,"ي").replace(/[ـ_\-]/g," ").replace(/\s+/g," ").trim()}
function aliases(value:string){const x=normalize(value); const out=new Set([x]); const map:[RegExp,string[]][]=[[/بلاي ?ستيشن|play ?station/i,["playstation","ps","بلايستيشن","بلاي ستيشن"]],[/ببجي|pubg|يو سي|uc/i,["pubg","ببجي","uc"]],[/فري ?فاير|free ?fire/i,["free fire","فري فاير","دايموند","diamonds"]],[/جواكر|jawaker/i,["jawaker","جواكر"]],[/اشتراك|premium|بريميوم/i,["اشتراك","premium"]],[/ايفون|اى ?فون|iphone/i,["iphone","ايفون"]],[/لابتوب|لاب توب|laptop/i,["laptop","لابتوب","لاب توب"]]]; for(const [re,vals] of map) if(re.test(x)) vals.forEach(v=>out.add(normalize(v))); return [...out]}

type PS=any; type Digital={id:string;name:string;price:number;image:string|null;type:string;href:string;meta:string};
export default function SearchResults({laptops,playstation,digital,initialQuery}:{laptops:Laptop[];playstation:PS[];digital:Digital[];initialQuery:string}){
 const [q,setQ]=useState(initialQuery);
 const terms=useMemo(()=>aliases(q),[q]);
 const match=(fields:string[])=>{if(!q.trim())return true; const hay=normalize(fields.filter(Boolean).join(" ")); return terms.some(t=>hay.includes(t))};
 const items=useMemo(()=>{
  const a=laptops.filter(l=>match([l.name,l.brand||"",l.model||"",l.cpu||"",l.ram||"",l.storage||"",l.gpu||"",l.category,l.sku||""])).map(l=>({id:`l-${l.id}`,name:l.name,price:Number(l.price),image:l.images?.[0]||null,type:"laptop",href:`/laptops/${l.id}`,meta:[l.brand,l.cpu,l.ram,l.storage].filter(Boolean).join(" • ")}));
  const b=playstation.filter(p=>match([p.name,p.family,p.model,p.storage,p.condition,p.product_type])).map(p=>({id:`p-${p.id}`,name:p.name,price:Number(p.price),image:p.image||null,type:"playstation",href:`/playstation/${p.id}`,meta:[p.family?.toUpperCase(),p.model,p.storage,p.product_type==="controller"?"يد تحكم":""].filter(Boolean).join(" • ")}));
  const c=digital.filter(p=>match([p.name,p.meta])).map(p=>p);
  return [...a,...b,...c].slice(0,80);
 },[laptops,playstation,digital,q,terms]);
 return <div className="v71-search-results"><div className="v71-search-box"><span>⌕</span><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="ابحث عن أي شيء: لابتوب، PS5، ببجي، فري فاير، اشتراك..."/><b>{items.length} نتيجة</b></div><div className="v71-search-grid">{items.map(item=><Link key={item.id} href={item.href} className="v71-search-card"><div className="v71-search-image">{item.image?<img src={item.image} alt="" loading="lazy"/>:<b>{item.type==="playstation"?"PS":"⚡"}</b>}</div><div><span>{item.type==="laptop"?"لابتوب":item.type==="playstation"?"PlayStation":"خدمة رقمية"}</span><h2>{item.name}</h2><p>{item.meta}</p><strong>${item.price.toFixed(2)}</strong></div></Link>)}</div>{!items.length&&<div className="v71-search-empty">ما لقينا نتائج. جرّب اسم المنتج أو الشركة أو كلمة مثل <b>ببجي، فري فاير، PS5، اشتراك، لابتوب</b>.</div>}</div>;
}
