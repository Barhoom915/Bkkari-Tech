/**
 * NOVATEK V98.26 — deterministic supplier quote comparison foundation.
 *
 * Pure calculation only: this module does not call providers, place orders,
 * debit wallets, or change the existing SatoFill checkout flow.
 * Provider adapters must map their verified quote schema into SupplierQuote.
 */

export type SupplierQuote = {
  provider: string;
  serviceKey: string;
  available: boolean;
  /** Provider's minimum and maximum supported quantity for this exact service. */
  minQuantity: number;
  maxQuantity: number;
  /** Cost for the full requested quantity, already normalized into one currency. */
  totalCost: number;
  currency: string;
  /** Optional fixed provider fee included in totalCost by the adapter. */
  quoteId?: string;
  quotedAt?: string;
};

export type SupplierSelection = {
  provider: string;
  serviceKey: string;
  quantity: number;
  totalCost: number;
  currency: string;
  quoteId?: string;
  quotedAt?: string;
};

export type SupplierSelectionResult =
  | { ok: true; selection: SupplierSelection; considered: number; rejected: number }
  | { ok: false; reason: "invalid_quantity" | "no_eligible_quote"; considered: number; rejected: number };

/**
 * Choose the lowest valid quote for the exact requested quantity.
 * All quote totals must use the same currency and include applicable fees
 * before they reach this function. Ties are resolved deterministically by
 * provider name, avoiding flaky results when totals are equal.
 */
export function selectCheapestSupplier(
  quotes: SupplierQuote[],
  serviceKey: string,
  quantity: number,
  currency: string,
): SupplierSelectionResult {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    return { ok: false, reason: "invalid_quantity", considered: 0, rejected: quotes.length };
  }

  const normalizedCurrency = currency.trim().toUpperCase();
  const normalizedServiceKey = serviceKey.trim();
  if (!normalizedCurrency || !normalizedServiceKey) {
    return { ok: false, reason: "no_eligible_quote", considered: quotes.length, rejected: quotes.length };
  }

  const candidates = quotes.filter((quote) => {
    if (!quote || quote.serviceKey.trim() !== normalizedServiceKey || !quote.available) return false;
    if (!quote.provider.trim()) return false;
    if (!Number.isFinite(quote.minQuantity) || !Number.isFinite(quote.maxQuantity)) return false;
    if (quote.minQuantity < 0 || quote.maxQuantity < quote.minQuantity) return false;
    if (quantity < quote.minQuantity || quantity > quote.maxQuantity) return false;
    if (!Number.isFinite(quote.totalCost) || quote.totalCost < 0) return false;
    if (quote.currency.trim().toUpperCase() !== normalizedCurrency) return false;
    return true;
  });

  if (candidates.length === 0) {
    return {
      ok: false,
      reason: "no_eligible_quote",
      considered: quotes.length,
      rejected: quotes.length,
    };
  }

  candidates.sort((a, b) => a.totalCost - b.totalCost || a.provider.localeCompare(b.provider));

  const winner = candidates[0];
  return {
    ok: true,
    selection: {
      provider: winner.provider,
      serviceKey: winner.serviceKey,
      quantity,
      totalCost: winner.totalCost,
      currency: normalizedCurrency,
      ...(winner.quoteId ? { quoteId: winner.quoteId } : {}),
      ...(winner.quotedAt ? { quotedAt: winner.quotedAt } : {}),
    },
    considered: quotes.length,
    rejected: quotes.length - candidates.length,
  };
}
