"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Laptop } from "@/app/lib/types";

type Pref = { uses:string[]; priorities:string[]; weight:"low"|"medium"|"high"; screen:string[]; performance:"light"|"medium"|"strong"|"maximum"; gaming:"none"|"light"|"medium"|"heavy"; mobility:"low"|"medium"|"high"; budget:"lowest"|"value"|"fixed" };
const initial: Pref = {uses:[],priorities:[],weight:"medium",screen:[],performance:"strong",gaming:"medium",mobility:"medium",budget:"value"};
const questions = [
  ["uses","شو رح تستخدم اللابتوب؟",["Gaming","برمجة","دراسة","تصميم ومونتاج","شغل","ذكاء اصطناعي","استخدام يومي","متنوع"],true],
  ["priorities","شو أهم شي عندك؟",["performance","price","battery","screen","weight","build"],true],
  ["weight","قديش الوزن بيفرق معك؟",["low","medium","high"],false],
  ["screen","شو بهمك بالشاشة؟",["عادية","ألوان ودقة","تردد عالي للألعاب","دقة عالية"],true],
  ["performance","قديش بدك أداء؟",["light","medium","strong","maximum"],false],
  ["gaming","قديش الألعاب مهمة؟",["none","light","medium","heavy"],false],
  ["mobility","قديش البطارية والتنقل مهمين؟",["low","medium","high"],false],
  ["budget","شو موقفك من السعر؟",["lowest","value","fixed"],false],
] as const;

export default function LaptopCompareLauncher({ laptops }: { laptops: Laptop[] }) {
  const [selected, setSelected] = useState<number[]>([]);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [pref, setPref] = useState<Pref>(initial);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const chosen = useMemo(() => laptops.filter(l=>selected.includes(l.id)), [laptops,selected]);
  function toggle(id:number){setSelected(s=>s.includes(id)?s.filter(x=>x!==id):s.length<2?[...s,id]:s)}
  function setAnswer(key:string,value:string,multi:boolean){setPref(p=>{const current:any=(p as any)[key]; return {...p,[key]:multi?(Array.isArray(current)?(current.includes(value)?current.filter((x:string)=>x!==value):[...current,value]):[value]):value};})}
  async function run(){if(selected.length!==2)return;setBusy(true);try{const r=await fetch('/api/compare',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:selected,preferences:pref})});setResult(await r.json());}finally{setBusy(false)}}
  return <>
    <div className="compare-launcher-wrap">
      <div className="compare-launcher-head"><div><span>SMART COMPARISON</span><h2>اختار جهازين وخلي NOVATEK يختار الأنسب إلك</h2><p>مو شرط الأقوى يكون الأفضل. رح نسألك عن استخدامك وأولوياتك وبعدين نعطيك نتيجة مخصصة.</p></div><button type="button" onClick={()=>setOpen(true)} className="compare-open-btn">ابدأ المقارنة</button></div>
      <div className="compare-select-grid">{laptops.slice(0,30).map(l=><article key={l.id} className={selected.includes(l.id)?"compare-select-card selected":"compare-select-card"}><Link href={`/laptops/${l.id}`}><img src={l.images?.[0]} alt={l.name}/></Link><div><small>{l.brand}</small><b>{l.name}</b><strong>${l.price}</strong><button type="button" onClick={()=>toggle(l.id)}>{selected.includes(l.id)?"✓ مختار":"مقارنة"}</button></div></article>)}</div>
    </div>
    {open && <div className="compare-question-overlay"><div className="compare-question-modal" dir="rtl"><button className="compare-close" onClick={()=>setOpen(false)}>×</button><span>STEP {step+1}/{questions.length}</span><h2>{questions[step][1]}</h2><p>اختياراتك بتأثر على النتيجة النهائية، لذلك ما رح نفترض شو الأفضل عنك.</p><div className="compare-options">{questions[step][2].map(v=>{const key=questions[step][0] as keyof Pref;const current=pref[key] as any;const active=Array.isArray(current)?current.includes(v):current===v;return <button key={v} type="button" className={active?"active":""} onClick={()=>setAnswer(key,v,questions[step][3])}>{v}</button>})}</div><div className="compare-question-actions"><button type="button" onClick={()=>step>0&&setStep(step-1)} disabled={!step}>رجوع</button>{step<questions.length-1?<button type="button" onClick={()=>setStep(step+1)}>التالي ←</button>:<button type="button" disabled={selected.length!==2||busy} onClick={run}>{busy?"عم حلل الجهازين…":"جاهز للمقارنة 🏆"}</button>}</div>{result?.winnerId&&<div className="compare-result"><div className="compare-winner-glow">🏆</div><h3>الأفضل إلك</h3><h2>{chosen.find(x=>x.id===result.winnerId)?.name}</h2><strong>{result.winnerScore}/100</strong><p>{result.reason}</p>{result.warnings?.length>0&&<small>{result.warnings.join(" • ")}</small>}<Link href={`/compare?ids=${selected.join(',')}`}>فتح صفحة المقارنة الكاملة</Link></div>}</div></div>}
  </>;
}
