import { NextResponse } from "next/server";
import { createClient, getServiceClient } from "@/app/lib/supabase-server";
import { syriaMarket, SyriaMarketApiError } from "@/app/lib/syrimarket";
import { inspectCatalogPayload } from "@/app/lib/suppliers/inspect-schema";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * NOVATEK V98.32 — minimal admin-only schema report.
 * Returns field paths/types and candidate array paths only; it does not return
 * the raw provider catalog, account profile, tokens, or request headers.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ ok: false, error: "سجّل دخول بحساب الإدارة أولاً" }, { status: 401 });
  }

  const service = getServiceClient();
  const { data: admin } = await service
    .from("admin_users")
    .select("id")
    .eq("email", auth.user.email ?? "")
    .eq("is_active", true)
    .maybeSingle();

  if (!admin) {
    return NextResponse.json({ ok: false, error: "غير مصرح لك بالوصول" }, { status: 403 });
  }

  if (!process.env.SYRIMARKET_API_TOKEN?.trim() && !process.env.SYRIMARKET_API_KEY?.trim()) {
    return NextResponse.json(
      { ok: false, configured: false, error: "SYRIMARKET_API_TOKEN غير مضبوط على بيئة النشر" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const [products, categories] = await Promise.all([
      syriaMarket.getProducts(),
      syriaMarket.getCategories(0),
    ]);

    return NextResponse.json({
      ok: true,
      configured: true,
      provider: "SyriMarket",
      catalogSchema: inspectCatalogPayload(products),
      categoriesSchema: inspectCatalogPayload(categories),
      note: "هذا التقرير يصف بنية البيانات فقط؛ لا يفعّل الطلبات ولا يستنتج معنى السعر أو العملة.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof SyriaMarketApiError) {
      const status = error.status === 429 ? 503 : 502;
      return NextResponse.json({
        ok: false,
        configured: true,
        error: error.status === 401 || error.status === 403
          ? "رفض SyriMarket المصادقة. تحقق من إعداد التوكن."
          : error.status === 429
            ? "وصل SyriMarket إلى حد الطلبات؛ جرّب لاحقاً."
            : "تعذر جلب مخطط كتالوج SyriMarket.",
        upstreamStatus: error.status,
        retryable: error.retryable,
      }, { status, headers: { "Cache-Control": "no-store" } });
    }

    console.error("SyriMarket schema report failed", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json(
      { ok: false, configured: true, error: "تعذر إنشاء تقرير مخطط SyriMarket." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
