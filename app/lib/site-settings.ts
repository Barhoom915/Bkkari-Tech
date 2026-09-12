import { supabase } from "./supabase";

export async function getSiteSetting<T>(key: string, fallback: T): Promise<T> {
  const { data, error } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
  if (error || !data?.value) return fallback;
  return data.value as T;
}

export async function getChatMarkupPercent(): Promise<number> {
  const value = await getSiteSetting<number | string>("chat_markup_percent", 5);
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 5;
}

export async function getDigitalCategoryOrder(): Promise<string[]> {
  const value = await getSiteSetting<string[]>("digital_category_order", []);
  return Array.isArray(value) ? value : [];
}

export function sortByOrder<T extends { name: string }>(items: T[], order: string[]): T[] {
  if (order.length === 0) return items;
  const rank = new Map(order.map((name, i) => [name.trim(), i]));
  return [...items].sort((a, b) => {
    const ra = rank.has(a.name) ? rank.get(a.name)! : Infinity;
    const rb = rank.has(b.name) ? rank.get(b.name)! : Infinity;
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name, "ar");
  });
}
