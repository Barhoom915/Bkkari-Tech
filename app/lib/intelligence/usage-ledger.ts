import { createHash } from "node:crypto";
import { createClient as createServerClient, getServiceClient } from "@/app/lib/supabase-server";

type QuotaResult = {
  allowed: boolean;
  reason: "rate_limited" | "daily_limit" | "monthly_limit" | null;
  dailyUsed: number;
  dailyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
  minuteUsed: number;
  minuteLimit: number;
  dayResetsAt: string;
  monthResetsAt: string;
};

export async function beginAiUsage(request: Request) {
  const server = await createServerClient();
  const { data } = await server.auth.getUser();
  const user = data.user ?? null;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").map((v) => v.trim()).filter(Boolean) ?? [];
  const ip = forwarded.length ? forwarded[forwarded.length - 1] : request.headers.get("x-real-ip") || "unknown";
  const actorKey = user
    ? `user:${user.id}`
    : `guest:${createHash("sha256").update(ip).digest("hex").slice(0, 40)}`;
  const db = getServiceClient();
  const { data: quotaData, error } = await db.rpc("consume_ai_usage_quota", {
    p_actor_key: actorKey,
    p_user_id: user?.id ?? null,
    p_daily_limit: 30,
    p_monthly_limit: 300,
    p_minute_limit: 6,
  });
  if (error) throw new Error("ai_usage_quota_unavailable");
  return { user, actorKey, quota: quotaData as QuotaResult };
}

export async function recordAiUsage(input: {
  userId: string | null;
  provider: string;
  model?: string | null;
  status: "success" | "failed" | "cached";
  latencyMs: number;
  errorCode?: string | null;
}) {
  try {
    const db = getServiceClient();
    const { error } = await db.from("ai_usage_events").insert({
      user_id: input.userId,
      feature: "ai_chat",
      provider: input.provider,
      model: input.model ?? null,
      status: input.status,
      latency_ms: Math.max(0, Math.round(input.latencyMs)),
      input_tokens: null,
      output_tokens: null,
      total_tokens: null,
      cost_usd: null,
      cost_is_estimate: false,
      compared_product_ids: [],
      error_code: input.errorCode ?? null,
    });
    if (error) console.error("NOVATEK AI usage ledger insert failed:", error.message);
  } catch (error) {
    console.error("NOVATEK AI usage ledger unavailable:", error instanceof Error ? error.message : "unknown");
  }
}
