import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { PlaystationProductRail } from "../components/StorefrontRails";
import { supabase } from "../lib/supabase";
import PlaystationRequestForm from "./PlaystationRequestForm";

export default async function PlaystationPage(){
 const {data}=await supabase.from("playstation_products").select("*").eq("is_available",true).order("created_at",{ascending:false});
 const products=(data??[]) as any[]; const ps4=products.filter(p=>p.family==="ps4"); const ps5=products.filter(p=>p.family==="ps5");
 return <div className="bkk-store-page"><Header/><main className="custom-page">
  <section className="custom-hero ps-hero"><div><span className="custom-kicker">PLAYSTATION / STORE</span><h1>PlayStation مثل قسم اللابتوبات تماماً.</h1><p>اختار PS4 أو PS5 من الدوائر، وشوف المنتجات اللي مضافة من لوحة التحكم. كل منتج إلو صورته وسعره ومخزونه.</p></div><div className="ps-hero-stack"><b>PS5</b><b>PS4</b></div></section>
  <section className="ps-family-grid"><a href="#ps5" className="active"><span className="ps-family-logo ps5-logo">PS5</span><div><b>PlayStation 5</b><small>كل منتجات PS5</small></div></a><a href="#ps4"><span className="ps-family-logo ps4-logo">PS4</span><div><b>PlayStation 4</b><small>كل منتجات PS4</small></div></a></section>
  {ps5.length>0&&<section id="ps5" className="pl-home-section"><div className="pl-section-title"><div><h2>PS5</h2><p>المنتجات المضافة من لوحة التحكم</p></div></div><PlaystationProductRail products={ps5}/></section>}
  {ps4.length>0&&<section id="ps4" className="pl-home-section"><div className="pl-section-title"><div><h2>PS4</h2><p>المنتجات المضافة من لوحة التحكم</p></div></div><PlaystationProductRail products={ps4} reverse/></section>}
  {!products.length&&<section className="info-empty">ما في منتجات PlayStation حالياً. أضف PS4 أو PS5 من لوحة التحكم حتى تظهر هون.</section>}
  <PlaystationRequestForm/>
 </main><Footer/></div>
}
