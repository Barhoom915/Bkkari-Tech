import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase-server";
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "سجّل دخول أولاً" }, { status: 401 });
  const subscription = await request.json();
  const { error } = await supabase.from("push_subscriptions").upsert({ user_id: user.id, endpoint: subscription.endpoint, subscription, updated_at: new Date().toISOString() }, { onConflict: "endpoint" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
