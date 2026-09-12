import { supabase } from "@/app/lib/supabase";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import SearchResults from "./SearchResults";
export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string}>}){const {q=''}=await searchParams; const {data}=await supabase.from('laptops').select('*').eq('is_available',true).order('created_at',{ascending:false}).limit(50); return <><Header/><main className="mx-auto max-w-6xl px-4 py-12 sm:px-6" dir="rtl"><h1 className="text-3xl font-extrabold text-ink">البحث</h1><p className="mt-2 text-sm text-ink-soft">ابحث بالاسم أو الشركة أو المعالج أو RAM أو التخزين أو GPU أو SKU.</p><SearchResults laptops={data??[]} initialQuery={q}/></main><Footer/></>}
