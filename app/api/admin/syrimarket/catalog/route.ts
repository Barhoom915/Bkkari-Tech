import { NextResponse } from "next/server";
import { createClient, getServiceClient } from "@/app/lib/supabase-server";
import { syriaMarket, SyriaMarketApiError } from "@/app/lib/syrimarket";
import { inspectCatalogPayload } from "@/app/lib/suppliers/inspect-schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "سجّل دخول بحساب الإدارة أولاً" }, { status: 401 });

  const service = getServiceClient();
  const { data: admin } = await service
    .from("admin_users")
    .select("id")
    .eq("email", auth.user.email ?? "")
    .eq("is_active", true)
    .maybeSingle();
  if (!admin) return NextResponse.json({ error: "غير مصرح لك بالوصول" }, { status: 403 });

  if (!process.env.SYRIMARKET_API_TOKEN) {
    return NextResponse.json({ configured: false, error: "SYRIMARKET_API_TOKEN غير مضبوط على بيئة النشر" }, { status: 503 });
  }

  try {
    const [profile, products, categories] = await Promise.all([
      syriaMarket.getProfile(),
      syriaMarket.getProducts(),
      syriaMarket.getCategories(0),
    ]);
    return NextResponse.json({
      ok: true,
      configured: true,
      provider: "SyriMarket",
      profile,
      products,
      categories,
      // Admin-only structure diagnostics to verify real field paths before normalization.
      catalogSchema: inspectCatalogPayload(products),
      categoriesSchema: inspectCatalogPayload(categories),
    });
  } catch (error) {
    if (error instanceof SyriaMarketApiError) {
      const status = error.status === 401 || error.status === 403 ? 502 : error.status === 429 ? 503 : 502;
      return NextResponse.json({
        ok: false,
        configured: true,
        provider: "SyriMarket",
        error: error.status === 401 || error.status === 403
          ? "رفض SyriMarket المصادقة. تأكد من التوكن في Vercel ثم أعد النشر."
          : error.status === 429
            ? "وصلت لحد الطلبات المسموح به من SyriMarket. جرّب لاحقاً."
            : "تعذر جلب كتالوج SyriMarket. تحقق من حالة الخدمة والتوثيق.",
        upstreamStatus: error.status,
        retryable: error.retryable,
      }, { status });
    }
    console.error("SyriMarket catalog check failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ ok: false, configured: true, error: "تعذر الاتصال بـ SyriMarket" }, { status: 502 });
  }
}
