"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/app/lib/supabase-browser";
import { useCart } from "@/app/lib/cart-context";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

type Governorate = { id: number; name: string; shipping_cost: number; delivery_days: string | null };
const FALLBACK_GOVERNORATES: Governorate[] = [
 {id:1,name:"دمشق",shipping_cost:3,delivery_days:"1-2 يوم"},{id:2,name:"ريف دمشق",shipping_cost:4,delivery_days:"1-2 يوم"},{id:3,name:"حمص",shipping_cost:5,delivery_days:"2-3 أيام"},{id:4,name:"حماة",shipping_cost:5,delivery_days:"2-3 أيام"},{id:5,name:"طرطوس",shipping_cost:6,delivery_days:"2-3 أيام"},{id:6,name:"اللاذقية",shipping_cost:6,delivery_days:"2-3 أيام"},{id:7,name:"حلب",shipping_cost:7,delivery_days:"3-4 أيام"},{id:8,name:"إدلب",shipping_cost:7,delivery_days:"3-4 أيام"},{id:9,name:"درعا",shipping_cost:5,delivery_days:"2-3 أيام"},{id:10,name:"السويداء",shipping_cost:5,delivery_days:"2-3 أيام"},{id:11,name:"القنيطرة",shipping_cost:5,delivery_days:"2-3 أيام"},{id:12,name:"دير الزور",shipping_cost:8,delivery_days:"4-5 أيام"},{id:13,name:"الرقة",shipping_cost:8,delivery_days:"4-5 أيام"},{id:14,name:"الحسكة",shipping_cost:8,delivery_days:"4-5 أيام"}
];


