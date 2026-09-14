import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import PlaystationProductActions from "./ProductActions";
import { supabase } from "@/app/lib/supabase";

export const dynamic = "force-dynamic";

export default async function PlaystationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabase.from("playstation_products").select("*").eq("id", id).maybeSingle();
  if (error || !data) notFound();
  const p = data as any;
  const isController = p.product_type === "controller"; const isAccessory = p.product_type === "accessory";
  const out = !p.is_available;
  const specs = [
    ["الفئة", p.family?.toUpperCase()],
    [isController ? "نوع المنتج" : "الموديل", p.model],
    [isController ? "الاتصال" : "التخزين المتاح", isController ? p.controller_connection : (p.storage_options||[]).join(" • ")],
    ["الحالة", p.condition],
    ...(!isAccessory && p.controller_count ? [["المحتويات", p.controller_count === 2 ? "قبضتين" : "قبضة أساسية"]] : []),
    ...(!isController && p.modification_status ? [["التعديل", p.modification_status === "modified" ? `معدل${(p.modification_types||[]).length ? ` — ${(p.modification_types||[]).join(" • ")}` : ""}` : "غير معدل"]] : []),
  ].filter(([, value]) => value);

  return <>
    <Header />
    <main className="ps-detail-page" dir="rtl">
      <div className="section-breadcrumb"><Link href="/">الرئيسية</Link><span>»</span><Link href="/playstation">PlayStation</Link><span>»</span><strong>{p.name}</strong></div>
      <div className="ps-detail-wrap">
        <div className="ps-detail-gallery">
          {p.image ? <img src={p.image} alt={p.name} /> : <div className="unified-placeholder"><b>{isController ? "🎮" : p.family.toUpperCase()}</b><span>{p.model || "PlayStation"}</span></div>}
        </div>
        <div className="ps-detail-info">
          <span className="ps-detail-kicker">PLAYSTATION</span>
          <h1>{p.name}</h1>
          {p.is_offer && <span className="ps-detail-offer">عرض</span>}
          <div className="ps-detail-price"><strong>${Number(p.price).toFixed(0)}</strong>{p.prev_price != null && Number(p.prev_price)>Number(p.price) && <del>${Number(p.prev_price).toFixed(0)}</del>}</div>
          {p.details && <p className="ps-detail-description">{p.details}</p>}
          <div className="ps-detail-specs">{specs.map(([label,value]) => <div key={label}><span>{label}</span><b>{String(value)}</b></div>)}</div>
          {p.included_options?.length ? <div className="ps-detail-gifts"><b>🎁 يشمل مع المنتج</b><div>{p.included_options.map((x:string,i:number)=><span key={i}>{x}</span>)}</div></div> : null}
          <div className="ps-detail-actions"><PlaystationProductActions product={p} disabled={out} /></div>
        </div>
      </div>
    </main>
    <Footer />
  </>;
}
