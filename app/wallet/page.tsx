"use client";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase-browser";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

type Currency = "USD" | "SYP";
type PaymentMethod = "shamcash_syp" | "shamcash_usd" | "bemo" | "siib" | "cash_hand";

const DEFAULT_SYP_PER_USD = 11111.11;
const BEMO_ACCOUNT = "020512188800013000000";
const SIIB_ACCOUNT = "0001000476021020101473306000";

const paymentCards: Array<{ id: PaymentMethod; title: string; subtitle: string; logo: string; kind: "sham" | "bank" | "cash" }> = [
  { id: "shamcash_syp", title: "شام كاش ل.س", subtitle: "الدفع بالليرة السورية", logo: "https://www.sham-cash-id.com/", kind: "sham" },
  { id: "shamcash_usd", title: "شام كاش $", subtitle: "الدفع بالدولار", logo: "https://www.sham-cash-id.com/", kind: "sham" },
  { id: "bemo", title: "بنك بيمو", subtitle: "تحويل بالليرة السورية", logo: "https://upload.wikimedia.org/wikipedia/commons/3/38/Banque-Bemo-Saudi-Fransi_logo.jpg", kind: "bank" },
  { id: "siib", title: "بنك سورية الإسلامي", subtitle: "تحويل بالليرة السورية", logo: "https://www.siib.sy/", kind: "bank" },
  { id: "cash_hand", title: "استلام باليد", subtitle: "تعبئة مباشرة مع الإدارة", logo: "cash", kind: "cash" },
];

function formatSyp(value: number) {
  return new Intl.NumberFormat("ar-SY", { maximumFractionDigits: 0 }).format(Math.round(value));
}

