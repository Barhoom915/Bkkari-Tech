"use client";
import {useState} from "react";
import {createClient} from "@/app/lib/supabase-browser";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

export default function RequestPage(){
 const s=createClient();
 const[f,setF]=useState({name:'',phone:'',email:'',website_type:'Business Website',budget:'',project_details:'',current_website_url:''});
 const[done,setDone]=useState(false); const[loading,setLoading]=useState(false); const[error,setError]=useState('');
 async function submit(e:React.FormEvent){e.preventDefault();setLoading(true);setError('');
   const{error}=await s.from('web_dev_requests').insert(f);
   setLoading(false);
   if(!error)setDone(true); else setError(error.message || 'تعذر إرسال الطلب. تأكد من تشغيل تحديث قاعدة البيانات ثم جرّب مرة تانية.');
 }
 return <><Header/><main className="mx-auto max-w-2xl px-4 py-12 sm:px-6" dir="rtl"><h1 className="text-3xl font-extrabold text-ink">اطلب مشروعك</h1><p className="mt-2 text-sm text-ink-soft">عبّي التفاصيل ورح يوصل الطلب مباشرةً إلى مركز العمليات بلوحة التحكم.</p>{done?<div className="mt-8 rounded-3xl border border-line bg-surface p-10 text-center"><div className="text-4xl">✓</div><h2 className="mt-3 text-xl font-bold">وصل الطلب</h2><p className="mt-2 text-sm text-ink-soft">تم تسجيل طلب تطوير الموقع بنجاح.</p></div>:<form onSubmit={submit} className="mt-7 space-y-4 rounded-3xl border border-line bg-white p-6 shadow-sm">{[['name','الاسم'],['phone','رقم الهاتف'],['email','الإيميل'],['budget','الميزانية التقريبية'],['current_website_url','رابط موقع حالي']].map(([k,label])=><input key={k} required={k==='name'||k==='phone'} value={f[k as keyof typeof f]} onChange={e=>setF({...f,[k]:e.target.value})} placeholder={label} className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-blue"/>)}<select value={f.website_type} onChange={e=>setF({...f,website_type:e.target.value})} className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm"><option>Landing Page</option><option>Business Website</option><option>E-commerce</option><option>Custom Platform</option><option>Web App</option></select><textarea required value={f.project_details} onChange={e=>setF({...f,project_details:e.target.value})} placeholder="احكيلي عن المشروع والميزات اللي بدك ياها" rows={6} className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-blue"/>{error&&<div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">{error}</div>}<button disabled={loading} className="w-full rounded-2xl bg-blue px-5 py-3 font-bold text-white disabled:opacity-50">{loading?'جاري الإرسال...':'إرسال الطلب'}</button></form>}</main><Footer/></>
}
