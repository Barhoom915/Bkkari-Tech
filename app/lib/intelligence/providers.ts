import type { ExternalLaptopData, ProviderName, SourceRef } from "./types";

const clean = (v: unknown) => String(v ?? "").trim();

async function serpApi(query: string): Promise<ExternalLaptopData | null> {
  const key = process.env.SERPAPI_KEY;
  if (!key) return null;
  try {
    const url = new URL("https://serpapi.com/search");
    url.searchParams.set("engine", "google");
    url.searchParams.set("q", query);
    url.searchParams.set("hl", "en");
    url.searchParams.set("api_key", key);
    const res = await fetch(url, { signal: AbortSignal.timeout(15000), cache: "no-store" });
    if (!res.ok) return null;
    const body = await res.json();
    const results = Array.isArray(body.organic_results) ? body.organic_results : [];
    const sources: SourceRef[] = results.slice(0, 4).map((x: any) => ({ provider: "serpapi", title: clean(x.title) || clean(x.source) || "Web result", url: clean(x.link) || undefined }));
    const text = results.slice(0, 4).map((x: any) => `${clean(x.title)}\n${clean(x.snippet)}`).join("\n\n");
    return { query, summary: text, facts: {}, sources, fetchedAt: new Date().toISOString() };
  } catch (error) {
    console.error("NOVATEK SerpApi error:", error);
    return null;
  }
}

async function tavily(query: string): Promise<ExternalLaptopData | null> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: key, query, search_depth: "basic", max_results: 3, include_answer: true, include_raw_content: false }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const body = await res.json();
    const results = Array.isArray(body.results) ? body.results : [];
    const sources: SourceRef[] = results.map((x: any) => ({ provider: "tavily", title: clean(x.title) || "Web result", url: clean(x.url) || undefined }));
    const text = [clean(body.answer), ...results.map((x: any) => `${clean(x.title)}\n${clean(x.content)}`)].filter(Boolean).join("\n\n");
    return { query, summary: text, facts: {}, sources, fetchedAt: new Date().toISOString() };
  } catch (error) {
    console.error("NOVATEK Tavily error:", error);
    return null;
  }
}

async function pricesApi(query: string): Promise<ExternalLaptopData | null> {
  const key = process.env.PRICESAPI_KEY;
  if (!key) return null;
  try {
    const url = new URL("https://api.pricesapi.io/api/v1/products/search");
    url.searchParams.set("q", query);
    url.searchParams.set("market", process.env.PRICESAPI_MARKET || "us");
    // Keep external price usage intentionally small: one product result and at most three offers.
    url.searchParams.set("limit", "1");
    url.searchParams.set("offers_limit", "3");
    const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(30000), cache: "no-store" });
    if (!res.ok) return null;
    const body = await res.json();
    const products = Array.isArray(body?.data?.products) ? body.data.products.slice(0, 1) : [];
    const prices = products.flatMap((p: any) => (Array.isArray(p.offers) ? p.offers.slice(0, 3) : []).map((o: any) => ({ seller: clean(o.seller), price: Number(o.price) || undefined, currency: clean(o.currency), url: clean(o.url) || undefined })));
    const sources: SourceRef[] = products.map((p: any) => ({ provider: "pricesapi", title: clean(p.title) || "Price result", url: clean(p.source_url) || undefined }));
    return { query, summary: products.map((p: any) => `${clean(p.title)} — ${p.headline_price ?? "?"} ${clean(p.headline_currency)}`).join("\n"), facts: {}, prices, sources, fetchedAt: new Date().toISOString() };
  } catch (error) {
    console.error("NOVATEK PricesAPI error:", error);
    return null;
  }
}

export async function researchLaptop(query: string) {
  const results: ExternalLaptopData[] = [];

  // One web provider first. Tavily is a true fallback only when SerpApi fails.
  const primary = await serpApi(query);
  if (primary) {
    results.push(primary);
  } else {
    const fallback = await tavily(query);
    if (fallback) results.push(fallback);
  }

  // Price lookup is optional and deliberately capped to reduce paid usage.
  const price = await pricesApi(query);
  if (price) results.push(price);

  return results;
}

export async function getProviderUsage() {
  const key = process.env.SERPAPI_KEY;
  if (!key) return null;
  try {
    const url = new URL("https://serpapi.com/account");
    url.searchParams.set("api_key", key);
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export const providers: ProviderName[] = ["store", "cache", "serpapi", "tavily", "pricesapi", "gemini"];
