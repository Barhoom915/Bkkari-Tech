import "server-only";

const BASE_URL = "https://satofill.com/wp-json/mps/v1";

function getToken() {
  const token = process.env.SATOFILL_API_TOKEN;
  if (!token) {
    throw new Error("SATOFILL_API_TOKEN غير موجود بمتغيرات البيئة");
  }
  return token;
}

async function satofillFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`SatoFill API error ${res.status}: ${text.slice(0, 300)}`);
  }

  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`SatoFill returned a non-JSON response: ${text.slice(0, 500)}`);
  }
}

export type SatofillProduct = {
  id: number | string;
  name: string;
  price: number | string;
  currency_name?: string;
  currency_symbol?: string;
  available?: boolean;
  min_quantity?: number;
  max_quantity?: number;
  categories?: string[];
  thumbnail?: string | null;
  custom_fields?: Array<{
    key: string;
    label: string;
    type: string;
    required?: boolean;
    options?: string[] | null;
  }>;
  [key: string]: unknown;
};

export type SatofillCategory = {
  id: number | string;
  name: string;
  slug?: string;
  parent?: number | string;
  order?: number;
  image?: string | null;
  description?: string;
  direct_products_count?: number;
  subcategories_count?: number;
  subcategories?: SatofillCategory[];
  products?: SatofillProduct[];
  pagination?: {
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
    has_more?: boolean;
  };
  [key: string]: unknown;
};


export const SATOFILL_BLOCKED_CATEGORY_TERMS = [
  "casino", "casinos", "gambling", "betting", "roulette", "poker", "pokies", "slots",
  "programming", "web development", "web design", "social media", "social-media",
  "adsl", "syria adsl", "payments", "payment",
  "كازينو", "قمار", "مراهن", "روليت", "بوكر",
  "برمجة", "برمجه", "تصميم مواقع", "مواقع", "سوشيل ميديا", "سوشيال ميديا", "سوشال ميديا",
  "adsl سوريا", "مدفوعات", "مدفوعات إلكترونية", "مدفوعات الكترونية",
] as const;

export const SATOFILL_CHAT_TERMS = [
  "chat", "messaging", "messenger", "discord", "telegram", "whatsapp", "viber", "signal", "line", "wechat", "imo", "skype", "zalo",
  "دردشة", "دردش", "محادث", "شات", "مراسلة", "مراسلات", "واتساب", "تلغرام", "ديسكورد", "ماسنجر",
] as const;

export function isSatoFillBlocked(value: string | undefined) {
  if (!value) return false;
  const text = value.toLowerCase();
  return SATOFILL_BLOCKED_CATEGORY_TERMS.some((term) => text.includes(term));
}

export function isSatoFillChatProduct(product: Pick<SatofillProduct, "name" | "categories">) {
  const text = `${product.name} ${(product.categories ?? []).join(" ")}`.toLowerCase();
  return SATOFILL_CHAT_TERMS.some((term) => text.includes(term));
}

export function getSatoFillStorePrice(price: number | string, isChatProduct: boolean, chatMarkupPercent: number = 5) {
  const numeric = Number(price);
  if (!Number.isFinite(numeric)) return price;
  const storePrice = isChatProduct ? numeric * (1 + chatMarkupPercent / 100) : numeric;
  return Math.round((storePrice + Number.EPSILON) * 100) / 100;
}

export const satofill = {
  async getProducts(): Promise<SatofillProduct[]> {
    const data = await satofillFetch<{
      success?: boolean;
      data?: {
        products?: SatofillProduct[];
        total?: number;
      };
    }>("/products");

    return Array.isArray(data.data?.products) ? data.data.products : [];
  },

  async getProduct(id: string | number): Promise<SatofillProduct> {
    const data = await satofillFetch<{ data?: SatofillProduct }>(`/products/${id}`);
    return data.data ?? (data as unknown as SatofillProduct);
  },

  async getCategories(): Promise<SatofillCategory[]> {
    const data = await satofillFetch<{
      success?: boolean;
      data?: {
        categories?: SatofillCategory[];
        total_categories?: number;
        total_products?: number;
      };
    }>("/categories?with_products=yes&include_empty=no&per_page=100&page=1");

    return Array.isArray(data.data?.categories) ? data.data.categories : [];
  },

  async getCategory(slug: string): Promise<SatofillCategory | null> {
    const data = await satofillFetch<{
      success?: boolean;
      data?: {
        categories?: SatofillCategory[];
      };
    }>(`/categories?slug=${encodeURIComponent(slug)}&with_products=yes&include_empty=no&per_page=100&page=1`);

    const category = data.data?.categories?.[0];
    if (category) return category;

    // Some catalogs may expose a category without a slug. In that case
    // resolve the numeric route through the category tree.
    if (/^\d+$/.test(slug)) {
      const categories = await this.getCategories();
      return categories.find((item) => String(item.id) === slug) ?? null;
    }

    return null;
  },

  async createOrder(payload: Record<string, unknown>) {
    return satofillFetch("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getOrder(id: string | number) {
    return satofillFetch(`/orders/${id}`);
  },

  async getOrdersStatus(orderIds: Array<string | number>) {
    const batch = orderIds.slice(0, 50);
    return satofillFetch("/orders/status", {
      method: "POST",
      body: JSON.stringify({ order_ids: batch }),
    });
  },

  async getBalance(): Promise<{ balance: number; currency?: string }> {
    return satofillFetch("/balance");
  },
};
