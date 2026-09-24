import { supabase } from "@/app/lib/supabase";
import { satofill, isSatoFillBlocked, getSatoFillStorePrice, isSatoFillChatProduct } from "@/app/lib/satofill";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import SearchResults from "./SearchResults";

export const dynamic = "force-dynamic";
export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string}>}) {
  const {q=""}=await searchParams;
  const [{data:laptops}, {data:playstation}, digital] = await Promise.all([
    supabase.from("laptops").select("*").eq("is_available",true).order("created_at",{ascending:false}),
    supabase.from("playstation_products").select("*").eq("is_available",true).order("created_at",{ascending:false}),
    satofill.getProducts().catch(()=>[]),
  ]);
  const digitalResults = digital.filter(p=>p.available!==false && !isSatoFillBlocked(`${p.name} ${(p.categories??[]).join(" ")}`)).map(p=>({id:String(p.id),name:p.name,price:Number(getSatoFillStorePrice(p.price,isSatoFillChatProduct(p),5))||0,image:p.thumbnail??null,type:"digital",href:`/services/product/${p.id}`,meta:(p.categories??[]).join(" • ")}));
  return <><Header/><main className="v71-search-page" dir="rtl"><div className="v71-search-head"><span>SEARCH EVERYTHING</span><h1>البحث في كل المتجر</h1><p>لابتوبات، PlayStation، قبضات، PUBG، Free Fire، اشتراكات، بطاقات وخدمات رقمية.</p></div><SearchResults laptops={(laptops??[]).filter((l:any)=>Boolean(l.images?.[0]))} playstation={playstation??[]} digital={digitalResults} initialQuery={q}/></main><Footer/></>;
}