function PaymentLogo({ card }: { card: (typeof paymentCards)[number] }) {
  if (card.logo === "cash") return <span className="text-4xl" aria-hidden>🤝</span>;
  if (card.id === "siib") {
    return <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white px-1 text-center shadow-sm"><span className="text-[9px] font-black leading-3 text-[#0b7a5a]">SIIB<br />بنك سورية<br />الدولي الإسلامي</span></div>;
  }
  if (card.id.startsWith("shamcash")) {
    return <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm"><span className="text-[10px] font-black text-[#08a1a7]">شام<br />كاش</span></div>;
  }
  return <img src={card.logo} alt="شعار بنك بيمو السعودي الفرنسي" className="h-16 w-16 rounded-2xl object-contain bg-white p-1 shadow-sm" />;
}

export default function WalletPage() {
  const s = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState(0);
  const [tx, setTx] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState("");
  const [selected, setSelected] = useState<PaymentMethod>("shamcash_syp");
  const [exchangeRate, setExchangeRate] = useState(DEFAULT_SYP_PER_USD);
  const [transactionNumber, setTransactionNumber] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [topupSubmitting, setTopupSubmitting] = useState(false);
  const [topupMessage, setTopupMessage] = useState("");
  const [payment, setPayment] = useState<any>({ method: "شام كاش", account_name: "NOVATEK", account_number: "", syp_account_number: "", usd_account_number: "", image_url: "", note: "" });

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await s.auth.getUser();
      if (!alive) return;
      setUser(data.user);
      if (data.user) {
        const [w, t, paymentRes, rateRes] = await Promise.all([
          s.from("wallets").select("balance").eq("user_id", data.user.id).maybeSingle(),
          s.from("wallet_transactions").select("amount,type,status,reference,created_at").eq("user_id", data.user.id).order("created_at", { ascending: false }).limit(30),
          s.from("site_settings").select("value").eq("key", "wallet_payment").maybeSingle(),
          s.from("site_settings").select("value").eq("key", "wallet_exchange_rate").maybeSingle(),
        ]);
        if (!alive) return;
        setBalance(Number(w.data?.balance ?? 0));
        setTx(t.data ?? []);
        if (paymentRes.data?.value) setPayment(paymentRes.data.value as any);
        const configuredRate = Number(typeof rateRes.data?.value === "object" && rateRes.data?.value !== null ? (rateRes.data.value as any).rate : rateRes.data?.value);
        if (Number.isFinite(configuredRate) && configuredRate > 0) setExchangeRate(configuredRate);
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [s]);

  const entered = Number(topupAmount);
  const isUsd = selected === "shamcash_usd";
  const isSypMethod = selected === "shamcash_syp" || selected === "bemo" || selected === "siib";
  const usdAmount = isUsd ? entered : isSypMethod ? entered / exchangeRate : 0;
  const sypAmount = isUsd ? entered * exchangeRate : entered;
  const selectedCard = paymentCards.find(x => x.id === selected)!;
  const accountNumber = selected === "bemo" ? BEMO_ACCOUNT : selected === "siib" ? SIIB_ACCOUNT : selected === "shamcash_usd" ? (payment.usd_account_number || payment.account_number) : (payment.syp_account_number || payment.account_number);

  async function submitTopup() {
    setTopupMessage("");
    if (selected === "cash_hand") {
      setTopupMessage("اختار استلام باليد وتواصل مع الإدارة لتنسيق التعبئة والتسليم.");
      return;
    }
    if (!topupAmount || !Number.isFinite(entered) || entered <= 0 || !transactionNumber.trim() || !receiptFile) {
      setTopupMessage("عبّي المبلغ ورقم العملية وارفع صورة إشعار التحويل.");
      return;
    }
    if (!Number.isFinite(usdAmount) || usdAmount <= 0) {
      setTopupMessage("المبلغ غير صالح.");
      return;
    }
    setTopupSubmitting(true);
    try {
      const ext = receiptFile.name.split(".").pop() || "jpg";
      const path = `${user!.id}/${Date.now()}.${ext}`;
      const up = await s.storage.from("wallet-receipts").upload(path, receiptFile, { upsert: false, contentType: receiptFile.type });
      if (up.error) throw new Error(up.error.message);
      const pub = s.storage.from("wallet-receipts").getPublicUrl(path);
      const ins = await s.from("wallet_topup_requests").insert({
        user_id: user!.id,
        amount: Number(usdAmount.toFixed(2)),
        transaction_number: transactionNumber.trim(),
        receipt_url: pub.data.publicUrl,
        status: "pending",
        payment_method: selected,
        payment_currency: isUsd ? "USD" : "SYP",
        sent_amount: Number((isUsd ? entered : sypAmount).toFixed(isUsd ? 2 : 0)),
        exchange_rate: isSypMethod ? exchangeRate : null,
        destination_amount: Number(usdAmount.toFixed(2)),
        destination_account: accountNumber || null,
      });
      if (ins.error) throw new Error(ins.error.message);
      setTopupAmount(""); setTransactionNumber(""); setReceiptFile(null);
      setTopupMessage(`تم إرسال طلب التعبئة بقيمة $${usdAmount.toFixed(2)} عبر ${selectedCard.title}، ورح تراجعه الإدارة.`);
    } catch (e) {
      setTopupMessage(e instanceof Error ? e.message : "تعذر إرسال الطلب");
    } finally { setTopupSubmitting(false); }
  }

  if (loading) return <><Header /><main className="py-24 text-center text-sm text-ink-soft" dir="rtl">جاري تحميل المحفظة...</main><Footer /></>;
  if (!user) return <><Header /><main className="mx-auto max-w-md px-4 py-24 text-center" dir="rtl"><h1 className="text-2xl font-extrabold">المحفظة</h1><p className="mt-2 text-sm text-ink-soft">سجّل دخول حتى تشوف رصيدك.</p><Link href="/login?next=/wallet" className="mt-6 inline-block rounded-full bg-blue px-6 py-3 font-bold text-white">تسجيل الدخول</Link></main><Footer /></>;

  return <><Header /><main className="mx-auto max-w-5xl px-4 py-10" dir="rtl">
    <section className="wallet-hero-card rounded-[2rem] bg-blue-deep p-7 text-white shadow-xl"><p className="text-sm text-white/70">الرصيد الحالي</p><h1 className="mt-2 text-4xl font-extrabold">${balance.toFixed(2)}</h1><p className="mt-2 text-sm text-white/70">رصيدك جاهز للدفع المباشر عند إتمام الطلب.</p></section>

    <section className="mt-7 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
      <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
        <span className="text-xs font-extrabold tracking-wider text-blue">TOP UP WALLET</span>
        <h2 className="mt-2 text-2xl font-extrabold text-ink">إضافة رصيد 💰</h2>
        <p className="mt-2 text-sm leading-7 text-ink-soft">اختار طريقة الدفع، وبعدها رح يظهرلك المبلغ المطلوب وإشعار التحويل.</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2">
          {paymentCards.map(card => <button key={card.id} type="button" onClick={() => { setSelected(card.id); setTopupMessage(""); }} className={`group flex min-h-[150px] flex-col items-center justify-center rounded-3xl border p-4 text-center transition ${selected === card.id ? "border-[#ff6a00] bg-[#fff7f0] shadow-md ring-2 ring-[#ff6a00]/15" : "border-line bg-surface hover:border-[#ff6a00]/50 hover:bg-white"}`}>
            <PaymentLogo card={card} />
            <b className="mt-3 text-sm text-ink">{card.title}</b>
            <span className="mt-1 text-[10px] text-ink-soft">{card.subtitle}</span>
          </button>)}
        </div>

        {selected === "cash_hand" ? <div className="mt-5 rounded-3xl border border-[#ff6a00]/20 bg-[#fff7f0] p-5 text-center">
          <h3 className="text-lg font-extrabold">استلام باليد 🤝</h3><p className="mt-2 text-sm leading-6 text-ink-soft">تواصل مع الإدارة لتحديد مكان ووقت التسليم، وبعد استلام المبلغ وتأكيده بينضاف الرصيد لحسابك.</p>
          <a href="https://wa.me/963936426605?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D8%8C%20%D8%A8%D8%AF%D9%8A%20%D8%A5%D8%B6%D8%A7%D9%81%D8%A9%20%D8%B1%D8%B5%D9%8A%D8%AF%20%D9%88%D8%A7%D8%B3%D8%AA%D9%84%D8%A7%D9%85%20%D8%A8%D8%A7%D9%84%D9%8A%D8%AF" target="_blank" rel="noopener noreferrer" className="mt-4 inline-block rounded-2xl bg-[#ff6a00] px-6 py-3 text-sm font-extrabold text-white">تواصل مع الإدارة</a>
        </div> : <div className="mt-5 rounded-3xl border border-line bg-surface/70 p-5">
          <div className="flex items-center gap-3"><PaymentLogo card={selectedCard} /><div><h3 className="font-extrabold">{selectedCard.title}</h3><p className="text-[11px] text-ink-soft">{selectedCard.subtitle}</p></div></div>
          <div className="mt-4 rounded-2xl border border-line bg-white p-4"><p className="text-[10px] font-bold text-ink-soft">{selected === "bemo" ? "رقم حساب بنك بيمو" : selected === "siib" ? "رقم حساب بنك سورية الإسلامي" : "حساب الدفع"}</p><p className="mt-1 break-all font-mono text-sm font-black text-blue">{accountNumber || "لم يتم إضافة رقم الحساب بعد"}</p>{selected === "bemo" || selected === "siib" ? <p className="mt-2 text-[10px] leading-5 text-ink-soft">تأكد من اسم الحساب ورقم الحساب قبل التحويل، وبعدها ارفع إشعار التحويل هون.</p> : payment.note && <p className="mt-2 text-[10px] leading-5 text-ink-soft">{payment.note}</p>}</div>

          <label className="mt-4 block text-xs font-bold text-ink-soft">المبلغ {isUsd ? "بالدولار" : "بالليرة السورية"}<div className="mt-1 flex items-center rounded-2xl border border-line bg-white focus-within:border-[#ff6a00]"><span className="px-4 text-sm font-black text-[#ff6a00]">{isUsd ? "$" : "ل.س"}</span><input type="number" min="1" step={isUsd ? "0.01" : "1"} value={topupAmount} onChange={e => setTopupAmount(e.target.value)} placeholder={isUsd ? "مثلاً 10" : "مثلاً 50000"} className="w-full rounded-2xl bg-transparent px-2 py-3 text-sm font-extrabold text-ink outline-none" /></div></label>

          {entered > 0 && <div className="mt-3 rounded-2xl border border-[#ff6a00]/20 bg-white p-4 text-center"><p className="text-[10px] font-bold text-ink-soft">المبلغ الذي سيصل إلى رصيدك</p><strong className="mt-1 block text-2xl font-black text-[#ff6a00]">${usdAmount.toFixed(2)}</strong>{!isUsd && <p className="mt-1 text-[10px] text-ink-soft">سعر الصرف: 1$ = {formatSyp(exchangeRate)} ل.س</p>}{isUsd && <p className="mt-1 text-[10px] text-ink-soft">يعادل تقريباً {formatSyp(sypAmount)} ل.س</p>}</div>}

          <div className="mt-4 space-y-2"><input value={transactionNumber} onChange={e => setTransactionNumber(e.target.value)} placeholder="رقم العملية / مرجع التحويل" className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-xs outline-none focus:border-[#ff6a00]" /><label className="block cursor-pointer rounded-2xl border border-dashed border-[#ff6a00]/40 bg-white px-4 py-3 text-center text-xs font-bold text-blue">{receiptFile ? receiptFile.name : "📷 رفع صورة إشعار التحويل"}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => setReceiptFile(e.target.files?.[0] || null)} /></label><button type="button" disabled={topupSubmitting} onClick={submitTopup} className="w-full rounded-2xl bg-[#ff6a00] px-4 py-3 text-xs font-extrabold text-white disabled:opacity-60">{topupSubmitting ? "جاري إرسال الطلب..." : "إرسال إشعار التحويل"}</button>{topupMessage && <p className="text-[11px] leading-5 text-ink-soft">{topupMessage}</p>}</div>
        </div>}
      </div>

      <div className="rounded-3xl border border-line bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-xl font-extrabold">حركات المحفظة</h2><p className="mt-1 text-xs text-ink-soft">آخر عمليات الإضافة والشراء والتعديل.</p></div><span className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-blue">{tx.length} عملية</span></div>{tx.length ? <div className="mt-5 space-y-2">{tx.map((x, i) => <div key={i} className="flex items-center justify-between rounded-2xl bg-surface p-4 text-sm"><div><b>{x.type === "deposit" ? "إضافة رصيد" : x.type === "purchase" ? "عملية شراء" : x.type === "refund" ? "استرداد" : "تعديل"}</b><p className="mt-1 text-[10px] text-ink-soft">{x.reference || "—"} · {new Date(x.created_at).toLocaleDateString("ar-SY")}</p></div><b className={Number(x.amount) < 0 ? "text-orange" : "text-blue"}>{Number(x.amount) > 0 ? "+" : ""}${Number(x.amount).toFixed(2)}</b></div>)}</div> : <p className="mt-6 rounded-2xl bg-surface p-8 text-center text-sm text-ink-soft">لسا ما في حركات على المحفظة.</p>}</div>
    </section>
  </main><Footer /></>;
}
