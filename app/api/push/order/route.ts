import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient, getServiceClient } from "@/app/lib/supabase-server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const orderNumber = String(body.order_number || "").trim();
  if (!orderNumber) return NextResponse.json({ error: "رقم الطلب مطلوب" }, { status: 400 });
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return NextResponse.json({ ok: true, pushSent: 0, configured: false });
  const service = getServiceClient();
  webpush.setVapidDetails(subject, publicKey, privateKey);
  let pushSent = 0;
  const payloadCustomer = JSON.stringify({ title: "📦 تم استلام طلبك", body: `طلبك ${orderNumber} وصلنا وعم نراجعه.`, href: "/track", icon: "/brand/logo.png" });
  const { data: customerSubscriptions } = await service.from("push_subscriptions").select("id,subscription").eq("user_id", user.id);
  for (const row of customerSubscriptions ?? []) {
    try { await webpush.sendNotification(row.subscription as webpush.PushSubscription, payloadCustomer); pushSent++; }
    catch (err: any) { if (err?.statusCode === 404 || err?.statusCode === 410) await service.from("push_subscriptions").delete().eq("id", row.id); }
  }

  // Notify every active admin who enabled Push on the dashboard.
  const { data: admins } = await service.from("admin_users").select("email,auth_user_id").eq("is_active", true);
  const { data: usersPage } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const adminIds = new Set<string>();
  for (const a of admins ?? []) {
    if (a.auth_user_id) adminIds.add(a.auth_user_id);
    const match = (usersPage.users ?? []).find((u) => (u.email || "").toLowerCase() === String(a.email || "").toLowerCase());
    if (match?.id) adminIds.add(match.id);
  }
  for (const adminId of adminIds) {
    const { data: adminSubscriptions } = await service.from("push_subscriptions").select("id,subscription").eq("user_id", adminId);
    for (const row of adminSubscriptions ?? []) {
      try { await webpush.sendNotification(row.subscription as webpush.PushSubscription, JSON.stringify({ title: "🔔 طلب جديد في بكاري تيك", body: `وصل طلب جديد ${orderNumber}. افتح لوحة التحكم لمراجعة التفاصيل.`, href: "/orders", icon: "/brand/logo.png" })); }
      catch (err: any) { if (err?.statusCode === 404 || err?.statusCode === 410) await service.from("push_subscriptions").delete().eq("id", row.id); }
    }
  }
  return NextResponse.json({ ok: true, pushSent, configured: true });
}
