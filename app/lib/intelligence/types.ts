export type ProviderName = "cache" | "serpapi" | "tavily" | "pricesapi" | "gemini" | "store";

export type SourceRef = {
  provider: Exclude<ProviderName, "cache" | "store"> | "store";
  title: string;
  url?: string;
};

export type ExternalLaptopData = {
  query: string;
  summary: string;
  facts: Record<string, string | number | boolean | null>;
  prices?: Array<{ seller?: string; price?: number; currency?: string; url?: string }>;
  sources: SourceRef[];
  fetchedAt: string;
};

export type ComparisonPreferences = {
  uses: string[];
  priorities: string[];
  weight: "low" | "medium" | "high";
  screen: string[];
  performance: "light" | "medium" | "strong" | "maximum";
  gaming: "none" | "light" | "medium" | "heavy";
  mobility: "low" | "medium" | "high";
  budget: "lowest" | "value" | "fixed";
};
