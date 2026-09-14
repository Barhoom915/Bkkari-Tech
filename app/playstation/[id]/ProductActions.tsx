"use client";
import { useState } from "react";
import { useCart } from "@/app/lib/cart-context";
export default function PlaystationProductActions({product,disabled}:{product:any;disabled:boolean}){
 const {addItem}=useCart(); const isController=product.product_type==='controller'; const isAccessory=product.product_type==='accessory';
 const [storage,setStorage]=useState<string>(product.storage_options?.[0]||product.storage||'');
 const [games,setGames]=useState(''); const [note,setNote]=useState('');
 const options=[...(isController?[]:(product.storage_options||[]))];
 const modification=product.modification_status==='modified' ? (product.modification_types||[]).join(' • ') : 'غير معدل';
 function add(){
   const selectedOptions=[!isController&&storage?`التخزين: ${storage}`:'',!isAccessory&&product.controller_count?`المحتويات: ${product.controller_count===2?'قبضتين':'قبضة أساسية'}`:'',`التعديل: ${modification}`,games.trim()?`الألعاب المطلوبة بالترتيب:\n${games.trim()}`:'',note.trim()?`ملاحظة الزبون: ${note.trim()}`:''].filter(Boolean);
   addItem({id:`ps-${product.id}-${encodeURIComponent(storage||'default')}-${Date.now()}`,name:product.name,price:Number(product.price),image:product.image||undefined,details:[product.model,storage,product.condition].filter(Boolean).join(' • '),options:selectedOptions,note:note.trim()});
 }
 return <div className="ps-order-box">
  {!isController&&options.length>0&&<div className="ps-choice"><span>سعة التخزين</span><div className="ps-storage-options">{options.map((x:string)=><button key={x} type="button" onClick={()=>setStorage(x)} className={`ps-storage-pill ${storage===x?"active":""}`}>{x}</button>)}</div></div>}
  {!isAccessory&&product.controller_count&&<div className="ps-choice-read">🕹️ {product.controller_count===2?'محتويات: قبضتين':'محتويات: قبضة أساسية'}</div>}
  {!isController&&product.modification_status==='modified'&&<div className="ps-choice-read">🛠️ التعديل: {(product.modification_types||[]).join(' • ')||'معدل'}</div>}
  {!isController&&<label className="ps-choice"><span>الألعاب المطلوبة بالترتيب <small>(اختياري)</small></span><textarea value={games} onChange={e=>setGames(e.target.value)} rows={5} placeholder={'اكتب أهم الألعاب أولاً، كل لعبة بسطر.\nمثال:\nGTA V\nFC 26\nMinecraft'} /></label>}
  {!isController&&<div className="ps-important-note"><b>ملاحظة هامة</b><p>قد لا تنزل كل الألعاب بسبب مساحة الجهاز أو حجم اللعبة. لذلك منمشي على ترتيب الألعاب الذي تختاره، من الأعلى للأهم، لحد ما تمتلئ مساحة الجهاز.</p></div>}
  <label className="ps-choice"><span>ملاحظة عند طلب المنتج <small>(اختياري)</small></span><textarea value={note} onChange={e=>setNote(e.target.value)} rows={3} placeholder={product.order_note||'اكتب أي ملاحظة تريد إيصالها للمتجر'} /></label>
  <button disabled={disabled} className="ps-detail-add" onClick={add}>{disabled?'غير متوفر':'إضافة إلى السلة'}</button>
 </div>;
}
