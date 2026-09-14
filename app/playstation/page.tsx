import Header from "../components/Header";
import Footer from "../components/Footer";
import PlaystationCatalog from "../components/PlaystationCatalog";
import { supabase } from "../lib/supabase";
import Link from "next/link";
import { getSiteSetting } from "../lib/site-settings";

export const dynamic = "force-dynamic";

export default async function PlaystationPage(){
 const [{data,error}, media] = await Promise.all([
   supabase.from("playstation_products").select("*").eq("is_available",true).order("created_at",{ascending:false}),
   getSiteSetting<any>("storefront_media", {})
 ]);
 if(error) console.error(error.message);
 const products=(data??[]) as any[];
 const filterImages = media?.playstation_filters || {};
 return <div className="bkk-store-page"><Header/><main className="laptops-v18-page unified-page" dir="rtl">
  <div className="section-breadcrumb"><Link href="/">الرئيسية</Link><span>»</span><strong>PlayStation</strong></div>
  <div className="laptop-page-wrap"><PlaystationCatalog products={products} filterImages={filterImages}/></div>
 </main><Footer/></div>
}
