import { NextResponse } from "next/server";
import { syriaMarket, SyriaMarketApiError } from "@/app/lib/syrimarket";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Public, read-only catalog endpoint for the storefront.
 * Never exposes provider credentials or account/profile information.
 * Keep the upstream payload intact until the provider's exact schema is verified.
 */
export async function GET() {
  if (!process.env.SYRIMARKET_API_TOKEN?.trim() && !process.env.SYRIMARKET_API_KEY?.trim()) {
    return NextResponse.json(
      { ok: false, provider: "SyriMarket", error: "كتالوج SyriMarket غير مهيأ حالياً" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const [products, categories] = await Promise.all([
      syriaMarket.getProducts(),
      syriaMarket.getCategories(0),
    ]);

    return NextResponse.json(
      { ok: true, provider: "SyriMarket", products, categories },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const status = error instanceof SyriaMarketApiError && error.status === 429 ? 503 : 502;
    // Avoid returning provider messages, URLs, headers, or credentials to public clients.
    console.error("Public SyriMarket catalog request failed", {
      status: error instanceof SyriaMarketApiError ? error.status : undefined,
      retryable: error instanceof SyriaMarketApiError ? error.retryable : undefined,
    });
    return NextResponse.json(
      { ok: false, provider: "SyriMarket", error: "تعذر تحميل كتالوج SyriMarket حالياً" },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
