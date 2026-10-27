"use client";

import Link from "next/link";

export default function MembershipPromo() {
  return (
    <div className="relative z-40 overflow-hidden border-b border-orange-200/70 bg-slate-950 text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-3 text-center sm:flex-row sm:text-right">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-orange-400/40 bg-orange-500/15 text-xl text-orange-300">✦</span>
          <div>
            <p className="text-sm font-extrabold sm:text-base">عضويات NOVATEK — مزايا أكثر بتجربة واحدة</p>
            <p className="mt-0.5 text-xs text-slate-300">مقارنات ذكية، كوبونات أسبوعية، نقاط ولاء وعروض للأعضاء</p>
          </div>
        </div>
        <Link href="/membership" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-extrabold text-slate-950 transition hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300">
          اكتشف العضويات <span className="mr-2" aria-hidden="true">←</span>
        </Link>
      </div>
    </div>
  );
}
