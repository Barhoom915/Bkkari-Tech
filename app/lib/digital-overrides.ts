import { supabase } from "@/app/lib/supabase";

export type DigitalOverride = {
  product_id: string; custom_name: string | null; custom_price: number | null; custom_category: string | null;
  custom_description: string | null; custom_image: string | null; is_active: boolean;
};

export function groupKeyFor(product: { categories?: string[] }): string {
  const cats = product.categories ?? [];
  // آخر عنصر بالمصفوفة هو أدق تصنيف (التصنيف الفرعي، متل "PUBG Mobile A")
  return cats.length > 0 ? cats[cats.length - 1] : "عام";
}

export async function getDigitalOverrides(): Promise<Map<string, DigitalOverride>> {
  const { data } = await supabase.from("digital_service_overrides").select("product_id,custom_name,custom_price,custom_category,custom_description,custom_image,is_active").eq("is_active", true);
  return new Map<string, DigitalOverride>((data ?? []).map((x: DigitalOverride) => [String(x.product_id), x]));
}

export async function getGroupOverrides(): Promise<Map<string, string>> {
  const { data } = await supabase.from("digital_group_overrides").select("group_key,custom_image");
  return new Map<string, string>((data ?? []).filter((x) => x.custom_image).map((x) => [x.group_key, x.custom_image as string]));
}

export function applyDigitalOverride<T extends { id: string|number; name: string; price: number|string; thumbnail?: string|null; categories?: string[] }>(
  product: T,
  override?: DigitalOverride,
  groupOverrides?: Map<string, string>
) {
  // ما منستخدم صورة SatoFill (thumbnail) أبداً بواجهة الزبون -- بس صورنا الخاصة
  const groupImage = groupOverrides?.get(groupKeyFor(product)) ?? null;
  const finalImage = override?.custom_image || groupImage || null;

  if (!override) return { ...product, thumbnail: finalImage };
  return {
    ...product,
    name: override.custom_name || product.name,
    price: override.custom_price ?? product.price,
    thumbnail: finalImage,
    categories: override.custom_category ? [override.custom_category] : product.categories,
    custom_store_description: override.custom_description || null,
  };
}
