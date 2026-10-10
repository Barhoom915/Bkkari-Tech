/**
 * NOVATEK V98.29 — explicit provider-catalog normalization.
 *
 * This module is deliberately read-only. It normalizes known SatoFill fields
 * and supports SyriMarket only through caller-supplied, verified field paths.
 * It does not infer product equivalence, prices, currency conversions, or
 * orderability from unknown provider payloads.
 */
import type { SatofillProduct } from "@/app/lib/satofill";
import type { SupplierProvider, SupplierProductMapping } from "./catalog";

export type NormalizedSupplierProduct = {
  provider: SupplierProvider;
  providerProductId: string;
  providerName: string;
  rawPrice: number;
  currency: string;
  available: boolean;
  minQuantity: number;
  maxQuantity: number;
  categoryNames: string[];
  mapping?: SupplierProductMapping;
};

export type NormalizationIssueCode =
  | "invalid_product"
  | "missing_id"
  | "missing_name"
  | "invalid_price"
  | "missing_currency"
  | "invalid_quantity_range"
  | "missing_verified_mapping";

export type NormalizationIssue = {
  provider: SupplierProvider;
  code: NormalizationIssueCode;
  productId?: string;
  message: string;
};

export type NormalizationResult = {
  products: NormalizedSupplierProduct[];
  issues: NormalizationIssue[];
};

