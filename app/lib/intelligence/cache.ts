import { createClient } from "@supabase/supabase-js";
import type { ExternalLaptopData } from "./types";

function serverSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function readCache(cacheKey: string, maxAgeSeconds = 86400) {
  const client = serverSupabase();
  if (!client) return null;
  const { data } = await client.from("product_intelligence_cache").select("payload,fetched_at").eq("cache_key", cacheKey).maybeSingle();
  if (!data) return null;
  const age = (Date.now() - new Date(data.fetched_at).getTime()) / 1000;
  if (age > maxAgeSeconds) return null;
  return data.payload as ExternalLaptopData;
}

export async function writeCache(cacheKey: string, payload: ExternalLaptopData, ttlSeconds = 86400) {
  const client = serverSupabase();
  if (!client) return;
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  await client.from("product_intelligence_cache").upsert({
    cache_key: cacheKey,
    payload,
    fetched_at: new Date().toISOString(),
    expires_at: expiresAt,
  }, { onConflict: "cache_key" });
}