export default function CheckoutPage() {
  const supabase = createClient();
  const { items, totalPrice, clear } = useCart();

  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", governorate: "", city: "", address: "" });
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "wallet">("cash");
  const [walletBalance, setWalletBalance] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [couponMsg, setCouponMsg] = useState("");
  const [discount, setDiscount] = useState(0);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }: { data: { user: User | null } }) => {
      setUser(data.user);
      setCheckingAuth(false);
      if (data.user) {
        setForm((f) => ({ ...f, name: data.user!.user_metadata?.full_name ?? "" }));
        const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", data.user.id).maybeSingle();
        setWalletBalance(Number(wallet?.balance ?? 0));
      }
    });
    supabase
      .from("governorates")
      .select("id, name, shipping_cost, delivery_days")
      .order("name")
      .then(({ data }: { data: Governorate[] | null }) => setGovernorates(data?.length ? data : FALLBACK_GOVERNORATES));
  }, [supabase]);

  async function handleGoogleLogin() {
    const redirectTo = `${window.location.origin}/auth/callback?next=/checkout`;
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
  }

  const selectedGov = governorates.find((g) => g.name === form.governorate);
  const shippingCost = selectedGov?.shipping_cost ?? 0;
  const grandTotal = Math.max(0, totalPrice + shippingCost - discount);

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    const { data }: { data: any[] | null } = await supabase.rpc("validate_coupon", {
      p_code: couponCode.trim(),
      p_order_total: totalPrice,
    });
    const result = data?.[0];
    if (!result?.valid) {
      setCouponMsg(result?.message ?? "كود غير صحيح");
      setDiscount(0);
      return;
    }
    const value =
      result.discount_type === "percentage"
        ? (totalPrice * result.discount_value) / 100
        : result.discount_value;
    setDiscount(value);
    setCouponMsg(result.message);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGov || !user) return;
    if (paymentMethod === "wallet" && walletBalance < grandTotal) {
      alert("رصيد المحفظة غير كافٍ. اشحن محفظتك أولاً أو اختر الدفع عند الاستلام.");
      return;
    }
    setSubmitting(true);
    const newOrderNumber = `BK-${Date.now().toString().slice(-8)}`;
    const { data: result, error } = await supabase.rpc("create_order_with_wallet", {
      p_order_number: newOrderNumber,
      p_customer_name: form.name,
      p_customer_phone: form.phone,
      p_governorate: form.governorate,
      p_city_area: form.city,
      p_address_details: form.address,
      p_items: items,
      p_subtotal: totalPrice,
      p_shipping_cost: shippingCost,
      p_total: grandTotal,
      p_payment_method: paymentMethod,
    });
    setSubmitting(false);
    const outcome = result?.[0];
    if (error || !outcome?.ok) {
      alert(error?.message || outcome?.message || "تعذر إنشاء الطلب");
      if (paymentMethod === "wallet" && outcome?.new_balance != null) setWalletBalance(Number(outcome.new_balance));
      return;
    }
    if (paymentMethod === "wallet") setWalletBalance(Number(outcome.new_balance ?? Math.max(0, walletBalance - grandTotal)));
    void fetch("/api/push/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_number: newOrderNumber }) });
    setOrderNumber(newOrderNumber);
    clear();
  }

  if (checkingAuth) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-md px-4 py-20 text-center text-sm text-ink-soft">جاري التحقق...</main>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <main className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
          <h1 className="text-xl font-bold text-ink">سجّل دخول لإتمام الطلب</h1>
          <p className="mt-2 text-sm text-ink-soft">
            التصفح والسلة أحرار بدون حساب — بس إتمام الشراء بيحتاج تسجيل دخول سريع بجوجل
          </p>
          <button
            onClick={handleGoogleLogin}
            className="mt-6 flex items-center gap-2 rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold text-ink shadow-sm hover:border-blue"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
              <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 15.4 18.9 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.2-5.6l-6.6-5.6C29.6 34.6 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.8l6.6 5.6C41.9 35.9 44 30.5 44 24c0-1.3-.1-2.7-.4-3.5z" />
            </svg>
            الدخول بحساب Google
          </button>
        </main>
        <Footer />
      </>
    );
  }

  if (orderNumber) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
          <div className="rounded-2xl border border-line bg-white p-8 shadow-sm">
            <p className="text-3xl">✅</p>
            <h1 className="mt-3 text-xl font-bold text-ink">تم استلام طلبك بنجاح</h1>
            <p className="mt-2 font-mono-data text-lg text-blue">{orderNumber}</p>

            {paymentMethod === "wallet" && (
              <p className="mt-3 rounded-lg bg-blue/10 p-3 text-xs text-ink-soft">تم الدفع من رصيد المحفظة بنجاح.</p>
            )}

            <p className="mt-4 text-sm text-ink-soft">
              رح نتواصل معك قريباً لتأكيد الطلب. تقدر تتبع حالته بأي وقت.
            </p>
            <Link href="/track" className="mt-5 inline-block rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white">
              تتبع طلبي
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-md px-4 py-20 text-center text-sm text-ink-soft">
          السلة فاضية. <Link href="/laptops" className="text-blue">تصفح اللابتوبات</Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12" dir="rtl">
        <div className="mb-6"><p className="text-xs font-extrabold tracking-widest text-blue">CHECKOUT / BKKARI TECH</p><h1 className="mt-2 text-3xl font-extrabold text-ink">إتمام الطلب</h1><p className="mt-2 text-sm text-ink-soft">راجع بيانات التوصيل والدفع قبل تأكيد الطلب.</p></div>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr] lg:items-start">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-7">
          <input
            required
            placeholder="الاسم الكامل"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-line bg-surface px-4 py-2 text-ink outline-none focus:border-blue"
          />
          <input
            required
            placeholder="رقم الهاتف"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-lg border border-line bg-surface px-4 py-2 text-ink outline-none focus:border-blue"
          />
          <select
            required
            value={form.governorate}
            onChange={(e) => setForm({ ...form, governorate: e.target.value })}
            className="w-full rounded-lg border border-line bg-surface px-4 py-2 text-ink outline-none focus:border-blue"
          >
            <option value="">اختر المحافظة</option>
            {governorates.map((g) => (
              <option key={g.id} value={g.name}>
                {g.name} — شحن ${g.shipping_cost}
              </option>
            ))}
          </select>
          <input
            required
            placeholder="المدينة / المنطقة"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="w-full rounded-lg border border-line bg-surface px-4 py-2 text-ink outline-none focus:border-blue"
          />
          <textarea
            required
            placeholder="العنوان بالتفصيل"
            rows={2}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full rounded-lg border border-line bg-surface px-4 py-2 text-ink outline-none focus:border-blue"
          />

          <div>
            <p className="mb-2 text-sm font-medium text-ink">طريقة الدفع</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`rounded-xl border px-4 py-3 text-sm ${
                  paymentMethod === "cash" ? "border-blue bg-blue/10 text-blue" : "border-line text-ink-soft"
                }`}
              >
                💵 عند الاستلام
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("wallet")}
                className={`rounded-xl border px-4 py-3 text-sm ${
                  paymentMethod === "wallet" ? "border-blue bg-blue/10 text-blue" : "border-line text-ink-soft"
                }`}
              >
                💳 الدفع من المحفظة
                <span className="mt-1 block text-[10px] opacity-70">الرصيد: ${walletBalance.toFixed(2)}</span>
              </button>
            </div>

            {paymentMethod === "wallet" && (
              <div className="mt-3 rounded-xl border border-blue/20 bg-blue/10 p-4 text-sm text-ink-soft">
                <p className="font-bold text-blue">رح ينخصم المبلغ مباشرة من محفظتك عند تأكيد الطلب.</p>
                <p className="mt-1 text-xs">رصيدك الحالي: ${walletBalance.toFixed(2)} · الإجمالي: ${grandTotal.toFixed(2)}</p>
                {walletBalance < grandTotal && <Link href="/wallet" className="mt-3 inline-block font-bold text-blue">رصيدي غير كافي — شحن المحفظة ←</Link>}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              placeholder="كود الخصم (اختياري)"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="flex-1 rounded-lg border border-line bg-surface px-4 py-2 text-ink outline-none focus:border-blue"
            />
            <button type="button" onClick={applyCoupon} className="rounded-lg border border-line px-4 text-sm text-ink-soft hover:border-blue">
              تطبيق
            </button>
          </div>
          {couponMsg && <p className="text-xs text-ink-soft">{couponMsg}</p>}

          <div className="space-y-1.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between text-ink-soft">
              <span>المجموع الفرعي</span>
              <span>${totalPrice}</span>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>الشحن</span>
              <span>${shippingCost}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-blue">
                <span>الخصم</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-ink">
              <span>الإجمالي</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button disabled={submitting} className="w-full rounded-full bg-blue px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue/15 disabled:opacity-60">{submitting ? "جاري الإرسال..." : "تأكيد الطلب"}</button>
        </form>
        <aside className="rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-6 lg:sticky lg:top-6"><div className="flex items-center justify-between"><h2 className="text-lg font-extrabold text-ink">ملخص الطلب</h2><Link href="/cart" className="text-xs font-bold text-blue">تعديل السلة</Link></div><div className="mt-4 space-y-2">{items.map(item=><div key={item.id} className="flex justify-between gap-3 rounded-2xl bg-white p-3 text-xs"><span className="min-w-0 truncate font-semibold">{item.name} × {item.qty}</span><b>${(Number(item.price)*Number(item.qty)).toFixed(2)}</b></div>)}</div><div className="mt-4 space-y-2 border-t border-line pt-4 text-sm"><div className="flex justify-between text-ink-soft"><span>المجموع</span><b>${totalPrice.toFixed(2)}</b></div><div className="flex justify-between text-ink-soft"><span>الشحن</span><b>${shippingCost.toFixed(2)}</b></div>{discount>0&&<div className="flex justify-between text-blue"><span>الخصم</span><b>-${discount.toFixed(2)}</b></div>}<div className="flex justify-between border-t border-line pt-3 text-base font-extrabold"><span>الإجمالي</span><span>${grandTotal.toFixed(2)}</span></div></div></aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
