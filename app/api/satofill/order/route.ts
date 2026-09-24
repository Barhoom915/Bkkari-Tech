import { NextResponse } from "next/server";
import { createClient, getServiceClient } from "@/app/lib/supabase-server";
import { satofill, getSatoFillStorePrice, isSatoFillBlocked, isSatoFillChatProduct } from "@/app/lib/satofill";
import { applyDigitalOverride, getDigitalOverrides } from "@/app/lib/digital-overrides";

export async function POST(req: Request) {
  try {
    const sb = await createClient();
    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "سجّل دخول أولاً" }, { status: 401 });
    const body = await req.json();
    const productId = String(body.productId || "");
    const quantity = Math.max(1, Number(body.quantity || 1));
    const customFields = body.customFields && typeof body.customFields === "object" ? body.customFields : {};
    const clientRequestId = String(body.clientRequestId || crypto.randomUUID());
    if (!productId) return NextResponse.json({ error: "رقم الخدمة مفقود" }, { status: 400 });

    const service = getServiceClient();
    const existing = await service.from("digital_service_orders").select("order_number,satofill_order_id,status,total,response_data").eq("client_request_id", clientRequestId).maybeSingle();
    if (existing.data) return NextResponse.json({ ok: true, duplicate: true, orderNumber: existing.data.order_number, satofillOrderId: existing.data.satofill_order_id, status: existing.data.status, total: existing.data.total, response: existing.data.response_data });

    const product = await satofill.getProduct(productId);
    if (!product || product.available === false) return NextResponse.json({ error: "الخدمة غير متوفرة حالياً" }, { status: 400 });
    if (isSatoFillBlocked(`${product.name} ${(product.categories || []).join(" ")}`)) return NextResponse.json({ error: "هالخدمة غير متاحة ضمن المتجر" }, { status: 400 });
    const overrides = await getDigitalOverrides();
    if (overrides.get(productId)?.is_active === false) return NextResponse.json({ error: "الخدمة غير متاحة حالياً" }, { status: 400 });
    const display = applyDigitalOverride(product, overrides.get(productId));
    const min = Math.max(1, Number(product.min_quantity || 1));
    const max = Math.max(min, Number(product.max_quantity || 1));
    if (!Number.isFinite(quantity) || quantity < min || quantity > max) return NextResponse.json({ error: `الكمية لازم تكون بين ${min} و ${max}` }, { status: 400 });
    for (const f of product.custom_fields || []) if (f.required !== false && !String(customFields[f.key] ?? "").trim()) return NextResponse.json({ error: `الحقل ${f.label} مطلوب` }, { status: 400 });
    const unit = Number(getSatoFillStorePrice(display.price, isSatoFillChatProduct(display)));
    const total = Number((unit * quantity).toFixed(2));
    if (!Number.isFinite(total) || total < 0) return NextResponse.json({ error: "سعر الخدمة غير صالح" }, { status: 400 });

    const orderNumber = `SF-${Date.now().toString().slice(-9)}`;
    const { data: debit, error: debitError } = await service.rpc("debit_wallet_for_service", { p_user_id: auth.user.id, p_amount: total, p_reference: orderNumber });
    const d = Array.isArray(debit) ? debit[0] : debit;
    if (debitError || !d?.ok) return NextResponse.json({ error: d?.message || "رصيد المحفظة غير كافي" }, { status: 400 });

    let upstream: any;
    try {
      upstream = await satofill.createOrder({ product_id: Number(product.id), quantity, custom_fields: customFields });
    } catch (e) {
      await service.rpc("refund_wallet_for_service", { p_user_id: auth.user.id, p_amount: total, p_reference: orderNumber });
      return NextResponse.json({ error: e instanceof Error ? e.message : "تعذر تنفيذ الطلب الرقمي، وتم استرجاع الرصيد" }, { status: 502 });
    }
    const data = upstream?.data ?? upstream;
    const satofillOrderId = String(data?.order_id ?? "");
    if (!satofillOrderId) {
      await service.rpc("refund_wallet_for_service", { p_user_id: auth.user.id, p_amount: total, p_reference: orderNumber });
      return NextResponse.json({ error: "مزود الخدمة لم يرجع رقم طلب صالح، وتم استرجاع الرصيد" }, { status: 502 });
    }
    const status = String(data?.status || "processing");
    const { error: insertError } = await service.from("digital_service_orders").insert({ user_id: auth.user.id, client_request_id: clientRequestId, order_number: orderNumber, satofill_order_id: satofillOrderId, product_id: productId, product_name: display.name, quantity, custom_fields: customFields, total, currency: product.currency_name || "USD", status, response_data: data });
    if (insertError) {
      // The wallet debit is already committed; preserve the external order reference in the response for reconciliation.
      console.error("digital_service_orders insert failed", insertError);
      return NextResponse.json({ ok: true, orderNumber, satofillOrderId, status, warning: "تم تنفيذ الطلب، لكن تعذر حفظ سجل الطلب تلقائياً" });
    }
    await service.from("wallet_transactions").update({ status: "completed" }).eq("user_id", auth.user.id).eq("reference", orderNumber).eq("type", "purchase");
    return NextResponse.json({ ok: true, orderNumber, satofillOrderId, status, balance: Number(d.new_balance ?? 0) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "تعذر تنفيذ الطلب" }, { status: 500 });
  }
}
