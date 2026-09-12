"use client";

import Link from "next/link";
import { useCart } from "@/app/lib/cart-context";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

export default function CartPage() {
  const { items, removeItem, updateQty, totalPrice } = useCart();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="gold-shine text-2xl font-bold sm:text-3xl">سلة المشتريات</h1>

        {items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-line bg-card p-10 text-center">
            <p className="text-sm text-ink-soft">السلة فاضية لهلق</p>
            <Link href="/laptops" className="mt-4 inline-block rounded-full bg-blue px-5 py-2 text-sm font-semibold text-white">
              تصفح اللابتوبات
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-6 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-line bg-card p-4">
                  <div>
                    <p className="font-medium text-ink">{item.name}</p>
                    <p className="text-sm text-ink-soft">${item.price} × {item.qty}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      className="h-7 w-7 rounded-full border border-line text-ink-soft"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-sm text-ink">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      className="h-7 w-7 rounded-full border border-line text-ink-soft"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="mr-2 text-xs text-red-400"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between rounded-xl border border-line bg-card p-4">
              <span className="text-ink-soft">المجموع</span>
              <span className="text-lg font-bold text-ink">${totalPrice}</span>
            </div>

            <Link
              href="/checkout"
              className="mt-4 block w-full rounded-full bg-blue px-6 py-3 text-center text-sm font-semibold text-white"
            >
              إتمام الطلب
            </Link>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
