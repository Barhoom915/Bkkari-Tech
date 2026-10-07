import { NextResponse } from "next/server";
import { getProviderUsage } from "@/app/lib/intelligence/providers";
import { createClient as createServerClient, getServiceClient } from "@/app/lib/supabase-server";

export async function GET() {
  const serpapi = await getProviderUsage();
  const server = await createServerClient();
  const { data: auth } = await server.auth.getUser();
  let comparison = null;
  if (auth.user) {
    const service = getServiceClient();
    const { data: row } = await service.from("comparison_usage").select("comparison_count,reset_at").eq("user_id", auth.user.id).maybeSingle();
    const resetExpired = !row?.reset_at || new Date(row.reset_at).getTime() <= Date.now();
    const used = resetExpired ? 0 : Number(row?.comparison_count ?? 0);
    comparison = { used, remaining: Math.max(0, 10 - used), limit: 10, resetAt: row?.reset_at ?? null };
  }
  return NextResponse.json({
    providers: {
      serpapi: serpapi ? {
        used: Number(serpapi.this_month_usage ?? 0),
        remaining: Number(serpapi.plan_searches_left ?? 0),
        total: Number(serpapi.searches_per_month ?? 0),
        renewal: serpapi.plan_renewal_date ?? null,
      } : null,
      comparison,
    configured: {
        serpapi: Boolean(process.env.SERPAPI_KEY),
        pricesapi: Boolean(process.env.PRICESAPI_KEY),
        tavily: Boolean(process.env.TAVILY_API_KEY),
        gemini: Boolean(process.env.GEMINI_API_KEY),
      },
    },
  });
}
