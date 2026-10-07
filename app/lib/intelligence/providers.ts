import type { ExternalLaptopData, ProviderName, SourceRef } from "./types";

const clean = (v: unknown) => String(v ?? "").trim();

async function serpApi(query: string): Promise<ExternalLaptopData | null> {
  const key = process.env.SERPAPI_KEY;
  if (!key) return null;
  const url = new URL("https://serpapi.com/search");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  url.searchParams.set("hl", "en");
  url.searchParams.set("api_key", key);
  const res = await fetch(url, { signal: AbortSignal.timeout(15000), cache: "no-store" });
  if (!res.ok) return null;
  const body = await res.json();
  const sources: SourceRef[] = (body.organic_results || []).slice(0, 6).map((x: any) => ({ provider: "serpapi", title: clean(x.title) || clean(x.source) || "Web result", url: clean(x.link) || undefined }));
  const text = (body.organic_results || []).slice(0, 6).map((x: any) => `${clean(x.title)}\n${clean(x.snippet)}`).join("\n\n");
  return { query, summary: text, facts: {}, sources, fetchedAt: new Date().toISOString() };
}

async function tavily(query: string): Promise<ExternalLaptopData | null> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: key, query, search_depth: "basic", max_results: 6, include_answer: true, include_raw_content: false }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return null;
  const body = await res.json();
  const results = Array.isArray(body.results) ? body.results : [];
  const sources: SourceRef[] = results.map((x: any) => ({ provider: "tavily", title: clean(x.title) || "Web result", url: clean(x.url) || undefined }));
  const text = [clean(body.answer), ...results.map((x: any) => `${clean(x.title)}\n${clean(x.content)}`)].filter(Boolean).join("\n\n");
  return { query, summary: text, facts: {}, sources, fetchedAt: new Date().toISOString() };
}

async function pricesApi(query: string): Promise<ExternalLaptopData | null> {
  const key = process.env.PRICESAPI_KEY;
  if (!key) return null;
  const url = new URL("https://api.pricesapi.io/api/v1/products/search");
  url.searchParams.set("q", query);
  url.searchParams.set("market", process.env.PRICESAPI_MARKET || "us");
  url.searchParams.set("limit", "3");
  url.searchParams.set("offers_limit", "10");
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(95000), cache: "no-store" });
  if (!res.ok) return null;
  const body = await res.json();
  const products = body?.data?.products || [];
  const prices = products.flatMap((p: any) => (p.offers || []).map((o: any) => ({ seller: clean(o.seller), price: Number(o.price) || undefined, currency: clean(o.currency), url: clean(o.url) || undefined })));
  const sources: SourceRef[] = products.map((p: any) => ({ provider: "pricesapi", title: clean(p.title) || "Price result", url: clean(p.source_url) || undefined }));
  return { query, summary: products.map((p: any) => `${clean(p.title)} — ${p.headline_price ?? "?"} ${clean(p.headline_currency)}`).join("\n"), facts: {}, prices, sources, fetchedAt: new Date().toISOString() };
}

export async function researchLaptop(query: string) {
  const results: ExternalLaptopData[] = [];
  const primary = await serpApi(query);
  if (primary) results.push(primary);
  if (!primary || primary.sources.length < 2) {
    const fallback = await tavily(query);
    if (fallback) results.push(fallback);
  }
  const price = await pricesApi(query);
  if (price) results.push(price);
  return results;
}

export async function getProviderUsage() {
  const key = process.env.SERPAPI_KEY;
  if (!key) return null;
  const url = new URL("https://serpapi.com/account");
  url.searchParams.set("api_key", key);
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10000) });
  if (!res.ok) return null;
  return res.json();
}

export const providers: ProviderName[] = ["store", "cache", "serpapi", "tavily", "pricesapi", "gemini"];
