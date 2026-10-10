import "server-only";

const BASE_URL = (process.env.SYRIMARKET_API_URL?.trim() || "https://api.syrimarket.com/client/api/v1").replace(/\/$/, "");

function getToken() {
  const token = process.env.SYRIMARKET_API_TOKEN?.trim() || process.env.SYRIMARKET_API_KEY?.trim();
  if (!token) throw new Error("SYRIMARKET_API_TOKEN or SYRIMARKET_API_KEY is not configured");
  return token;
}

export class SyriaMarketApiError extends Error {
  status: number;
  retryable: boolean;
  constructor(message: string, status: number, retryable = false) {
    super(message);
    this.name = "SyriaMarketApiError";
    this.status = status;
    this.retryable = retryable;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const token = getToken();
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "api-token": token,
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
    cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(15_000),
  });

  const text = await response.text().catch(() => "");
  let payload: unknown = null;
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = { message: text.slice(0, 300) }; }
  }

  if (!response.ok) {
    const details = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
    const message = String(details.message ?? details.msg ?? details.detail ?? `HTTP ${response.status}`);
    const retryable = details.retryable === true || response.status === 429 || response.status >= 500;
    // Do not include request headers or token in errors/logs.
    throw new SyriaMarketApiError(`SyriaMarket ${method} ${path} failed: ${message}`, response.status, retryable);
  }
  return payload as T;
}

export const syriaMarket = {
  getProfile() {
    return request<unknown>("/profile");
  },
  /** Returns the provider's raw catalog payload; preserve provider product IDs and option structures. */
  getProducts() {
    return request<unknown>("/catalog/products");
  },
  /** categoryId 0 is the provider's root category endpoint. */
  getCategories(categoryId: string | number = 0) {
    return request<unknown>(`/catalog/categories/${encodeURIComponent(String(categoryId))}`);
  },
  /** Quote/order payloads are intentionally passed through without guessing provider-specific fields. */
  quote(payload: Record<string, unknown>) {
    return request<unknown>("/financial/quote", { method: "POST", body: JSON.stringify(payload) });
  },
  createOrder(payload: Record<string, unknown>, idempotencyKey: string) {
    return request<unknown>("/orders", {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(payload),
    });
  },
  getOrder(orderId: string | number) {
    return request<unknown>(`/orders/${encodeURIComponent(String(orderId))}`);
  },
  cancelOrder(orderId: string | number, payload: Record<string, unknown> = {}) {
    return request<unknown>(`/orders/${encodeURIComponent(String(orderId))}/cancel`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
