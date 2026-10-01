"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/app/lib/supabase-browser";

export default function FavoriteButton({ laptopId, className = "" }: { laptopId: number; className?: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [active, setActive] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  useEffect(() => { let alive=true; void (async()=>{ const {data:{user}}=await supabase.auth.getUser(); if(!alive)return; setUserId(user?.id??null); if(user){const {data}=await supabase.from("wishlists").select("id").eq("user_id",user.id).eq("laptop_id",laptopId).maybeSingle(); if(alive)setActive(Boolean(data));} setChecking(false); })(); return()=>{alive=false}; },[laptopId,supabase]);
  async function toggle(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (checking) return;
    if (!userId) { window.location.href=`/login?next=/laptops/${laptopId}`; return; }
    const next=!active; setActive(next);
    const result = next ? await supabase.from("wishlists").insert({user_id:userId,laptop_id:laptopId}) : await supabase.from("wishlists").delete().eq("user_id",userId).eq("laptop_id",laptopId);
    if(result.error) setActive(!next);
  }
  return <motion.button type="button" whileTap={{scale:.88}} onClick={toggle} aria-label={active?"إزالة من المفضلة":"إضافة للمفضلة"} aria-pressed={active} className={`favorite-button ${active?"is-favorite":""} ${className}`}><span>{active?"♥":"♡"}</span></motion.button>;
}
