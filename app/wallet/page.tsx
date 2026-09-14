"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase-browser";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

export default function WalletPage() {
  const s = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState(0);
  const [tx, setTx] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState("");
  const [transactionNumber, setTransactionNumber] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [topupSubmitting, setTopupSubmitting] = useState(false);
  const [topupMessage, setTopupMessage] = useState("");
  const [payment, setPayment] = useState<any>({ method:"شام كاش", account_name:"BKKARI TECH", account_number:"", image_url:"", note:"" });

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await s.auth.getUser();
      if (!alive) return;
      setUser(data.user);
      if (data.user) {
        const [w, t, paymentRes] = await Promise.all([
          s.from("wallets").select("balance").eq("user_id", data.user.id).maybeSingle(),
          s.from("wallet_transactions").select("amount,type,status,reference,created_at").eq("user_id", data.user.id).order("created_at", { ascending: false }).limit(30),
          s.from("site_settings").select("value").eq("key", "wallet_payment").maybeSingle(),
        ]);
        if (!alive) return;
        setBalance(Number(w.data?.balance ?? 0));
        setTx(t.data ?? []);
        if (paymentRes.data?.value) setPayment((paymentRes.data.value as any));

      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [s]);

  if (loading) return <><Header/><main className="py-24 text-center text-sm text-ink-soft" dir="rtl">جاري تحميل المحفظة...</main><Footer/></>;
  if (!user) return <><Header/><main className="mx-auto max-w-md px-4 py-24 text-center" dir="rtl"><h1 className="text-2xl font-extrabold">المحفظة</h1><p className="mt-2 text-sm text-ink-soft">سجّل دخول حتى تشوف رصيدك.</p><Link href="/login?next=/wallet" className="mt-6 inline-block rounded-full bg-blue px-6 py-3 font-bold text-white">تسجيل الدخول</Link></main><Footer/></>;

  return <><Header/><main className="mx-auto max-w-5xl px-4 py-10" dir="rtl">
    <section className="wallet-hero-card rounded-[2rem] bg-blue-deep p-7 text-white shadow-xl">
      <p className="text-sm text-white/70">الرصيد الحالي</p><h1 className="mt-2 text-4xl font-extrabold">${balance.toFixed(2)}</h1>
      <p className="mt-2 text-sm text-white/70">رصيدك جاهز للدفع المباشر عند إتمام الطلب.</p>
    </section>

    <section className="mt-7 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
      <div className="wallet-topup-contact rounded-3xl border border-blue/20 bg-blue/10 p-6">
        <span className="text-xs font-extrabold tracking-wider text-blue">TOP UP WALLET</span>
        <h2 className="mt-2 text-2xl font-extrabold text-ink">تعبئة المحفظة 💰</h2>
        <p className="mt-3 text-sm leading-7 text-ink-soft">اختار الطريقة المناسبة: شام كاش، أو تعبئة وتسليم مباشر بالتواصل مع الإدارة.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-4"><b>💳 شام كاش</b><p className="mt-2 text-xs leading-6 text-ink-soft">حوّل المبلغ على بيانات شام كاش الخاصة بالمتجر، وبعدها عبّي إشعار التحويل هون حتى يوصل مباشرة للوحة التحكم للمراجعة.</p><div className="mt-3 rounded-xl bg-surface p-3"><p className="text-[10px] font-bold text-ink-soft">عنوان شام كاش</p><p className="mt-1 break-all font-mono text-sm font-extrabold text-blue">{payment.account_number || "لم يتم إضافة عنوان شام كاش بعد"}</p>{payment.account_name&&<p className="mt-1 text-[10px] text-ink-soft">الحساب: {payment.account_name}</p>}</div>{payment.note&&<p className="mt-2 text-[10px] leading-5 text-ink-soft">{payment.note}</p>}<div className="mt-3 space-y-2"><input type="number" min="1" step="0.01" value={topupAmount} onChange={e=>setTopupAmount(e.target.value)} placeholder="المبلغ بالدولار" className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-xs outline-none focus:border-blue"/><input value={transactionNumber} onChange={e=>setTransactionNumber(e.target.value)} placeholder="رقم العملية" className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-xs outline-none focus:border-blue"/><label className="block cursor-pointer rounded-xl border border-dashed border-line bg-surface px-3 py-2.5 text-center text-xs font-bold text-blue">{receiptFile?receiptFile.name:"📷 اختيار صورة الإيصال"}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e=>setReceiptFile(e.target.files?.[0]||null)}/></label><button type="button" disabled={topupSubmitting} onClick={async()=>{setTopupMessage("");if(!topupAmount||Number(topupAmount)<=0||!transactionNumber.trim()||!receiptFile){setTopupMessage("عبّي المبلغ ورقم العملية وارفع صورة الإيصال.");return}setTopupSubmitting(true);try{const ext=receiptFile.name.split('.').pop()||'jpg';const path=`${user.id}/${Date.now()}.${ext}`;const up=await s.storage.from('wallet-receipts').upload(path,receiptFile,{upsert:false,contentType:receiptFile.type});if(up.error)throw new Error(up.error.message);const pub=s.storage.from('wallet-receipts').getPublicUrl(path);const ins=await s.from('wallet_topup_requests').insert({user_id:user.id,amount:Number(topupAmount),transaction_number:transactionNumber.trim(),receipt_url:pub.data.publicUrl,status:'pending'});if(ins.error)throw new Error(ins.error.message);setTopupAmount('');setTransactionNumber('');setReceiptFile(null);setTopupMessage('تم إرسال طلب التعبئة، ورح تراجعه الإدارة قريباً.')}catch(e){setTopupMessage(e instanceof Error?e.message:'تعذر إرسال الطلب')}finally{setTopupSubmitting(false)}}} className="w-full rounded-xl bg-blue px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-60">{topupSubmitting?'جاري الإرسال...':'إرسال طلب تعبئة شام كاش'}</button>{topupMessage&&<p className="text-[11px] leading-5 text-ink-soft">{topupMessage}</p>}</div></div>
          <div className="rounded-2xl border border-line bg-white p-4"><b>🤝 تعبئة وتسليم مباشر</b><p className="mt-2 text-xs leading-6 text-ink-soft">تواصل مع الإدارة واتفق على تعبئة الرصيد وتسليمه بشكل مباشر، وبعد التأكيد بينضاف الرصيد لحسابك.</p><a href="https://wa.me/963936426605?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D8%8C%20%D8%A8%D8%AF%D9%8A%20%D8%AA%D8%B9%D8%A8%D8%A6%D8%A9%20%D9%85%D8%AD%D9%81%D8%B8%D8%AA%D9%8A%20%D8%AA%D8%B3%D9%84%D9%8A%D9%85%20%D9%85%D8%A8%D8%A7%D8%B4%D8%B1" target="_blank" rel="noopener noreferrer" className="mt-3 block rounded-xl border border-line bg-surface px-4 py-2.5 text-center text-xs font-extrabold">تواصل مع الإدارة</a></div>
        </div>
      </div>

      <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between"><div><h2 className="text-xl font-extrabold">حركات المحفظة</h2><p className="mt-1 text-xs text-ink-soft">آخر عمليات الإضافة والشراء والتعديل.</p></div><span className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-blue">{tx.length} عملية</span></div>
        {tx.length ? <div className="mt-5 space-y-2">{tx.map((x,i)=><div key={i} className="flex items-center justify-between rounded-2xl bg-surface p-4 text-sm"><div><b>{x.type==='deposit'?'إضافة رصيد':x.type==='purchase'?'عملية شراء':x.type==='refund'?'استرداد':'تعديل'}</b><p className="mt-1 text-[10px] text-ink-soft">{x.reference||'—'} · {new Date(x.created_at).toLocaleDateString('ar-SY')}</p></div><b className={Number(x.amount)<0?'text-orange':'text-blue'}>{Number(x.amount)>0?'+':''}${Number(x.amount).toFixed(2)}</b></div>)}</div> : <p className="mt-6 rounded-2xl bg-surface p-8 text-center text-sm text-ink-soft">لسا ما في حركات على المحفظة.</p>}
      </div>
    </section>
  </main><Footer/></>;
}
