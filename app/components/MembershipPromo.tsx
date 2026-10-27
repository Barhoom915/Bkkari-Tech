"use client";

import Link from "next/link";

export default function MembershipPromo() {
  return (
    <aside className="relative z-30 border-b border-slate-200 bg-white text-slate-900" aria-label="عضويات NOVATEK">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2.5 sm:px-6">
        <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-orange-200 bg-orange-50 text-lg text-orange-600">✦</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-extrabold sm:text-sm">عضويات NOVATEK</p>
          <p className="hidden text-xs text-slate-500 sm:block">مساعد ذكي، مقارنات أوسع، كوبونات ونقاط ولاء</p>
          <p className="text-[11px] text-slate-500 sm:hidden">مزايا أكثر مع كل عضوية</p>
        </div>
        <Link href="/membership" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-orange-500 px-3.5 py-2.5 text-xs font-extrabold text-white transition hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 sm:px-4 sm:text-sm">
          شوف العضويات <span aria-hidden="true">←</span>
        </Link>
      </div>
    </aside>
  );
}
