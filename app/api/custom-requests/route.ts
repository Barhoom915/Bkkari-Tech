import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase-server";

const clean = (value: unknown, max = 500) => String(value ?? "").trim().slice(0, max);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type = body.request_type === "playstation" ? "playstation" : "pc_build";
    const customerName = clean(body.customer_name, 120);
    const customerPhone = clean(body.customer_phone, 40);
    if (customerName.length < 2 || customerPhone.length < 6) {
      return NextResponse.json({ error: "اكتب الاسم ورقم التواصل بشكل صحيح." }, { status: 400 });
    }

    const supabase = await createClient();
    const payload = {
      request_number: null,
      request_type: type,
      category: clean(body.category, 100),
      variant: clean(body.variant, 120),
      cpu: clean(body.cpu, 120),
      gpu: clean(body.gpu, 120),
      ram: clean(body.ram, 80),
      storage: clean(body.storage, 120),
      monitor: clean(body.monitor, 120),
      accessories: clean(body.accessories, 300),
      budget: body.budget ? Number(body.budget) : null,
      ps_storage: clean(body.ps_storage, 80),
      ps_condition: clean(body.ps_condition, 80),
      customer_name: customerName,
      customer_phone: customerPhone,
      governorate: clean(body.governorate, 80),
      city_area: clean(body.city_area, 120),
      notes: clean(body.notes, 1000),
    };

    const { data, error } = await supabase.from("custom_requests").insert(payload).select("id,request_number").single();
    if (error || !data) return NextResponse.json({ error: "تعذر إرسال الطلب. تأكد من تشغيل SQL الخاص بالطلبات المخصصة." }, { status: 500 });
    return NextResponse.json({ ok: true, request_number: data.request_number || `REQ-${String(data.id).padStart(4, "0")}` });
  } catch {
    return NextResponse.json({ error: "الطلب غير صالح." }, { status: 400 });
  }
}
