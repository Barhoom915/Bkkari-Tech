import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase-server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ data: [], unread: 0 });

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("id,title,body,href,kind,created_at")
    .or(`target_user_id.is.null,target_user_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) return NextResponse.json({ data: [], unread: 0 });

  const ids = (notifications ?? []).map(n => n.id);
  const { data: reads } = ids.length
    ? await supabase.from("notification_reads").select("notification_id").eq("user_id", user.id).eq("is_read", true).in("notification_id", ids)
    : { data: [] as { notification_id: string }[] };
  const readSet = new Set((reads ?? []).map(r => r.notification_id));
  const unread = (notifications ?? []).filter(n => !readSet.has(n.id)).length;
  return NextResponse.json({ data: notifications ?? [], unread });
}

export async function PATCH() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const { data: notifications } = await supabase.from("notifications").select("id").or(`target_user_id.is.null,target_user_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(30);
  if (notifications?.length) await supabase.from("notification_reads").upsert(notifications.map(n => ({ notification_id: n.id, user_id: user.id, is_read: true, read_at: new Date().toISOString() })), { onConflict: "notification_id,user_id" });
  return NextResponse.json({ ok: true });
}