function positiveOrZeroInteger(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function finitePrice(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

/** Normalize SatoFill using its declared API type and field names. */
export function normalizeSatoFillProducts(
  input: unknown,
  mappings: SupplierProductMapping[] = [],
): NormalizationResult {
  if (!Array.isArray(input)) {
    return {
      products: [],
      issues: [{ provider: "satofill", code: "invalid_product", message: "كتالوج SatoFill ليس مصفوفة منتجات." }],
    };
  }

  const mappingById = new Map(
    mappings.filter((mapping) => mapping.provider === "satofill")
      .map((mapping) => [mapping.providerProductId, mapping]),
  );
  const products: NormalizedSupplierProduct[] = [];
  const issues: NormalizationIssue[] = [];

  for (const value of input) {
    if (!value || typeof value !== "object") {
      issues.push({ provider: "satofill", code: "invalid_product", message: "تم تجاهل سجل منتج غير صالح." });
      continue;
    }

    const product = value as SatofillProduct;
    const id = String(product.id ?? "").trim();
    const name = typeof product.name === "string" ? product.name.trim() : "";
    const price = finitePrice(product.price);
    const currency = String(product.currency_name ?? product.currency_symbol ?? "").trim().toUpperCase();
    const minQuantity = positiveOrZeroInteger(product.min_quantity, 1);
    const maxQuantity = positiveOrZeroInteger(product.max_quantity, Number.MAX_SAFE_INTEGER);

    if (!id) issues.push({ provider: "satofill", code: "missing_id", message: "منتج SatoFill بلا معرّف." });
    if (!name) issues.push({ provider: "satofill", code: "missing_name", productId: id || undefined, message: "منتج SatoFill بلا اسم." });
    if (price === null) issues.push({ provider: "satofill", code: "invalid_price", productId: id || undefined, message: "سعر SatoFill غير صالح." });
    if (!currency) issues.push({ provider: "satofill", code: "missing_currency", productId: id || undefined, message: "عملة SatoFill غير محددة؛ لم يتم تخمينها." });
    if (maxQuantity < minQuantity) issues.push({ provider: "satofill", code: "invalid_quantity_range", productId: id || undefined, message: "نطاق الكمية في SatoFill غير صالح." });

    if (!id || !name || price === null || !currency || maxQuantity < minQuantity) continue;

    const mapping = mappingById.get(id);
    if (!mapping) {
      issues.push({ provider: "satofill", code: "missing_verified_mapping", productId: id, message: "المنتج مطبّع لكنه غير مربوط بخدمة NOVATEK موثّقة." });
    }

    products.push({
      provider: "satofill",
      providerProductId: id,
      providerName: name,
      rawPrice: price,
      currency,
      available: product.available !== false,
      minQuantity,
      maxQuantity,
      categoryNames: Array.isArray(product.categories)
        ? product.categories.filter((item): item is string => typeof item === "string" && !!item.trim())
        : [],
      ...(mapping ? { mapping } : {}),
    });
  }

  return { products, issues };
}

export type VerifiedFieldPaths = {
  id: string;
  name: string;
  price: string;
  currency: string;
  available?: string;
  minQuantity?: string;
  maxQuantity?: string;
  categories?: string;
};

/** Read a value only from an explicitly configured path; no synonym guessing. */
function readPath(value: unknown, path: string | undefined): unknown {
  if (!path?.trim()) return undefined;
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
}

/**
 * Normalize SyriMarket only when its exact response paths have been verified
 * against real API responses. Pass the product array, not an opaque wrapper.
 */
export function normalizeSyriMarketProducts(
  input: unknown,
  paths: VerifiedFieldPaths,
  mappings: SupplierProductMapping[] = [],
): NormalizationResult {
  if (!Array.isArray(input)) {
    return {
      products: [],
      issues: [{ provider: "syrimarket", code: "invalid_product", message: "يجب تمرير مصفوفة منتجات SyriMarket بعد تحديد غلاف الاستجابة الصحيح." }],
    };
  }

  const mappingById = new Map(
    mappings.filter((mapping) => mapping.provider === "syrimarket")
      .map((mapping) => [mapping.providerProductId, mapping]),
  );
  const products: NormalizedSupplierProduct[] = [];
  const issues: NormalizationIssue[] = [];

  for (const value of input) {
    if (!value || typeof value !== "object") {
      issues.push({ provider: "syrimarket", code: "invalid_product", message: "تم تجاهل سجل SyriMarket غير صالح." });
      continue;
    }

    const rawId = readPath(value, paths.id);
    const rawName = readPath(value, paths.name);
    const id = rawId === undefined || rawId === null ? "" : String(rawId).trim();
    const name = typeof rawName === "string" ? rawName.trim() : "";
    const price = finitePrice(readPath(value, paths.price));
    const currencyValue = readPath(value, paths.currency);
    const currency = typeof currencyValue === "string" ? currencyValue.trim().toUpperCase() : "";
    const availableValue = paths.available ? readPath(value, paths.available) : undefined;
    const minValue = paths.minQuantity ? readPath(value, paths.minQuantity) : undefined;
    const maxValue = paths.maxQuantity ? readPath(value, paths.maxQuantity) : undefined;
    const minQuantity = minValue === undefined ? 1 : positiveOrZeroInteger(minValue, -1);
    const maxQuantity = maxValue === undefined ? Number.MAX_SAFE_INTEGER : positiveOrZeroInteger(maxValue, -1);
    const categoryValue = paths.categories ? readPath(value, paths.categories) : undefined;

    if (!id) issues.push({ provider: "syrimarket", code: "missing_id", message: "منتج SyriMarket بلا معرّف حسب المسار الموثّق." });
    if (!name) issues.push({ provider: "syrimarket", code: "missing_name", productId: id || undefined, message: "منتج SyriMarket بلا اسم حسب المسار الموثّق." });
    if (price === null) issues.push({ provider: "syrimarket", code: "invalid_price", productId: id || undefined, message: "سعر SyriMarket غير صالح حسب المسار الموثّق." });
    if (!currency) issues.push({ provider: "syrimarket", code: "missing_currency", productId: id || undefined, message: "عملة SyriMarket غير محددة؛ لم يتم تخمينها." });
    if (minQuantity < 0 || maxQuantity < minQuantity) issues.push({ provider: "syrimarket", code: "invalid_quantity_range", productId: id || undefined, message: "نطاق كمية SyriMarket غير صالح." });

    if (!id || !name || price === null || !currency || minQuantity < 0 || maxQuantity < minQuantity) continue;

    const mapping = mappingById.get(id);
    if (!mapping) {
      issues.push({ provider: "syrimarket", code: "missing_verified_mapping", productId: id, message: "المنتج مطبّع لكنه غير مربوط بخدمة NOVATEK موثّقة." });
    }

    const categoryNames = Array.isArray(categoryValue)
      ? categoryValue.filter((item): item is string => typeof item === "string" && !!item.trim())
      : typeof categoryValue === "string" && categoryValue.trim() ? [categoryValue.trim()] : [];

    products.push({
      provider: "syrimarket",
      providerProductId: id,
      providerName: name,
      rawPrice: price,
      currency,
      // Unknown availability is treated as unavailable, never optimistically available.
      available: availableValue === true || availableValue === 1 || availableValue === "true",
      minQuantity,
      maxQuantity,
      categoryNames,
      ...(mapping ? { mapping } : {}),
    });
  }

  return { products, issues };
}
