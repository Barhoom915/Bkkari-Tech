import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";
import { createClient as createServerClient, getServiceClient } from "@/app/lib/supabase-server";
import { askGemini } from "@/app/lib/intelligence/gemini";
import { readCache, writeCache } from "@/app/lib/intelligence/cache";
import { researchLaptop } from "@/app/lib/intelligence/providers";
import type { Laptop } from "@/app/lib/types";
import type { ComparisonPreferences } from "@/app/lib/intelligence/types";

function score(l: Laptop, p: ComparisonPreferences) {
  const t = `${l.cpu || ""} ${l.gpu || ""} ${l.category || ""}`.toLowerCase();
  const gaming = /gaming|rtx|gtx|radeon|geforce/.test(t) ? 20 : 6;
  const ram = Math.min(18, Number((String(l.ram || "").match(/\d+/) || [0])[0]) / 2);
  const storage = /nvme|ssd/i.test(l.storage || "") ? 10 : 5;
  const screen = /2k|qhd|1440|1600|4k|2160|uhd/i.test(`${l.screen_resolution} ${l.screen_size}`) ? 12 : 7;
  const battery = Number((String(l.battery_health || "").match(/\d+/) || [60])[0]);
  const perf = /i9|ultra 9|ryzen 9|rtx 40|rtx 50/.test(t) ? 20 : /i7|ultra 7|ryzen 7|rtx|gtx/.test(t) ? 15 : 10;
  let total = perf + ram + storage + screen + Math.min(15, battery / 7) + gaming;
  if (p.uses.some(x => /gaming/i.test(x))) total += gaming;
  if (p.priorities.includes("battery")) total += Math.min(10, battery / 10);
  if (p.priorities.includes("screen")) total += screen / 2;
  if (p.priorities.includes("performance")) total += perf / 2;
  if (p.priorities.includes("price")) total += Math.max(0, 12 - Number(l.price) / 200);
  if (p.mobility === "high") total += 2;
  return Math.round(Math.min(100, total));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ids: number[] = Array.from(new Set<number>((Array.isArray(body.ids) ? body.ids : []).map(Number).filter((id: number) => Number.isFinite(id) && id > 0))).slice(0, 2);
    const serverSupabase = await createServerClient();
    const { data: authData } = await serverSupabase.auth.getUser();
    if (!authData.user) return NextResponse.json({ error: "سجّل دخولك حتى تستخدم المقارنة." }, { status: 401 });
    const userId = authData.user.id;
    const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !serviceKey) {
      console.error("NOVATEK comparison quota is not configured: missing Supabase service key");
      return NextResponse.json({ error: "تعذر تجهيز المقارنة حالياً. جرّب مرة ثانية لاحقاً." }, { status: 503 });
    }
    const service = getServiceClient();
    const { data: usageRow } = await service.from("comparison_usage").select("comparison_count,free_limit,reset_at").eq("user_id", userId).maybeSingle();
    const now = Date.now();
    let used = Number(usageRow?.comparison_count ?? 0);
    if (usageRow?.reset_at && new Date(usageRow.reset_at).getTime() <= now) used = 0;
    const limit = 10;
    if (used >= limit) return NextResponse.json({ error: "وصلت للحد الشهري للمقارنات (10 مقارنات). بيتجدد رصيدك مع بداية الشهر الجاي.", quota: { used, remaining: 0, limit } }, { status: 429 });
    const preferences = body.preferences as ComparisonPreferences;
    if (ids.length !== 2) return NextResponse.json({ error: "اختار جهازين بالضبط." }, { status: 400 });

    const { data, error } = await supabase.from("laptops").select("*").in("id", ids);
    if (error || !data || data.length !== 2) return NextResponse.json({ error: "ما قدرت أجيب الجهازين." }, { status: 400 });
    const laptops = data as Laptop[];
    const cacheKey = `comparison:${ids.sort((a: number, b: number) => a - b).join("-")}:${JSON.stringify(preferences)}`;
    const cached = await readCache(cacheKey, 86400);
    if (cached) {
      const consumed = await consumeComparison(service, userId, used, limit);
      if (!consumed) return NextResponse.json({ error: "تعذر تحديث رصيد المقارنات. جرّب مرة ثانية." }, { status: 500 });
      return NextResponse.json({ ...cached.facts, sources: cached.sources, research: (cached.facts as any)?.research || [], cached: true, quota: consumed });
    }

    const research = await Promise.all(laptops.map(async (l) => {
      const key = `laptop-research:${l.id}:${l.name}`;
      const hit = await readCache(key, 604800);
      if (hit) return hit;
      try {
        const fresh = await researchLaptop(`${l.name} ${l.cpu || ""} ${l.gpu || ""} specifications review`);
        const merged = { query: l.name, summary: fresh.map(x => x.summary).filter(Boolean).join("\n\n"), facts: {}, sources: fresh.flatMap(x => x.sources), prices: fresh.flatMap(x => x.prices || []), fetchedAt: new Date().toISOString() };
        if (fresh.length) await writeCache(key, merged, 604800);
        return merged;
      } catch (error) {
        console.error(`NOVATEK research error for laptop ${l.id}:`, error);
        return { query: l.name, summary: "", facts: {}, sources: [], prices: [], fetchedAt: new Date().toISOString() };
      }
    }));

    const localScores = laptops.map(l => ({ id: l.id, score: score(l, preferences) }));
    const prompt = `قارن بين جهازي NOVATEK التاليين حسب تفضيلات المستخدم. لا تفترض أن الأغلى أفضل. استخدم المواصفات المحلية والمعلومات الخارجية. أرجع JSON فقط بالشكل: {"winnerId":number,"winnerScore":number,"reason":"string","categoryScores":[{"label":"string","left":number,"right":number}],"warnings":["string"]}. الأجهزة: ${JSON.stringify(laptops.map(l => ({ id:l.id,name:l.name,brand:l.brand,cpu:l.cpu,gpu:l.gpu,ram:l.ram,storage:l.storage,screen_size:l.screen_size,screen_resolution:l.screen_resolution,battery:l.battery_health,price:l.price })))}. التفضيلات: ${JSON.stringify(preferences)}. التقييم المحلي: ${JSON.stringify(localScores)}. المعلومات الخارجية: ${research.map(r=>({query:r.query,summary:r.summary,sources:r.sources,prices:r.prices})).map((item) => JSON.stringify(item)).join("\n")}`;
    const ai = await askGemini(prompt);
    let result: any = null;
    try { result = ai ? JSON.parse(ai.replace(/^```json\s*|\s*```$/g, "")) : null; } catch { result = null; }
    if (!result) {
      const winner = [...localScores].sort((a,b)=>b.score-a.score)[0];
      result = { winnerId: winner.id, winnerScore: winner.score, reason: "النتيجة مبنية على تفضيلاتك ومواصفات الجهازين المتوفرة حالياً.", categoryScores: [], warnings: [] };
    }
    const payload = {
      ...result,
      sources: research.flatMap(r => r.sources),
      research: research.map((r) => ({ query: r.query, summary: r.summary, facts: r.facts, sources: r.sources, prices: r.prices || [] })),
    };
    await writeCache(cacheKey, { query: cacheKey, summary: result.reason, facts: payload, sources: payload.sources, fetchedAt: new Date().toISOString() }, 86400);
    const consumed = await consumeComparison(service, userId, used, limit);
    if (!consumed) return NextResponse.json({ error: "تعذر تحديث رصيد المقارنات. جرّب مرة ثانية." }, { status: 500 });
    return NextResponse.json({ ...payload, quota: consumed });
  } catch (error) {
    console.error("NOVATEK comparison error:", error);
    return NextResponse.json({ error: "تعذر إجراء المقارنة حالياً. جرّب مرة ثانية." }, { status: 500 });
  }
}

async function consumeComparison(service: ReturnType<typeof getServiceClient>, userId: string, used: number, limit: number) {
  const resetAt = new Date();
  resetAt.setMonth(resetAt.getMonth() + 1, 1);
  resetAt.setHours(0, 0, 0, 0);
  const nextUsed = used + 1;
  const { error } = await service.from("comparison_usage").upsert({
    user_id: userId,
    comparison_count: nextUsed,
    free_limit: limit,
    reset_at: resetAt.toISOString(),
  }, { onConflict: "user_id" });
  if (error) {
    console.error("NOVATEK comparison quota error:", error);
    return null;
  }
  return { used: nextUsed, remaining: Math.max(0, limit - nextUsed), limit };
}
