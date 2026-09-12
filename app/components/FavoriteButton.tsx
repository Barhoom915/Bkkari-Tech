"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/app/lib/supabase-browser";

export default function FavoriteButton({ laptopId, className = "" }: { laptopId: number; className?: string }) {
  const supabase = createClient();
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("wishlists").select("id").eq("user_id", user.id).eq("laptop_id", laptopId).maybeSingle();
      if (alive) setActive(!!data);
    })();
    return () => { alive = false; };
  }, [laptopId, supabase]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = `/login?next=/laptops/${laptopId}`; return; }
    if (active) {
      const { error } = await supabase.from("wishlists").delete().eq("user_id", user.id).eq("laptop_id", laptopId);
      if (!error) setActive(false);
    } else {
      const { error } = await supabase.from("wishlists").insert({ user_id: user.id, laptop_id: laptopId });
      if (!error) setActive(true);
    }
    setBusy(false);
  }

  return <motion.button type="button" whileTap={{ scale: .82 }} onClick={toggle} aria-label={active ? "إزالة من المفضلة" : "إضافة للمفضلة"} aria-pressed={active} className={`favorite-button ${active ? "is-favorite" : ""} ${className}`}>
    <span>{active ? "♥" : "♡"}</span>
  </motion.button>;
}
