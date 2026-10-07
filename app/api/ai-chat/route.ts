import { NextResponse } from "next/server";
import { askGemini } from "@/app/lib/intelligence/gemini";
import { researchLaptop } from "@/app/lib/intelligence/providers";
import { readCache, writeCache } from "@/app/lib/intelligence/cache";

export async function POST(request: Request) {
  try {
    const { messages = [] } = await request.json();
    const last = messages[messages.length - 1]?.text?.trim();
    if (!last) return NextResponse.json({ reply: "اكتب سؤالك أولاً." });

    let context = "";
    if (/(لابتوب|لابتوبات|حاسوب|جهاز|سعر|مواصفات|بطارية|كرت|معالج)/i.test(last)) {
      const key = `chat-research:${last.toLowerCase().replace(/\s+/g, " ").slice(0, 180)}`;
      const cached = await readCache(key, 21600);
      const data = cached ? [cached] : await researchLaptop(last);
      if (!cached && data.length) await writeCache(key, { query: last, summary: data.map(x => x.summary).join("\n\n"), facts: {}, sources: data.flatMap(x => x.sources), fetchedAt: new Date().toISOString() }, 21600);
      if (data.length) context = `\n\nمعلومات خارجية حديثة:\n${data.map(x => x.summary).join("\n\n")}\nالمصادر:\n${data.flatMap(x => x.sources).map(s => `${s.title}${s.url ? ` — ${s.url}` : ""}`).join("\n")}`;
    }

    const reply = await askGemini(last + context, messages.slice(0, -1));
    if (reply) return NextResponse.json({ reply });
    return NextResponse.json({ reply: "المساعد الذكي مشغول حالياً 🤖 جرّب بعد شوي." });
  } catch (error) {
    console.error("NOVATEK AI chat error:", error);
    return NextResponse.json({ reply: "المساعد الذكي مشغول حالياً 🤖 جرّب بعد شوي." });
  }
}
