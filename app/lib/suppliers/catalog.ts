/**
 * NOVATEK V98.28 — unified supplier catalog contracts.
 *
 * This module defines the safe internal shape for mapping verified provider
 * products to one NOVATEK service. It deliberately does not guess matches from
 * names: provider IDs must be explicitly mapped after reviewing service specs.
 */

export const SUPPLIER_PROVIDERS = ["satofill", "syrimarket", "sw-games"] as const;
export type SupplierProvider = (typeof SUPPLIER_PROVIDERS)[number];

export type SupplierProductMapping = {
  provider: SupplierProvider;
  providerProductId: string;
  /** Internal stable NOVATEK service ID; shared by provider variants of the same service. */
  serviceId: string;
  providerName: string;
  /** Human-reviewed specification fingerprint (region, quality, delivery, guarantee, etc.). */
  specificationKey: string;
  enabled: boolean;
};

export type UnifiedSupplierService = {
  serviceId: string;
  name: string;
  category: string;
  specificationKey: string;
  mappings: SupplierProductMapping[];
};

export type CatalogValidationIssue = {
  code: "empty_field" | "duplicate_provider_product" | "conflicting_specification";
  serviceId?: string;
  provider?: SupplierProvider;
  providerProductId?: string;
  message: string;
};

export type CatalogValidationResult = {
  ok: boolean;
  issues: CatalogValidationIssue[];
};

/**
 * Validate manually curated mappings before they are used by a catalog or
 * pricing engine. Same provider product must not point at multiple services;
 * one service cannot combine products with different spec fingerprints.
 */
export function validateSupplierMappings(
  mappings: SupplierProductMapping[],
): CatalogValidationResult {
  const issues: CatalogValidationIssue[] = [];
  const seenProducts = new Map<string, string>();
  const serviceSpecs = new Map<string, string>();

  for (const mapping of mappings) {
    const provider = String(mapping.provider ?? "").trim();
    const productId = String(mapping.providerProductId ?? "").trim();
    const serviceId = String(mapping.serviceId ?? "").trim();
    const providerName = String(mapping.providerName ?? "").trim();
    const specificationKey = String(mapping.specificationKey ?? "").trim();

    if (!provider || !SUPPLIER_PROVIDERS.includes(mapping.provider) ||
        !productId || !serviceId || !providerName || !specificationKey) {
      issues.push({
        code: "empty_field",
        serviceId: serviceId || undefined,
        provider: SUPPLIER_PROVIDERS.includes(mapping.provider) ? mapping.provider : undefined,
        providerProductId: productId || undefined,
        message: "كل ربط يحتاج مزوداً ومعرّف منتج وserviceId واسم المنتج ومفتاح مواصفات موثقاً.",
      });
      continue;
    }

    const productKey = `${provider}:${productId}`;
    const previousService = seenProducts.get(productKey);
    if (previousService && previousService !== serviceId) {
      issues.push({
        code: "duplicate_provider_product",
        serviceId,
        provider: mapping.provider,
        providerProductId: productId,
        message: "معرّف المنتج نفسه مربوط بأكثر من خدمة NOVATEK.",
      });
    } else {
      seenProducts.set(productKey, serviceId);
    }

    const previousSpec = serviceSpecs.get(serviceId);
    if (previousSpec && previousSpec !== specificationKey) {
      issues.push({
        code: "conflicting_specification",
        serviceId,
        provider: mapping.provider,
        providerProductId: productId,
        message: "لا يمكن دمج خدمات بمواصفات مختلفة تحت الخدمة الموحدة نفسها.",
      });
    } else {
      serviceSpecs.set(serviceId, specificationKey);
    }
  }

  return { ok: issues.length === 0, issues };
}

/** Build a storefront-oriented grouping only after mapping validation passes. */
export function groupUnifiedServices(
  services: Array<Omit<UnifiedSupplierService, "mappings">>,
  mappings: SupplierProductMapping[],
): UnifiedSupplierService[] {
  const validation = validateSupplierMappings(mappings);
  if (!validation.ok) {
    throw new Error(`Invalid supplier catalog mappings: ${validation.issues.map((issue) => issue.code).join(", ")}`);
  }

  const serviceById = new Map(services.map((service) => [service.serviceId, service]));
  const grouped = new Map<string, SupplierProductMapping[]>();

  for (const mapping of mappings) {
    if (!mapping.enabled) continue;
    if (!serviceById.has(mapping.serviceId)) continue;
    const current = grouped.get(mapping.serviceId) ?? [];
    current.push(mapping);
    grouped.set(mapping.serviceId, current);
  }

  return services.map((service) => ({
    ...service,
    mappings: (grouped.get(service.serviceId) ?? []).sort(
      (a, b) => SUPPLIER_PROVIDERS.indexOf(a.provider) - SUPPLIER_PROVIDERS.indexOf(b.provider),
    ),
  }));
}
