/**
 * NOVATEK V98.31 — provider payload schema inspection.
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
  if (value === null || typeof value === "number" || typeof value === "boolean") {
    if (typeof value === "number" && !Number.isFinite(value)) return undefined;
    return value;
  }
  // Do not echo arbitrary provider strings into diagnostic responses. Field paths
  // and types are enough to map the schema without exposing customer/account data.
  if (typeof value === "string") {
    return value.length > 80 ? value.slice(0, 77) + "..." : value;
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
    const types = new Set(existing?.types ?? []);
    types.add(typeOf(child));
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
 * Find candidate arrays containing object records. This is structural discovery
 * only; it does not claim that a candidate is a product/orderable list.
 */
function findArrayPaths(value: unknown, path: string, depth: number, output: string[]) {
  if (depth > 4) return;
  if (Array.isArray(value)) {
    if (value.length > 0 && value.slice(0, 3).some(isRecord)) output.push(path || "$");
    // Inspect only a small sample to keep diagnostics bounded.
    for (let index = 0; index < Math.min(value.length, 2); index += 1) {
      findArrayPaths(value[index], `${path}[${index}]`, depth + 1, output);
    }
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    const nextPath = path ? `${path}.${key}` : key;
    findArrayPaths(child, nextPath, depth + 1, output);
  }
}

/** Resolve dotted paths with array indexes, e.g. data.groups[0].products. */
function readPath(root: unknown, path: string): unknown {
  if (path === "$") return root;
  const tokens = path.match(/[^.[\]]+|\[(\d+)\]/g) ?? [];
  let current: unknown = root;
  for (const rawToken of tokens) {
    const token = rawToken.startsWith("[") ? rawToken.slice(1, -1) : rawToken;
    if (Array.isArray(current) && /^\d+$/.test(token)) {
      current = current[Number(token)];
    } else if (isRecord(current)) {
      current = current[token];
    } else {
      return undefined;
    }
  }
  return current;
}

export function inspectCatalogPayload(payload: unknown): CatalogSchemaSummary {
  const candidatePaths: string[] = [];
  findArrayPaths(payload, "", 0, candidatePaths);

  // Prefer a top-level candidate, then the shallowest path, rather than relying
  // on object insertion order or accidentally selecting a nested metadata array.
  const productArrayPaths = [...new Set(candidatePaths)].sort((a, b) => {
    const depth = (path: string) => (path.match(/\.|\[/g) ?? []).length;
    return depth(a) - depth(b) || a.localeCompare(b);
  });
  const samplePath = productArrayPaths[0];
  const candidate = samplePath ? readPath(payload, samplePath) : undefined;
  const sample = Array.isArray(candidate) ? candidate : [];

  const shapes = new Map<string, JsonFieldShape>();
  for (const row of sample.slice(0, 5)) walkProductPaths(row, "", 0, shapes);

  return {
    rootType: typeOf(payload),
    productArrayPaths: productArrayPaths.slice(0, 30),
    sampleProductPaths: [...shapes.values()].sort((a, b) => a.path.localeCompare(b.path)).slice(0, 150),
    sampleCount: Math.min(sample.length, 5),
  };
}
