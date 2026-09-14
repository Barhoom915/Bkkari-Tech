"use client";
import Link from "next/link";
import { useCart } from "@/app/lib/cart-context";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
export default function CartPage(){
 const {items,removeItem,updateQty,updateItem,totalPrice}=useCart();
 return <><Header/><main className="cart-page" dir="rtl"><div className="cart-head"><div><span>SHOPPING CART</span><h1>سلة المشتريات</h1><p>راجع المنتجات وتفاصيل الخيارات قبل إتمام الطلب.</p></div><Link href="/laptops">متابعة التسوق ←</Link></div>
 {items.length===0?<div className="cart-empty"><div>🛒</div><h2>السلة فاضية لهلق</h2><p>اختار المنتجات اللي بدك ياها ورح تظهر هون مع صورها وتفاصيلها.</p><Link href="/laptops">تصفح المنتجات</Link></div>:<div className="cart-layout"><section className="cart-items">{items.map(item=><article key={item.id} className="cart-item"><div className="cart-item-image">{item.image?<img src={item.image} alt=""/>:<div>BK</div>}</div><div className="cart-item-main"><div className="cart-item-top"><div><h2>{item.name}</h2><p>{item.details||"منتج من Bkkari Tech"}</p></div><button onClick={()=>removeItem(item.id)} aria-label="حذف">✕</button></div>{item.options?.length?<div className="cart-options">{item.options.map((x,i)=><span key={i}>{x}</span>)}</div>:null}<label className="cart-note"><span>ملاحظة عند الطلب</span><textarea value={item.note||""} onChange={e=>updateItem(item.id,{note:e.target.value})} placeholder="اكتب ملاحظة للمتجر..." rows={2}/></label><div className="cart-item-bottom"><div><b>${Number(item.price).toFixed(2)}</b><small>سعر القطعة</small></div><div className="cart-qty"><button onClick={()=>updateQty(item.id,item.qty-1)}>−</button><strong>{item.qty}</strong><button onClick={()=>updateQty(item.id,item.qty+1)}>+</button></div></div></div></article>)}</section><aside className="cart-summary"><h2>ملخص الطلب</h2><div><span>عدد المنتجات</span><b>{items.reduce((a,x)=>a+x.qty,0)}</b></div><div><span>المجموع</span><b>${totalPrice.toFixed(2)}</b></div><p>الشحن يُحسب حسب المحافظة في صفحة إتمام الطلب.</p><Link href="/checkout">إتمام الطلب</Link></aside></div>}
 </main><Footer/></>;
}
