/**
 * NOVATEK V98.30 — provider payload schema inspection.
 *
 * Admin-only diagnostics: describes JSON structure and candidate field paths
 * without assigning semantic meaning to price/currency/availability fields.
 * It never returns environment variables, auth headers, or provider tokens.
 */

export type JsonFieldShape = {
  path: string;
  types: string[];
  example?: string | number | boolean | null;
};

export type CatalogSchemaSummary = {
  rootType: string;
  productArrayPaths: string[];
  sampleProductPaths: JsonFieldShape[];
  sampleCount: number;
};

function typeOf(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "number") return Number.isFinite(value) ? "number" : "non_finite_number";
  return typeof value;
}

function compactExample(value: unknown): string | number | boolean | null | undefined {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    if (typeof value === "string") return value.length > 80 ? value.slice(0, 77) + "..." : value;
    if (typeof value === "number" && !Number.isFinite(value)) return undefined;
    return value;
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function walkProductPaths(value: unknown, path: string, depth: number, out: Map<string, JsonFieldShape>) {
  if (!isRecord(value) || depth > 3) return;
  for (const [key, child] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    const existing = out.get(childPath);
    const childType = typeOf(child);
    const types = new Set(existing?.types ?? []);
    types.add(childType);
    const example = compactExample(child);
    out.set(childPath, {
      path: childPath,
      types: [...types].sort(),
      ...(existing?.example !== undefined ? { example: existing.example } :
        example !== undefined ? { example } : {}),
    });
    if (isRecord(child)) walkProductPaths(child, childPath, depth + 1, out);
  }
}

/**
 * Locate arrays that look like product lists by shape only. These are
 * diagnostics, not a promise that an array represents orderable products.
 */
function findArrayPaths(value: unknown, path: string, depth: number, output: string[]) {
  if (depth > 4 || !isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    const nextPath = path ? `${path}.${key}` : key;
    if (Array.isArray(child)) {
      if (child.length > 0 && child.slice(0, 3).some(isRecord)) output.push(nextPath);
      for (let index = 0; index < Math.min(child.length, 2); index += 1) {
        findArrayPaths(child[index], `${nextPath}[${index}]`, depth + 1, output);
      }
    } else if (isRecord(child)) {
      findArrayPaths(child, nextPath, depth + 1, output);
    }
  }
}

export function inspectCatalogPayload(payload: unknown): CatalogSchemaSummary {
  const productArrayPaths: string[] = [];
  findArrayPaths(payload, "", 0, productArrayPaths);

  const samplePath = productArrayPaths[0];
  let sample: unknown[] = [];
  if (samplePath) {
    sample = samplePath.split(".").reduce<unknown>((current, key) => {
      if (!current || typeof current !== "object") return undefined;
      return (current as Record<string, unknown>)[key];
    }, payload) as unknown[] ?? [];
  }

  const shapes = new Map<string, JsonFieldShape>();
  for (const row of sample.slice(0, 5)) walkProductPaths(row, "", 0, shapes);

  return {
    rootType: typeOf(payload),
    productArrayPaths: [...new Set(productArrayPaths)].sort(),
    sampleProductPaths: [...shapes.values()].sort((a, b) => a.path.localeCompare(b.path)),
    sampleCount: Math.min(sample.length, 5),
  };
}
