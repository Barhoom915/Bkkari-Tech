"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase-browser";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

type TrackResult = {
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  items: any[];
  payment_method?: string | null;
};

const statusSteps = ["طلب جديد", "قيد التواصل", "تم التأكيد", "قيد التجهيز", "خرج للتوصيل", "تم التسليم"];
const statusIcons = ["🛒", "💬", "✓", "📦", "🚚", "🏠"];
const statusText: Record<string, string> = {
  "طلب جديد": "استلمنا طلبك وعم نراجع التفاصيل.",
  "قيد التواصل": "فريقنا عم يتواصل معك لتأكيد الطلب.",
  "تم التأكيد": "تم تأكيد الطلب وعم نجهزه للتنفيذ.",
  "قيد التجهيز": "طلبك حالياً قيد التجهيز.",
  "خرج للتوصيل": "طلبك صار بالطريق إليك.",
  "تم التسليم": "تم تسجيل الطلب كمُسلّم.",
  "ملغي": "تم إلغاء الطلب.",
};

export default function TrackOrderPage() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<TrackResult[]>([]);
  const [selected, setSelected] = useState<TrackResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadOrders() {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;

      setUser(data.user);

      if (data.user) {
        const result = await supabase
          .from("orders")
          .select("order_number,status,total,created_at,items,payment_method")
          .eq("user_id", data.user.id)
          .order("created_at", { ascending: false });

        if (alive) {
          const list = (result.data ?? []) as TrackResult[];
          setOrders(list);
          setSelected(list[0] ?? null);
        }
      }

      if (alive) setLoading(false);
    }

    void loadOrders();
    return () => {
      alive = false;
    };
  }, [supabase]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="v71-track-page" dir="rtl">
          <div className="v71-loading">جاري فتح التتبع...</div>
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <main className="v71-track-page" dir="rtl">
          <section className="v71-track-guest">
            <span>ORDER TRACKING</span>
            <b>🚚</b>
            <h1>تتبع طلباتك</h1>
            <p>سجّل دخول حتى تشوف كل طلباتك وحالتها من مكان واحد.</p>
            <Link href="/login?next=/track">تسجيل الدخول</Link>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const currentIndex = selected ? statusSteps.indexOf(selected.status) : -1;

  return (
    <>
      <Header />
      <main className="v71-track-page" dir="rtl">
        <header className="v71-simple-head">
          <div>
            <span>LIVE ORDER TRACKING</span>
            <h1>تتبع الطلبات 🚚</h1>
            <p>اختار طلب حتى تشوف مرحلته الحالية والتفاصيل.</p>
          </div>
          <Link href="/purchase-history">سجل الشراء ←</Link>
        </header>

        {orders.length === 0 ? (
          <section className="v71-track-empty">
            <b>📦</b>
            <h2>ما عندك طلبات حالياً</h2>
            <p>لما تعمل أول طلب، رح يظهر التتبع هون.</p>
            <Link href="/laptops">ابدأ التسوق</Link>
          </section>
        ) : (
          <section className="v71-track-layout">
            <aside className="v71-track-list">
              <div className="v71-track-list-head">
                <b>طلباتك</b>
                <span>{orders.length}</span>
              </div>

              {orders.map((order) => (
                <button
                  key={order.order_number}
                  type="button"
                  onClick={() => setSelected(order)}
                  className={selected?.order_number === order.order_number ? "active" : ""}
                >
                  <span>📦</span>
                  <div>
                    <b>{order.order_number}</b>
                    <small>
                      {new Date(order.created_at).toLocaleDateString("ar-SY")} · {order.status}
                    </small>
                  </div>
                  <strong>${Number(order.total).toFixed(2)}</strong>
                </button>
              ))}
            </aside>

            <section className="v71-track-detail">
              <div className="v71-track-order-top">
                <div>
                  <small>ORDER NUMBER</small>
                  <h2>{selected?.order_number}</h2>
                  <p>
                    {selected?.payment_method === "wallet"
                      ? "💳 الدفع من المحفظة"
                      : "💵 الدفع عند الاستلام"}
                  </p>
                </div>
                <strong>${Number(selected?.total ?? 0).toFixed(2)}</strong>
              </div>

              <div className="v71-current-status">
                <span>الحالة الحالية</span>
                <b>{selected?.status}</b>
                <p>{statusText[selected?.status ?? ""] || "تم تحديث حالة طلبك."}</p>
              </div>

              <div className="v71-progress">
                {statusSteps.map((step, index) => (
                  <div key={step} className={index <= currentIndex ? "done" : ""}>
                    <span>{statusIcons[index]}</span>
                    <b>{step}</b>
                    {index === currentIndex ? <small>الآن</small> : null}
                  </div>
                ))}
              </div>

              <div className="v71-track-items">
                <div className="v71-track-section-title">
                  <b>محتويات الطلب</b>
                  <span>{selected?.items?.length ?? 0} منتجات</span>
                </div>

                {(selected?.items ?? []).map((item: any, index: number) => (
                  <div key={index}>
                    <span>
                      {item.name || "منتج"} × {item.qty ?? 1}
                    </span>
                    <strong>
                      ${(Number(item.price || 0) * Number(item.qty || 1)).toFixed(2)}
                    </strong>
                  </div>
                ))}
              </div>
            </section>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
