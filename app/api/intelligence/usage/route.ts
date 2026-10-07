import { NextResponse } from "next/server";
import { getProviderUsage } from "@/app/lib/intelligence/providers";

export async function GET() {
  const serpapi = await getProviderUsage();
  return NextResponse.json({
    providers: {
      serpapi: serpapi ? {
        used: Number(serpapi.this_month_usage ?? 0),
        remaining: Number(serpapi.plan_searches_left ?? 0),
        total: Number(serpapi.searches_per_month ?? 0),
        renewal: serpapi.plan_renewal_date ?? null,
      } : null,
      configured: {
        serpapi: Boolean(process.env.SERPAPI_KEY),
        pricesapi: Boolean(process.env.PRICESAPI_KEY),
        tavily: Boolean(process.env.TAVILY_API_KEY),
        gemini: Boolean(process.env.GEMINI_API_KEY),
      },
    },
  });
}
